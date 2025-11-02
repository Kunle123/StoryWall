# Stripe Integration Setup Guide

This guide walks you through setting up Stripe for credit purchases in StoryWall.

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click **Sign Up** (or **Sign In** if you already have an account)
3. Complete the registration process
4. Verify your email address

## Step 2: Get Your API Keys

1. Once logged in, go to the [Stripe Dashboard](https://dashboard.stripe.com)
2. Click on **Developers** in the left sidebar
3. Click **API keys**
4. You'll see two keys:

### For Testing (Recommended First)
- **Publishable key** (starts with `pk_test_...`)
- **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

### For Production (After Testing)
- Switch to **Live mode** using the toggle in the top right
- Get your live keys (starts with `pk_live_...` and `sk_live_...`)

**Important:** Start with test keys to avoid charges during development!

## Step 3: Add Environment Variables

### Local Development (`.env.local`)

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # (See Step 4)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Railway Production

1. Go to your Railway project dashboard
2. Select your **web service** (not the database)
3. Go to the **Variables** tab
4. Click **+ New Variable** for each:

   - **Variable Name:** `STRIPE_SECRET_KEY`
   - **Value:** Your Stripe secret key (use `sk_live_...` for production, `sk_test_...` for testing)

   - **Variable Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Your webhook signing secret (from Step 4)

   - **Variable Name:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** Your Railway app URL (e.g., `https://storywall-production.up.railway.app`)

## Step 4: Set Up Webhook Endpoint

Webhooks notify your app when payments succeed. Here's how to set it up:

### Option A: Using Stripe CLI (Local Development)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe  # macOS
   # or download from https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_...`) and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

### Option B: Using Stripe Dashboard (Production)

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **+ Add endpoint**
3. Enter your endpoint URL:
   ```
   https://your-app-domain.railway.app/api/stripe/webhook
   ```
   Example: `https://storywall-production.up.railway.app/api/stripe/webhook`

4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (optional backup)

5. Click **Add endpoint**
6. Click on your new endpoint to view details
7. In the **Signing secret** section, click **Reveal** and copy the secret (starts with `whsec_...`)
8. Add this to your Railway environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test the Integration

### Test Mode (Recommended First)

1. Use test API keys (`sk_test_...`)
2. Use test card numbers from Stripe:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date, any 3-digit CVC, any ZIP

3. Test the flow:
   - Click the credits button in the header
   - Select a credit package
   - Use test card `4242 4242 4242 4242`
   - Complete payment
   - Check that credits are added to your account

### Verify Webhook is Working

1. Check Railway logs for webhook events:
   - Go to Railway → Your service → **Deployments** → View logs
   - Look for: `Added X credits to user...`

2. Or check Stripe Dashboard:
   - Go to **Developers → Webhooks**
   - Click your endpoint
   - View **Recent events** tab

## Step 6: Go Live (Production)

Once testing works:

1. Switch to **Live mode** in Stripe Dashboard
2. Get your live API keys
3. Update Railway environment variables:
   - Replace `STRIPE_SECRET_KEY` with live key (`sk_live_...`)
   - Create a new webhook endpoint for production
   - Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
4. Update `NEXT_PUBLIC_BASE_URL` to your production URL
5. Test with a real card (you can refund yourself)

## Credit Package Pricing

Current pricing:
- **Starter Pack:** 1,000 credits for $12.99
- **Popular Pack:** 2,000 credits for $19.99 (marked as popular)
- **Pro Pack:** 10,000 credits for $79.99

## Troubleshooting

### "Stripe is not configured"
- Check that `STRIPE_SECRET_KEY` is set in environment variables
- Restart your dev server or redeploy on Railway after adding variables

### "Webhook secret not configured"
- Add `STRIPE_WEBHOOK_SECRET` to environment variables
- For local: use Stripe CLI secret
- For production: use webhook endpoint secret from Stripe Dashboard

### Webhook not receiving events
- Verify webhook URL is correct (check Railway logs)
- Check webhook endpoint is active in Stripe Dashboard
- Ensure webhook secret matches in both places

### Credits not added after payment
- Check Railway logs for webhook events
- Verify `userId` is correctly stored in checkout session metadata
- Check that user exists in database with matching `clerkId`

### Payment succeeds but no credits
- Check webhook endpoint logs
- Verify `checkout.session.completed` event is being received
- Check that webhook secret verification passes

## Security Notes

- **Never commit API keys** to git
- Use test keys during development
- Use live keys only in production
- Webhook secret is critical - keep it secure
- Stripe handles PCI compliance automatically

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Check Railway logs for detailed error messages

