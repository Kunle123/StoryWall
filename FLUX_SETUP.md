# Flux Image Generation Setup

This guide explains how to set up Flux (via Replicate) for AI image generation in StoryWall.

## Why Flux?

- ✅ **Higher quality** - Better prompt adherence and more accurate historical depictions
- ✅ **Cheaper than DALL-E 3** - Flux Dev is ~$0.025-0.030 per image (vs $0.04 for DALL-E 3)
- ✅ **Much cheaper option available** - Flux Schnell is only $0.003 per image (13x cheaper than Dev!)
- ✅ **More flexible** - Better handles historical content without strict content policy restrictions
- ✅ **Better for timelines** - More accurate period details and historical context

## Step 1: Create Replicate Account

1. Go to https://replicate.com
2. Sign up for a free account
3. Add a payment method (required for API access, but very cheap - $0.001 per image)

## Step 2: Get API Token

1. Go to https://replicate.com/account/api-tokens
2. Click **Create token**
3. Copy your token (starts with `r8_...`)
4. Keep it secure - you'll need it for environment variables

## Step 3: Add to Environment Variables

### Local Development (`.env.local`)

```env
REPLICATE_API_TOKEN=r8_your_token_here
```

### Railway Production

1. Go to Railway Dashboard → Your Project → Variables
2. Click **+ New Variable**
3. Name: `REPLICATE_API_TOKEN`
4. Value: Your token (starts with `r8_...`)
5. Click **Add**

## Step 4: Verify Setup

After adding the token, restart your dev server:

```bash
npm run dev
```

Try generating images in the timeline editor. You should see logs like:

```
[Flux] Generating image for "Event Title"
[Flux] Prompt (XXX chars): ...
[Flux] Successfully generated image for "Event Title"
```

## Pricing

**Current Pricing (as of 2024):**

### Flux Dev (currently used):
- **Per image:** ~$0.025-0.030 (2.5-3 cents per image)
- **10 images:** ~$0.25-0.30 (25-30 cents)
- **20 images:** ~$0.50-0.60 (50-60 cents)
- **100 images:** ~$2.50-3.00

### Flux Schnell (much cheaper alternative):
- **Per image:** ~$0.003 (0.3 cents per image!)
- **10 images:** ~$0.03 (3 cents)
- **20 images:** ~$0.06 (6 cents) - This is close to your 1p target!
- **100 images:** ~$0.30 (30 cents)

**Note:** Pricing may vary by model version and can change. Check current pricing at:
- Flux Dev: https://replicate.com/black-forest-labs/flux-dev
- Flux Schnell: https://replicate.com/black-forest-labs/flux-schnell

**Recommendation:** Consider switching to `flux-schnell` for ~10x cost savings. It's faster and cheaper, though Dev may have slightly better quality.

Compare to DALL-E 3:
- **10 images:** $0.40 (DALL-E 3 is ~1.6x more expensive than Flux Dev)
- **Flux Schnell:** 10 images = $0.03 (13x cheaper than DALL-E 3!)

## Model Used

- **Current Model:** Flux Dev (`black-forest-labs/flux-dev`)
- **Alternative (cheaper):** Flux Schnell (`black-forest-labs/flux-schnell`) - $0.003 per image
- **Resolution:** 1024x1024 (square)
- **Format:** PNG
- **Quality:** 90%

## Troubleshooting

### "REPLICATE_API_TOKEN is not configured"
- Check `.env.local` has the token
- Restart dev server after adding
- For Railway: Verify variable is set correctly

### "Prediction timeout"
- Replicate may be slow during peak times
- This is rare - Flux usually generates in 2-5 seconds

### Images not generating
- Check Replicate account has credits
- Verify API token is valid
- Check server logs for detailed error messages

## Need Help?

1. Check Replicate status: https://status.replicate.com
2. View API docs: https://replicate.com/docs
3. Check your account: https://replicate.com/account

