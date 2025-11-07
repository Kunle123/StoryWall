# Image Generation Models - Complete Pricing Comparison

## Current Model in Use
**Model:** `stability-ai/sdxl` (SDXL via Replicate)  
**Price:** ~$0.0048 per image  
**Reference Image Support:** ✅ Yes (image-to-image)

---

## Complete Model Comparison Table

| Model | Provider | Price per Image | Reference Image Support | API Available | Quality | Speed | Notes |
|-------|----------|----------------|------------------------|---------------|---------|-------|-------|
| **SDXL** (Current) | Stability AI (Replicate) | **$0.0048** | ✅ Direct image input | ✅ Yes | High | Fast | Currently used |
| **Google Imagen 3** | Google Cloud | $0.06 | ✅ Yes (image-to-image) | ✅ Yes | Very High | Medium | Google's latest |
| **Google Imagen 4** | Google Cloud | $0.02-0.06 | ✅ Yes | ✅ Yes | Very High | Fast/Standard/Ultra | Fast: $0.02, Standard: $0.04, Ultra: $0.06 |
| **DALL-E 3 Standard** | OpenAI | $0.04 | ⚠️ Limited (prompt only) | ✅ Yes | Very High | Fast | Strict content policies |
| **DALL-E 3 HD** | OpenAI | $0.08 | ⚠️ Limited (prompt only) | ✅ Yes | Very High | Fast | Higher resolution |
| **DALL-E 2** | OpenAI | $0.02 | ⚠️ Limited (prompt only) | ✅ Yes | High | Fast | Older model |
| **Flux Schnell** | Black Forest Labs (Replicate) | $0.003 | ✅ Prompt URLs | ✅ Yes | High | Very Fast | Cheapest option |
| **Flux Dev** | Black Forest Labs (Replicate) | $0.025-0.030 | ✅ Prompt URLs | ✅ Yes | Very High | Medium | Better quality |
| **Flux Pro** | Black Forest Labs (Replicate) | $0.05-0.10 | ✅ Prompt URLs | ✅ Yes | Highest | Slow | Premium quality |
| **Flux.1 Kontext Pro** | Black Forest Labs | $0.04 | ✅ Yes | ✅ Yes | Very High | Medium | Reference image support |
| **Stable Diffusion 3.5 Large Turbo** | Stability AI | $0.04 | ✅ ControlNet/IP-Adapter | ✅ Yes | Very High | Fast | Latest SD model |
| **Stable Diffusion 3.5 Medium** | Stability AI | $0.035 | ✅ ControlNet/IP-Adapter | ✅ Yes | High | Medium | Balanced option |
| **Stable Diffusion Ultra** | Stability AI | $0.08 | ✅ ControlNet/IP-Adapter | ✅ Yes | Highest | Slow | Premium quality |
| **Stable Diffusion Core** | Stability AI | $0.03 | ✅ ControlNet/IP-Adapter | ✅ Yes | High | Fast | Standard option |
| **Midjourney V7** | Midjourney | ~$0.03-0.05* | ✅ Direct upload | ❌ No (Discord only) | Highest | Medium | No official API |
| **Adobe Firefly** | Adobe | Included in subscription | ✅ API | ✅ Yes | High | Fast | Commercial-safe |
| **Runway Gen-4 Image** | Runway | $0.10 | ✅ Yes | ✅ Yes | Very High | Medium | Video-focused |
| **Leonardo.ai Turbo** | Leonardo.ai | $0.03 | ✅ Yes | ✅ Yes | High | Fast | Gaming-focused |
| **Leonardo.ai Default** | Leonardo.ai | $0.06 | ✅ Yes | ✅ Yes | High | Medium | Standard |
| **Leonardo.ai Quality** | Leonardo.ai | $0.09 | ✅ Yes | ✅ Yes | Very High | Slow | Premium |
| **Grok Imagine** | xAI | $0.07 | ⚠️ Limited | ✅ Yes | High | Fast | X/Twitter integration |

*Midjourney pricing is estimated based on subscription plans (Basic $10/200 images = $0.05, Standard $30/1000 images = $0.03)

---

## Google Imagen Models (Detailed)

### Google Imagen 3
- **Provider:** Google Cloud (Vertex AI)
- **Price:** $0.06 per image
- **Reference Image:** ✅ Yes (image-to-image)
- **API:** ✅ Yes (Vertex AI API)
- **Quality:** Very High
- **Best For:** High-quality images with Google Cloud integration
- **Link:** https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview

### Google Imagen 4
- **Provider:** Google Cloud (Vertex AI)
- **Pricing Tiers:**
  - **Fast:** $0.02 per image
  - **Standard:** $0.04 per image
  - **Ultra:** $0.06 per image
- **Reference Image:** ✅ Yes (image-to-image)
- **API:** ✅ Yes (Vertex AI API)
- **Quality:** Very High (Ultra is highest)
- **Best For:** Flexible quality/speed options
- **Link:** https://cloud.google.com/vertex-ai/generative-ai/pricing

---

## Cost Comparison for 100 Images

| Model | Cost for 100 Images | Cost for 1,000 Images |
|-------|---------------------|----------------------|
| **Flux Schnell** | $0.30 | $3.00 |
| **SDXL (Current)** | $0.48 | $4.80 |
| **DALL-E 2** | $2.00 | $20.00 |
| **Flux Dev** | $2.50-3.00 | $25-30 |
| **DALL-E 3 Standard** | $4.00 | $40.00 |
| **Stable Diffusion 3.5 Medium** | $3.50 | $35.00 |
| **Stable Diffusion 3.5 Large Turbo** | $4.00 | $40.00 |
| **Google Imagen 4 Fast** | $2.00 | $20.00 |
| **Google Imagen 4 Standard** | $4.00 | $40.00 |
| **Google Imagen 3** | $6.00 | $60.00 |
| **DALL-E 3 HD** | $8.00 | $80.00 |
| **Runway Gen-4** | $10.00 | $100.00 |

---

## Reference Image Support Methods

### 1. Direct Image Input (Best)
- **Models:** SDXL (current), Google Imagen 3/4, Runway Gen-4
- **Method:** Pass image as direct input parameter
- **Quality:** Highest likeness matching
- **Implementation:** Requires API changes

### 2. Image-to-Image (Good)
- **Models:** SDXL with `prompt_strength`, Stable Diffusion with ControlNet
- **Method:** Use reference image with transformation strength
- **Quality:** Good likeness matching
- **Implementation:** Currently used with SDXL

### 3. Prompt URLs (Limited)
- **Models:** Flux models, DALL-E (limited)
- **Method:** Include image URLs in text prompt
- **Quality:** Variable, depends on model interpretation
- **Implementation:** Easiest but less reliable

---

## Recommendations by Use Case

### Cost-Effective (High Volume)
1. **Flux Schnell** - $0.003/image (cheapest)
2. **SDXL (Current)** - $0.0048/image (good balance)
3. **Google Imagen 4 Fast** - $0.02/image (Google quality at lower cost)

### Best Quality
1. **Google Imagen 4 Ultra** - $0.06/image (highest quality)
2. **Flux Pro** - $0.05-0.10/image (premium quality)
3. **DALL-E 3 HD** - $0.08/image (OpenAI quality)

### Best Reference Image Support
1. **SDXL (Current)** - Direct image input, good control
2. **Google Imagen 3/4** - Direct image input, high quality
3. **Flux.1 Kontext Pro** - Specialized for reference images

### Google Cloud Integration
1. **Google Imagen 4** - Latest, multiple quality tiers
2. **Google Imagen 3** - Stable, proven quality

---

## Switching Considerations

### To Google Imagen 4 Fast
- **Cost:** $0.02/image (4x current cost)
- **Quality:** Very High (Google quality)
- **Reference:** ✅ Direct image input
- **API:** Vertex AI API (different from Replicate)
- **Pros:** Google quality, good reference support
- **Cons:** 4x more expensive than current

### To Google Imagen 4 Standard
- **Cost:** $0.04/image (8x current cost)
- **Quality:** Very High
- **Reference:** ✅ Direct image input
- **Pros:** Better quality than Fast tier
- **Cons:** 8x more expensive

### To Flux Schnell
- **Cost:** $0.003/image (37% cheaper)
- **Quality:** High
- **Reference:** Prompt URLs only (less reliable)
- **Pros:** Cheapest option
- **Cons:** Reference images less effective

### To Flux Dev
- **Cost:** $0.025/image (5x current cost)
- **Quality:** Very High
- **Reference:** Prompt URLs only
- **Pros:** Better quality than Schnell
- **Cons:** 5x more expensive, reference images less effective

---

## Implementation Notes

### Current Implementation (SDXL)
- Uses Replicate API
- Direct image input via `input.image` parameter
- `prompt_strength: 0.8` for image-to-image transformation
- Cost: ~$0.0048 per image

### Google Imagen Implementation (if switching)
- Would use Vertex AI API
- Requires Google Cloud account setup
- Different API structure than Replicate
- Direct image input supported
- Better quality but higher cost

---

## Sources

- **Google Imagen:** https://cloud.google.com/vertex-ai/generative-ai/pricing
- **OpenAI DALL-E:** https://platform.openai.com/docs/guides/images
- **Replicate Models:** https://replicate.com/explore
- **Stability AI:** https://platform.stability.ai/
- **Flux:** https://blackforestlabs.ai/

*Pricing as of November 2024 - subject to change*

