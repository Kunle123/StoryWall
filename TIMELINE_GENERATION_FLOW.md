# Timeline Generation Flow Diagram

## Complete Flow: Steps 1-6

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Timeline Information                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ • User enters: Timeline Name, Description, Max Events, Hashtags             │
│ • Optional: Source Restrictions, Reference Photo                            │
│                                                                              │
│ Output: timelineDescription, maxEvents, sourceRestrictions, referencePhoto │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Writing Style & Events                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ • User selects: Writing Style (Narrative, Professional, etc.)             │
│ • API: /api/ai/generate-events                                              │
│   └─ Input: timelineDescription, maxEvents, isFactual, sourceRestrictions │
│   └─ Output: Array of events [{year, title}, ...]                           │
│                                                                              │
│ Output: events (titles only, no descriptions yet)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Event Details                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ • API: /api/ai/generate-descriptions                                         │
│   └─ Input: events, timelineDescription, writingStyle,                      │
│             imageStyle (if available), themeColor (if available),            │
│             sourceRestrictions                                               │
│   └─ Output: descriptions[], imagePrompts[]                                 │
│                                                                              │
│ Output: events with descriptions and AI-generated image prompts            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Image Style                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ • User selects: Image Style (Minimalist, Illustration, etc.)               │
│ • User selects: Theme Color (optional)                                       │
│ • User checks/unchecks: "Includes People" checkbox ⚠️                      │
│                                                                              │
│ Output: imageStyle, themeColor, includesPeople (true/false)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │  includesPeople = TRUE    │   │  includesPeople = FALSE     │
    │  (Timeline has people)    │   │  (No people in timeline)   │
    └───────────────────────────┘   └───────────────────────────┘
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Generate Images - WITH PEOPLE PATH                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ API: /api/ai/generate-images                                                 │
│                                                                              │
│ 1. Extract Person Names                                                     │
│    └─ For each event: extractPersonNamesFromEvent()                         │
│    └─ Uses GPT-4o to identify famous people in title/description            │
│                                                                              │
│ 2. Find Reference Images                                                    │
│    └─ For each person: findImageUrlWithGPT4o()                             │
│    └─ Falls back to Wikimedia if GPT-4o fails                               │
│                                                                              │
│ 3. Build Image Prompt                                                       │
│    └─ Uses event.imagePrompt (from Step 3) or builds from scratch          │
│    └─ Adds: Person matching instructions (CRITICAL)                        │
│       • "Match exact appearance of [Person Name]"                           │
│       • "PRESERVE EXACT HAIR COLOR from reference"                          │
│       • "PRESERVE EXACT SKIN TONE from reference"                            │
│       • "DO NOT alter hair color, skin tone, or physical attributes"         │
│    └─ Adds: Famous person safety checks                                     │
│    └─ Adds: Style, color, composition instructions                           │
│                                                                              │
│ 4. Select Model                                                             │
│    └─ Photorealistic → google/imagen-4-fast (with reference image)         │
│    └─ Artistic styles → google/imagen-4-fast (with reference image)        │
│                                                                              │
│ 5. Generate Image                                                           │
│    └─ Input: prompt + reference image URL                                   │
│    └─ Output: Generated image URL                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Generate Images - WITHOUT PEOPLE PATH                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ API: /api/ai/generate-images                                                 │
│                                                                              │
│ 1. Skip Person Extraction ❌                                                │
│    └─ No extractPersonNamesFromEvent() calls                                │
│    └─ No findImageUrlWithGPT4o() calls                                      │
│                                                                              │
│ 2. Build Image Prompt (Simplified)                                          │
│    └─ Uses event.imagePrompt (from Step 3) or builds from scratch          │
│    └─ NO person matching instructions                                       │
│    └─ NO famous person safety checks                                         │
│    └─ Adds: Style, color, composition instructions                         │
│    └─ Focuses on: Event accuracy, visual scene description                 │
│                                                                              │
│ 3. Select Model                                                             │
│    └─ Based on imageStyle only (no reference image needed)                 │
│    └─ Photorealistic → flux-kontext-pro or google/imagen-4-fast             │
│    └─ Artistic styles → flux-kontext-pro or google/imagen-4-fast             │
│                                                                              │
│ 4. Generate Image                                                           │
│    └─ Input: prompt only (no reference image)                               │
│    └─ Output: Generated image URL                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Review & Publish                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ • User reviews timeline with all events, descriptions, and images           │
│ • User publishes timeline                                                   │
│                                                                              │
│ Output: Published timeline in database                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Differences: With vs Without People

### WITH PEOPLE (includesPeople = true)
```
Step 3 Prompt Building:
  ✓ Includes person context in image prompt generation
  ✓ May reference people in descriptions

Step 5 Image Generation:
  ✓ Extracts person names from events
  ✓ Finds reference images for each person
  ✓ Adds detailed person matching instructions to prompt
  ✓ Uses reference images in image-to-image generation
  ✓ Adds famous person safety checks
  ✓ Prompt length: ~1,200-1,500 chars (with person matching)

Model Selection:
  ✓ Prefers Imagen 4 Fast (better person matching)
  ✓ Uses reference images when available
```

### WITHOUT PEOPLE (includesPeople = false)
```
Step 3 Prompt Building:
  ✓ Focuses on concepts, processes, scientific/medical content
  ✓ No person-specific context

Step 5 Image Generation:
  ✗ Skips person extraction entirely
  ✗ No reference image lookup
  ✗ No person matching instructions
  ✗ No famous person safety checks
  ✓ Prompt length: ~800-1,200 chars (simpler, cleaner)

Model Selection:
  ✓ Based purely on imageStyle
  ✓ No reference images needed
  ✓ Can use any model (Flux, Imagen, etc.)
```

## Prompt Complexity Comparison

### WITH PEOPLE - Example Prompt:
```
Minimalist style: Zohran Mamdani arguing with Cuomo: the two candidates 
arguing in the studio at a televised debate, historical period 2024. 
CRITICAL: Accurately depict the specific event: Zohran Mamdani arguing 
with Cuomo. Show the exact content described: the two candidates arguing 
in the studio at a televised debate. CRITICAL PERSON MATCHING: Match the 
exact appearance of Zohran Mamdani and Andrew Cuomo from the reference 
image. PRESERVE EXACT HAIR COLOR from reference - if reference has black 
hair, generate black hair (NOT grey, NOT white, NOT brown). PRESERVE 
EXACT SKIN TONE from reference. PRESERVE EXACT FACIAL FEATURES, eye color, 
hair style, facial hair, and all physical characteristics. DO NOT alter 
hair color, skin tone, or any physical attributes. Match facial structure, 
distinctive features, and recognizable characteristics exactly. Maintain 
these exact physical attributes while adapting to the scene context and 
style. soft minimalist design, clean lines, subtle colors, artistic 
blending, ethereal quality, delicate details. 21th century period detail, 
historically accurate. Balanced composition, centered focal point, clear 
visual storytelling. No text, no words, no written content, no labels.
```

### WITHOUT PEOPLE - Example Prompt:
```
Minimalist style: Fetal development stage 8 weeks: The embryo shows 
distinctive features including limb buds, developing heart, and neural 
tube formation, historical period 2024. CRITICAL: Accurately depict 
the specific event: Fetal development stage 8 weeks. Show the exact 
content described: The embryo shows distinctive features including limb 
buds, developing heart, and neural tube formation. soft minimalist design, 
clean lines, subtle colors, artistic blending, ethereal quality, delicate 
details. 21th century period detail, historically accurate. Balanced 
composition, centered focal point, clear visual storytelling. No text, 
no words, no written content, no labels.
```

## Benefits of includesPeople Checkbox

1. **Simplified Prompts**: When unchecked, prompts are ~30-40% shorter and more focused
2. **Faster Generation**: No person extraction or reference image lookup
3. **Better Accuracy**: For non-person content (science, medicine, concepts), avoids irrelevant person matching
4. **Cost Savings**: Fewer API calls (no GPT-4o for person extraction, no reference image lookups)
5. **Cleaner Output**: No person-specific instructions cluttering prompts for non-person content

