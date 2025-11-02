import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateUser } from '@/lib/db/users';

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
    // NOTE: Only process checkout.session.completed to avoid duplicate credit additions
    // Stripe fires both checkout.session.completed AND payment_intent.succeeded for the same payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0', 10);

      if (!userId || !credits) {
        console.error('[Webhook] Missing userId or credits in session metadata', { userId, credits });
        return NextResponse.json({ received: true });
      }

      // Get or create user (auto-creates if doesn't exist)
      const user = await getOrCreateUser(userId);

      // Get current credits before update (for logging)
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });

      // Add credits to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: credits,
          },
        },
      });

      const newCredits = (currentUser?.credits || 0) + credits;
      console.log(`[Webhook] Added ${credits} credits to user ${user.id} (Clerk: ${userId}). New balance: ${newCredits}`);
    } else if (event.type === 'payment_intent.succeeded') {
      // IGNORE: This event is fired after checkout.session.completed
      // Processing it would cause duplicate credit additions
      // Only using checkout.session.completed to ensure credits are added exactly once
      console.log('[Webhook] payment_intent.succeeded received but ignored (credits already processed via checkout.session.completed)');
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

