# Image Generation Models with Reference Image Support - Pricing Table

## Models That Accept Reference Images

### 1. **Flux (via Replicate)**

**Current Model in Use:** `flux-schnell`

| Model | Price per Image | Reference Image Support | Notes |
|-------|----------------|------------------------|-------|
| **Flux Schnell** | $0.003 (0.3¢) | ✅ Yes (via prompt URLs) | Currently used - fastest & cheapest |
| **Flux Dev** | $0.025-0.030 (2.5-3¢) | ✅ Yes (via prompt URLs) | Higher quality, slower |
| **Flux Pro** | ~$0.05-0.10 | ✅ Yes (via prompt URLs) | Highest quality |

**Reference Image Method:**
- Include reference image URLs in the prompt text
- Example: `"Reference images (for likeness/styling only): [url1], [url2]"`
- Currently implemented in `app/api/ai/generate-images/route.ts`

**Bulk Pricing:**
- 10 images: $0.03 (Schnell) / $0.25-0.30 (Dev)
- 20 images: $0.06 (Schnell) / $0.50-0.60 (Dev)
- 100 images: $0.30 (Schnell) / $2.50-3.00 (Dev)

**Links:**
- Flux Schnell: https://replicate.com/black-forest-labs/flux-schnell
- Flux Dev: https://replicate.com/black-forest-labs/flux-dev

---

### 2. **DALL-E 3 (OpenAI)**

| Model | Price per Image | Reference Image Support | Notes |
|-------|----------------|------------------------|-------|
| **DALL-E 3 (1024x1024)** | $0.04 (4¢) | ⚠️ Limited (via prompt) | Strict content policies |
| **DALL-E 3 (1024x1792/1792x1024)** | $0.08 (8¢) | ⚠️ Limited (via prompt) | Higher resolution |

**Reference Image Method:**
- No direct image input API
- Can describe reference images in prompt
- More restrictive for historical/famous people content

**Bulk Pricing:**
- 10 images: $0.40
- 20 images: $0.80
- 100 images: $4.00

**Link:** https://platform.openai.com/docs/guides/images

---

### 3. **Stable Diffusion XL (via Replicate)**

| Model | Price per Image | Reference Image Support | Notes |
|-------|----------------|------------------------|-------|
| **SDXL Base** | ~$0.002-0.005 | ✅ Yes (via ControlNet/IP-Adapter) | Open-source, flexible |
| **SDXL Turbo** | ~$0.001-0.003 | ✅ Yes (via ControlNet/IP-Adapter) | Faster version |

**Reference Image Method:**
- ControlNet: Use reference image for structure/pose
- IP-Adapter: Use reference image for style/likeness
- Requires additional parameters in API call

**Bulk Pricing:**
- 10 images: $0.02-0.05
- 20 images: $0.04-0.10
- 100 images: $0.20-0.50

**Link:** https://replicate.com/stability-ai/sdxl

---

### 4. **Midjourney**

| Plan | Monthly Cost | Reference Image Support | Notes |
|------|-------------|------------------------|-------|
| **Basic** | $10/month | ✅ Yes (via `/imagine` with image URLs) | ~200 images/month |
| **Standard** | $30/month | ✅ Yes | ~1,000 images/month |
| **Pro** | $60/month | ✅ Yes | Unlimited (relaxed) |

**Reference Image Method:**
- Upload image to Discord or use image URL
- Use in prompt: `/imagine [image_url] [prompt]`
- **No direct API** - requires Discord bot or wrapper

**Per Image Cost (estimated):**
- Basic: ~$0.05/image
- Standard: ~$0.03/image
- Pro: Variable (unlimited)

**Link:** https://www.midjourney.com/

---

### 5. **Adobe Firefly**

| Plan | Monthly Cost | Reference Image Support | Notes |
|------|-------------|------------------------|-------|
| **Free** | $0 | ❌ No | Limited generations |
| **Creative Cloud** | $22.99+/month | ✅ Yes (via API) | Commercial-safe |
| **Enterprise** | Custom | ✅ Yes (via API) | Volume pricing |

**Reference Image Method:**
- Firefly API supports image-to-image
- Reference images for style transfer
- Commercial-safe (trained on licensed content)

**Per Image Cost:**
- Included in Creative Cloud subscription
- Enterprise: Custom pricing

**Link:** https://firefly.adobe.com/

---

### 6. **Stable Diffusion (Stability AI Direct)**

| Model | Price per Image | Reference Image Support | Notes |
|-------|----------------|------------------------|-------|
| **SD 1.5** | ~$0.002 | ✅ Yes (ControlNet/IP-Adapter) | Older model |
| **SDXL** | ~$0.004 | ✅ Yes (ControlNet/IP-Adapter) | Current standard |
| **SD 3** | ~$0.01-0.02 | ✅ Yes (ControlNet/IP-Adapter) | Latest model |

**Reference Image Method:**
- ControlNet for structure
- IP-Adapter for style/likeness
- Direct API support

**Bulk Pricing:**
- 10 images: $0.02-0.04
- 20 images: $0.04-0.08
- 100 images: $0.20-0.40

**Link:** https://platform.stability.ai/

---

## Comparison Table

| Model | Price/Image | Reference Support | API Available | Best For |
|-------|------------|-------------------|---------------|----------|
| **Flux Schnell** | $0.003 | ✅ Prompt URLs | ✅ Yes | **Current choice - cheapest** |
| **Flux Dev** | $0.025-0.030 | ✅ Prompt URLs | ✅ Yes | Higher quality |
| **DALL-E 3** | $0.04 | ⚠️ Limited | ✅ Yes | OpenAI ecosystem |
| **SDXL (Replicate)** | $0.002-0.005 | ✅ ControlNet/IP-Adapter | ✅ Yes | Open-source flexibility |
| **Midjourney** | ~$0.03-0.05 | ✅ Direct | ❌ No (Discord only) | Highest quality art |
| **Adobe Firefly** | Included | ✅ API | ✅ Yes | Commercial safety |

---

## Current Implementation

**Currently Using:** Flux Schnell via Replicate
- **Cost:** $0.003 per image
- **Reference Method:** Including image URLs in prompt text
- **Implementation:** `app/api/ai/generate-images/route.ts` lines 158-162

**Code Example:**
```typescript
if (imageReferences && imageReferences.length > 0) {
  const topRefs = imageReferences.slice(0, 3).map(r => r.url).join(', ');
  prompt += `. Reference images (for likeness/styling only): ${topRefs}`;
}
```

---

## Recommendations

1. **Current Choice (Flux Schnell):** Best balance of cost ($0.003) and quality
2. **For Better Quality:** Consider Flux Dev ($0.025) - still cheaper than DALL-E 3
3. **For Direct Image Control:** SDXL with ControlNet/IP-Adapter (requires API changes)
4. **For Commercial Projects:** Adobe Firefly (if already using Creative Cloud)

---

## Sources

- Flux Pricing: https://replicate.com/black-forest-labs/flux-schnell
- DALL-E 3 Pricing: https://platform.openai.com/docs/guides/images
- Stable Diffusion: https://platform.stability.ai/
- Midjourney: https://www.midjourney.com/
- Adobe Firefly: https://firefly.adobe.com/

*Pricing as of 2024 - subject to change*

