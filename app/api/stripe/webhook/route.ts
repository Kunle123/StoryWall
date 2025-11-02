import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing for webhook - Stripe needs raw body
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0', 10);

      if (!userId || !credits) {
        console.error('Missing userId or credits in session metadata', { userId, credits });
        return NextResponse.json({ received: true });
      }

      // Find user by Clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        console.error('User not found for Clerk ID:', userId);
        return NextResponse.json({ received: true });
      }

      // Add credits to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: credits,
          },
        },
      });

      console.log(`Added ${credits} credits to user ${user.id} (Clerk: ${userId})`);
    } else if (event.type === 'payment_intent.succeeded') {
      // Fallback: try to get credits from payment intent metadata
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const userId = paymentIntent.metadata?.userId;
      const credits = parseInt(paymentIntent.metadata?.credits || '0', 10);

      if (userId && credits) {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              credits: {
                increment: credits,
              },
            },
          });

          console.log(`Added ${credits} credits to user ${user.id} via payment_intent`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

