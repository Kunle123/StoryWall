# Image Generation Models with Direct Reference Image Input Support

## Models That Accept Actual Image Input (Not Just URLs in Prompts)

### 1. **Stable Diffusion XL with IP-Adapter (via Replicate)**

**Model:** `lucataco/ip-adapter` or `stability-ai/sdxl` with IP-Adapter

| Model | Price per Image | Reference Image Input | Method |
|-------|----------------|----------------------|--------|
| **SDXL + IP-Adapter** | ~$0.002-0.005 | ✅ Direct image upload | IP-Adapter for style/likeness |
| **SDXL Turbo + IP-Adapter** | ~$0.001-0.003 | ✅ Direct image upload | Faster, cheaper |

**How It Works:**
- Upload reference image directly to API
- IP-Adapter extracts style/features from reference
- Generates new image matching reference style
- Better control than URL-based prompts

**API Example:**
```typescript
{
  input: {
    prompt: "historical illustration of event",
    image: referenceImageUrl, // Direct image input
    ip_adapter_scale: 0.7, // Control strength
  }
}
```

**Bulk Pricing:**
- 10 images: $0.02-0.05
- 20 images: $0.04-0.10
- 100 images: $0.20-0.50

**Links:**
- IP-Adapter: https://replicate.com/lucataco/ip-adapter
- SDXL: https://replicate.com/stability-ai/sdxl

---

### 2. **SDXL Img2Img (Image-to-Image)**

**Model:** `segmind/sdxl-img2img` or similar

| Model | Price per Image | Reference Image Input | Method |
|-------|----------------|----------------------|--------|
| **SDXL Img2Img** | ~$0.001-0.002 per GPU second | ✅ Direct image upload | Image-to-image translation |
| **SDXL Turbo Img2Img** | ~$0.0005-0.001 per GPU second | ✅ Direct image upload | Faster version |

**How It Works:**
- Upload reference image
- Text prompt guides transformation
- Generates new image based on reference + prompt
- Good for style transfer and modifications

**Typical Cost:**
- ~$0.02 per image (varies by processing time)
- 10 images: ~$0.20
- 20 images: ~$0.40

**Link:** https://www.segmind.com/models/sdxl-img2img

---

### 3. **FLUX.1 Kontext Pro**

**Model:** `black-forest-labs/flux-kontext-pro` (if available via Replicate)

| Model | Price per Image | Reference Image Input | Method |
|-------|----------------|----------------------|--------|
| **FLUX Kontext Pro** | ~$0.04 | ✅ Direct image input | Advanced reference control |

**How It Works:**
- Direct image input support
- High semantic understanding
- Precise local control
- Better for brand/product visualization

**Bulk Pricing:**
- 10 images: $0.40
- 20 images: $0.80
- 100 images: $4.00

**Note:** May not be available on Replicate yet - check availability

**Link:** https://www.siliconflow.com/articles/en/the-cheapest-image-gen-models

---

### 4. **Stable Diffusion with ControlNet**

**Model:** Various ControlNet models via Replicate

| Model | Price per Image | Reference Image Input | Method |
|-------|----------------|----------------------|--------|
| **SDXL + ControlNet** | ~$0.002-0.005 | ✅ Direct image upload | Structure/pose control |
| **SD 1.5 + ControlNet** | ~$0.001-0.003 | ✅ Direct image upload | Older, cheaper |

**How It Works:**
- Upload reference image for structure/pose
- ControlNet extracts structure (edges, depth, pose)
- Generates new image with same structure
- Good for maintaining composition

**Bulk Pricing:**
- 10 images: $0.02-0.05
- 20 images: $0.04-0.10
- 100 images: $0.20-0.50

**Links:**
- ControlNet: https://replicate.com/tags/controlnet
- SDXL ControlNet: https://replicate.com/lllyasviel/sd-controlnet-sdxl

---

### 5. **GPT Image 1 Edit (OpenAI)**

**Model:** `gpt-image-1-edit` (if available)

| Model | Price | Reference Image Input | Method |
|-------|-------|----------------------|--------|
| **GPT Image 1 Edit** | $12.50/1M input tokens<br>$50/1M output tokens | ✅ Multi-reference editing | Inpainting + composition |

**How It Works:**
- Supports multiple reference images
- Natural language editing
- Inpainting and composition
- Good for marketing visuals

**Estimated Cost:**
- ~$0.05-0.10 per image (token-based)
- 10 images: ~$0.50-1.00
- 20 images: ~$1.00-2.00

**Note:** Availability and pricing may vary

**Link:** https://www.segmind.com/models/gpt-image-1-edit

---

## Comparison: Direct Image Input vs URL in Prompt

| Method | Model | Price/Image | Quality | Control |
|--------|-------|------------|---------|---------|
| **Direct Image Input** | SDXL + IP-Adapter | $0.002-0.005 | ⭐⭐⭐⭐ | High |
| **Direct Image Input** | SDXL Img2Img | ~$0.02 | ⭐⭐⭐⭐ | High |
| **URL in Prompt** | Flux Schnell | $0.003 | ⭐⭐⭐ | Medium |
| **URL in Prompt** | Flux Dev | $0.025-0.030 | ⭐⭐⭐⭐ | Medium |

---

## Recommended Options for Your Use Case

### Option 1: **SDXL + IP-Adapter** (Best Value)
- **Price:** $0.002-0.005 per image
- **Reference Support:** ✅ Direct image upload
- **Quality:** High
- **Implementation:** Requires API changes to use `image` parameter
- **Best For:** Style/likeness transfer from reference images

### Option 2: **SDXL Img2Img** (Most Control)
- **Price:** ~$0.02 per image
- **Reference Support:** ✅ Direct image upload
- **Quality:** High
- **Implementation:** Image-to-image transformation
- **Best For:** Modifying reference images with text guidance

### Option 3: **Keep Flux Schnell** (Current - Cheapest)
- **Price:** $0.003 per image
- **Reference Support:** ⚠️ URLs in prompt only
- **Quality:** Good
- **Implementation:** Already working
- **Best For:** Cost-effective with basic reference support

---

## Implementation Requirements

To use direct image input, you'll need to:

1. **Download reference images** from URLs provided in step 1
2. **Upload to Replicate** or pass as base64
3. **Modify API call** to include `image` parameter instead of URL in prompt
4. **Update `app/api/ai/generate-images/route.ts`**

**Example Code Change:**
```typescript
// Current (URL in prompt):
prompt += `. Reference images: ${imageReferences.map(r => r.url).join(', ')}`;

// New (Direct image input):
const referenceImage = await fetch(imageReferences[0].url);
const imageBuffer = await referenceImage.arrayBuffer();
// Pass imageBuffer to Replicate API in 'image' parameter
```

---

## Recommendation

**For best reference image control at low cost:**
- **Use SDXL + IP-Adapter** ($0.002-0.005 per image)
- Direct image input provides better style/likeness matching
- Only slightly more expensive than current Flux Schnell
- Requires API implementation changes

**If you want to keep current setup:**
- **Keep Flux Schnell** ($0.003 per image)
- Already working with URL-based references
- Cheapest option
- Less precise control than direct image input

