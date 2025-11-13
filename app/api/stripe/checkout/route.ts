import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Credit package pricing (in cents)
const CREDIT_PACKAGES: Record<string, { credits: number; price: number }> = {
  mini: { credits: 20, price: 149 }, // $1.49
  starter: { credits: 200, price: 1299 }, // $12.99
  pro: { credits: 2000, price: 7999 }, // $79.99
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

    console.log('[Checkout] Received request:', { priceId, credits, packageName });

    // Determine the package details - prioritize priceId over credits
    let packageDetails;
    // Ensure priceId is a valid string and exists in our packages
    const validPriceId = priceId && typeof priceId === 'string' && priceId.trim() !== '';
    if (validPriceId && CREDIT_PACKAGES[priceId]) {
      packageDetails = CREDIT_PACKAGES[priceId];
      console.log('[Checkout] Using package from priceId:', priceId, packageDetails);
    } else if (credits) {
      // Fallback: find package by credits (only if priceId not provided or invalid)
      if (validPriceId) {
        console.warn('[Checkout] priceId provided but not found in packages, falling back to credits lookup:', priceId);
      }
      packageDetails = Object.values(CREDIT_PACKAGES).find(pkg => pkg.credits === credits);
      if (!packageDetails) {
        console.error('[Checkout] No package found for credits:', credits);
        return NextResponse.json(
          { error: 'Invalid credit package' },
          { status: 400 }
        );
      }
      console.log('[Checkout] Using package from credits fallback:', packageDetails);
    } else {
      console.error('[Checkout] Missing package information');
      return NextResponse.json(
        { error: 'Missing package information' },
        { status: 400 }
      );
    }
    
    // Double-check: log the final package details being used
    console.log('[Checkout] Final package details:', {
      priceId: priceId || 'none',
      requestedCredits: credits || 'none',
      selectedCredits: packageDetails.credits,
      selectedPrice: packageDetails.price,
      packageName: packageName || 'none'
    });

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
        priceId: priceId || 'unknown',
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

