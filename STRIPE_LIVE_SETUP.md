# Stripe Live/Production Setup Guide

Quick reference for setting up Stripe in production mode.

## Required Environment Variables

Add these to **Railway** (Variables tab):

1. **STRIPE_SECRET_KEY**
   - Get from: Stripe Dashboard → Developers → API keys (Live mode)
   - Format: `sk_live_...`
   - ⚠️ **Never commit this to git!**

2. **STRIPE_WEBHOOK_SECRET**
   - Get from: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret
   - Format: `whsec_...`
   - ⚠️ **Never commit this to git!**

3. **NEXT_PUBLIC_BASE_URL**
   - Your production URL (e.g., `https://storywall.com`)
   - Used for redirect URLs after payment

## Quick Setup Steps

### 1. Get Live API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to Live mode** (toggle in top right)
3. Navigate to **Developers → API keys**
4. Copy your **Secret key** (`sk_live_...`)

### 2. Create Webhook Endpoint
1. In Stripe Dashboard (Live mode), go to **Developers → Webhooks**
2. Click **+ Add endpoint**
3. Enter endpoint URL: `https://storywall.com/api/stripe/webhook`
   - Replace with your actual Railway/production URL
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded` (optional)
5. Click **Add endpoint**
6. Click on the endpoint → **Signing secret** → **Reveal** → Copy (`whsec_...`)

### 3. Add to Railway
1. Railway Dashboard → Your project → Web service → **Variables** tab
2. Add/update each variable:
   - `STRIPE_SECRET_KEY` = `sk_live_YOUR_KEY`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_YOUR_SECRET`
   - `NEXT_PUBLIC_BASE_URL` = `https://storywall.com`

### 4. Test
1. Railway will auto-redeploy after adding variables
2. Test with a small real payment (you can refund it)
3. Check Railway logs for webhook events
4. Verify credits are added to user account

## Important Notes

- ⚠️ **Use Live keys only in production** (Railway)
- ⚠️ **Keep test keys for local development** (`.env.local`)
- ⚠️ **Never commit API keys to git**
- ✅ Webhook endpoint must match your production URL exactly
- ✅ Stripe handles PCI compliance automatically

## Troubleshooting

**"Stripe is not configured"**
- Check `STRIPE_SECRET_KEY` is set in Railway
- Redeploy after adding variables

**Webhook not receiving events**
- Verify webhook URL is correct in Stripe Dashboard
- Check webhook endpoint is active
- Verify `STRIPE_WEBHOOK_SECRET` matches in both places

**Credits not added after payment**
- Check Railway logs for webhook events
- Verify webhook endpoint is receiving `checkout.session.completed` events
- Check Stripe Dashboard → Webhooks → Recent events

## Support

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Railway Logs: Check your service → Deployments → View logs

