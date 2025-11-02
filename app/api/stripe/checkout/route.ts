import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Credit package pricing (in cents)
const CREDIT_PACKAGES: Record<string, { credits: number; price: number }> = {
  starter: { credits: 1000, price: 1299 }, // $12.99
  popular: { credits: 2000, price: 1999 }, // $19.99
  pro: { credits: 10000, price: 7999 }, // $79.99
};

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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { credits, packageName, priceId } = body;

    // Determine the package details
    let packageDetails;
    if (priceId && CREDIT_PACKAGES[priceId]) {
      packageDetails = CREDIT_PACKAGES[priceId];
    } else if (credits) {
      // Fallback: find package by credits
      packageDetails = Object.values(CREDIT_PACKAGES).find(pkg => pkg.credits === credits);
      if (!packageDetails) {
        return NextResponse.json(
          { error: 'Invalid credit package' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Missing package information' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageName || 'Credit Pack'} - ${packageDetails.credits} Credits`,
              description: `${packageDetails.credits} credits for AI-powered timeline features`,
            },
            unit_amount: packageDetails.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/editor?success=true&credits=${packageDetails.credits}`,
      cancel_url: `${baseUrl}/editor?canceled=true`,
      metadata: {
        userId,
        credits: packageDetails.credits.toString(),
        packageName: packageName || 'Unknown',
      },
      // Allow payment even if user already has account
      payment_intent_data: {
        metadata: {
          userId,
          credits: packageDetails.credits.toString(),
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

