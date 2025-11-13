# Prompt Flow & Usage Guide

This document maps all prompts in the system to their usage scenarios and shows the decision flow for prompt selection.

## Prompt Files Overview

```
prompts/
├── anchor/
│   ├── system.txt          # System prompt for Anchor style generation
│   └── user.txt            # User prompt for Anchor style generation
│
├── descriptions/
│   ├── system.txt          # System prompt for description generation
│   ├── user-prompt.txt     # User prompt for description generation
│   ├── image-prompt-instructions-with-anchor.txt
│   │                       # Image prompt instructions (with Anchor, regular timelines)
│   ├── image-prompt-instructions-with-anchor-factual.txt
│   │                       # Image prompt instructions (with Anchor, factual progressions)
│   └── image-prompt-instructions-without-anchor.txt
│                           # Image prompt instructions (no Anchor style)
│
└── newsworthiness-test/
    ├── system.txt          # System prompt for newsworthiness legal analysis
    └── user.txt            # User prompt for newsworthiness test
```

---

## Main Flow: Description Generation

### Entry Point
**API Route**: `POST /api/ai/generate-descriptions`

**Called From**: 
- Step 3: Event Details (generate descriptions)
- Step 2: Writing Style & Events (if generating events with descriptions)

---

## Step 1: Anchor Style Generation

### When: ALWAYS
Anchor style is generated for **ALL timelines** to ensure visual consistency.

### Prompts Used
```
┌─────────────────────────────────────────────────────────┐
│  Anchor Generation (ALWAYS)                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  System Prompt: prompts/anchor/system.txt               │
│  └─ Defines role: "Master Cinematographer"              │
│  └─ Lists 5 required parameters:                        │
│     1. Visual Palette                                    │
│     2. Setting & Atmosphere                              │
│     3. Character Archetype                               │
│     4. Emotional Tone                                    │
│     5. Cinematography                                    │
│                                                          │
│  User Prompt: prompts/anchor/user.txt                   │
│  └─ Variables:                                          │
│     • {{timelineDescription}}                           │
│     • {{eventTitles}}                                   │
│     • {{imageStyle}}                                    │
│     • {{themeColor}} (optional)                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Code Location
```typescript
// app/api/ai/generate-descriptions/route.ts (line ~190)
const anchorPrompts = loadAnchorPrompts({
  timelineDescription,
  eventTitles: events.map((e: any) => e.title).join(', '),
  imageStyle: imageStyle || 'Illustration',
  themeColor,
});
```

### Output
- **anchorStyle**: String containing visual style guide
- Used in all subsequent image prompt generation

### Error Handling
- If Anchor generation fails, continues without it (logs warning)
- `anchorStyle` will be `null` or `undefined` in this case

---

## Step 2: Description Generation

### Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│  Description Generation Decision Tree                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Has Anchor?    │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                  │
            YES                                NO
            │                                  │
            ▼                                  ▼
    ┌───────────────┐              ┌──────────────────────────┐
    │ Has Factual   │              │ Use:                     │
    │ Details?      │              │ • descriptions/system.txt │
    └───────┬───────┘              │ • descriptions/user-     │
            │                      │   prompt.txt             │
    ┌───────┴───────┐              │ • image-prompt-          │
    │               │              │   instructions-          │
    YES             NO             │   without-anchor.txt     │
    │               │              └──────────────────────────┘
    ▼               ▼
┌─────────┐   ┌─────────┐
│ Use:    │   │ Use:    │
│ • ...   │   │ • ...   │
│ • ...   │   │ • ...   │
│ • ...   │   │ • ...   │
└─────────┘   └─────────┘
```

### Detailed Flow

#### Always Used (Base Prompts)
```
┌─────────────────────────────────────────────────────────┐
│  Base Description Prompts (ALWAYS)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. System Prompt: prompts/descriptions/system.txt       │
│     └─ Variables:                                       │
│        • {{writingStyleInstructions}}                   │
│        • {{imagePromptInstructions}} (varies)           │
│        • {{eventCount}}                                 │
│                                                          │
│  2. User Prompt: prompts/descriptions/user-prompt.txt   │
│     └─ Variables:                                       │
│        • {{timelineDescription}}                       │
│        • {{sourceRestrictions}} (array, optional)       │
│        • {{imageContext}} (optional)                    │
│        • {{eventCount}}                                 │
│        • {{events}} (array with year, title)            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Conditional: Image Prompt Instructions

**Path A: With Anchor + Factual Details**
```
Condition: anchorStyle exists AND hasFactualDetails === true

Uses: prompts/descriptions/image-prompt-instructions-with-anchor-factual.txt
Variables:
  • {{anchorStylePreview}} (first 100 chars of anchorStyle)

When: Progression timelines with factual details (e.g., fetal development)
Focus: Medical/scientific accuracy, literal descriptions
```

**Path B: With Anchor + Regular Timeline**
```
Condition: anchorStyle exists AND hasFactualDetails === false

Uses: prompts/descriptions/image-prompt-instructions-with-anchor.txt
Variables:
  • {{anchorStylePreview}} (first 100 chars of anchorStyle)
  • {{canUseCelebrityLikeness}} (boolean from newsworthiness test)

When: Regular timelines with Anchor style (most common)
Focus: Literal, recognizable scenes
- If canUseCelebrityLikeness: May use celebrity likenesses for newsworthy content
- If NOT canUseCelebrityLikeness: Blocks celebrity content, focuses on non-celebrity subjects
```

**Path C: Without Anchor**
```
Condition: anchorStyle is null/undefined

Uses: prompts/descriptions/image-prompt-instructions-without-anchor.txt
Variables:
  • {{themeColor}} (optional)
  • {{canUseCelebrityLikeness}} (boolean from newsworthiness test)

When: Anchor generation failed or not available
Focus: Literal, concrete descriptions
- If canUseCelebrityLikeness: May use celebrity likenesses for newsworthy content
- If NOT canUseCelebrityLikeness: Blocks celebrity content
```

---

## Complete Prompt Selection Logic

### Code Flow
```typescript
// app/api/ai/generate-descriptions/route.ts

// STEP 1: Test newsworthiness (lines ~34-73)
if (timelineTitle && timelineDescription) {
  newsworthinessResult = await testNewsworthiness(timelineTitle, timelineDescription);
  canUseCelebrityLikeness = newsworthinessResult.canUseLikeness;
  
  // Check if celebrity content violates T&Cs
  if (hasViolation) {
    return NextResponse.json({ 
      error: 'This timeline violates our Terms and Conditions...',
      newsworthinessViolation: {...}
    }, { status: 400 });
  }
}
// Uses: newsworthiness-test/system.txt, newsworthiness-test/user.txt

// STEP 2: Always generate Anchor (lines ~188-223)
const anchorPrompts = loadAnchorPrompts({...});
// Uses: anchor/system.txt, anchor/user.txt

// STEP 3: Determine image prompt instructions (lines ~350-363)
if (variables.anchorStyle) {
  if (variables.hasFactualDetails) {
    // Path A: With Anchor + Factual
    imagePromptInstructions = loadPrompt(
      'descriptions/image-prompt-instructions-with-anchor-factual.txt',
      { anchorStylePreview: anchorPreview }
    );
  } else {
    // Path B: With Anchor + Regular
    imagePromptInstructions = loadPrompt(
      'descriptions/image-prompt-instructions-with-anchor.txt',
      { 
        anchorStylePreview: anchorPreview,
        canUseCelebrityLikeness: variables.canUseCelebrityLikeness || false
      }
    );
  }
} else {
  // Path C: Without Anchor
  imagePromptInstructions = loadPrompt(
    'descriptions/image-prompt-instructions-without-anchor.txt',
    { 
      themeColor: variables.themeColor || '',
      canUseCelebrityLikeness: variables.canUseCelebrityLikeness || false
    }
  );
}

// STEP 4: Load system prompt (line ~120)
const systemPrompt = loadPrompt('descriptions/system.txt', {
  writingStyleInstructions,
  imagePromptInstructions,  // ← Injected here
  eventCount: variables.eventCount,
  canUseCelebrityLikeness: variables.canUseCelebrityLikeness || false,
});

// STEP 5: Load user prompt (line ~129)
const userPrompt = loadPrompt('descriptions/user-prompt.txt', {
  timelineDescription: variables.timelineDescription,
  sourceRestrictions: variables.sourceRestrictions || [],
  imageContext: variables.imageContext,
  eventCount: variables.eventCount,
  events: variables.events,
});
```

---

## When is `hasFactualDetails` True?

### Detection Logic
```typescript
// app/api/ai/generate-descriptions/route.ts (line ~321)
const hasFactualDetails = anchorStyle && Object.keys(factualDetails).length > 0;
```

### When Factual Details are Generated
- **Condition**: Timeline appears to be a progression (`appearsToBeProgression === true`)
- **Examples**:
  - Fetal development
  - Construction process
  - Disease progression
  - Scientific processes

### Factual Details Generation
- **API Call**: Additional AI call to fact-checker
- **System Prompt**: "You are a fact-checker and researcher specializing in [domain] knowledge"
- **Purpose**: Get accurate, clinical descriptions for scientific/medical topics
- **Output**: `factualDetails` object with key-value pairs

### Result
- If `factualDetails` has entries → `hasFactualDetails = true`
- Uses: `image-prompt-instructions-with-anchor-factual.txt`
- Focus: Medical accuracy, scientific terminology, literal physical descriptions

---

## Prompt File Details

### 1. `prompts/anchor/system.txt`
**Purpose**: Define the role and requirements for Anchor generation

**Key Content**:
- Role: "Master Cinematographer"
- 5 Required Parameters:
  1. Visual Palette (colors, saturation, lighting)
  2. Setting & Atmosphere (era, environment, conditions)
  3. Character Archetype (for people-based timelines)
  4. Emotional Tone (primary emotion, progression)
  5. Cinematography (shot type, angles, lens, vignette)

**Used**: Always (for all timelines)

---

### 2. `prompts/anchor/user.txt`
**Purpose**: Request Anchor generation with specific timeline context

**Variables**:
- `{{timelineDescription}}` - User's timeline description
- `{{eventTitles}}` - Comma-separated list of event titles
- `{{imageStyle}}` - User's chosen image style (e.g., "Illustration")
- `{{themeColor}}` - User's theme color (optional)

**Key Instructions**:
- Must address ALL 5 parameters
- Lock setting to exact era/location
- Define character archetypes (for character-based timelines)
- Include examples (Die Hard, The Matrix)

**Used**: Always (for all timelines)

---

### 3. `prompts/descriptions/system.txt`
**Purpose**: Define role and requirements for description generation

**Variables**:
- `{{writingStyleInstructions}}` - Style-specific instructions (narrative, jovial, etc.)
- `{{imagePromptInstructions}}` - **Varies based on Anchor/factual status**
- `{{eventCount}}` - Number of events

**Variables**:
- `{{writingStyleInstructions}}` - Style-specific instructions (narrative, jovial, etc.)
- `{{imagePromptInstructions}}` - **Varies based on Anchor/factual status**
- `{{eventCount}}` - Number of events
- `{{canUseCelebrityLikeness}}` - Boolean from newsworthiness test

**Key Content**:
- Role: "Timeline description writer and visual narrative expert"
- Critical alignment requirement (description = image prompt)
- Conditional celebrity content restrictions based on newsworthiness test
- Examples of good/bad prompts

**Used**: Always (for all description generation)

---

### 4. `prompts/descriptions/user-prompt.txt`
**Purpose**: Request descriptions for specific events

**Variables**:
- `{{timelineDescription}}` - User's timeline description
- `{{sourceRestrictions}}` - Array of required sources (optional)
- `{{imageContext}}` - Image style and theme color context (optional)
- `{{eventCount}}` - Number of events
- `{{events}}` - Array of event objects with `year` and `title`

**Key Instructions**:
- Generate descriptions for each event
- Critical alignment: description and image prompt must match
- Literal, recognizable scenes

**Used**: Always (for all description generation)

---

### 5. `prompts/descriptions/image-prompt-instructions-with-anchor.txt`
**Purpose**: Instructions for image prompts when Anchor style exists (regular timelines)

**Variables**:
- `{{anchorStylePreview}}` - First 100 characters of Anchor style

**Variables**:
- `{{anchorStylePreview}}` - First 100 characters of Anchor style
- `{{canUseCelebrityLikeness}}` - Boolean from newsworthiness test

**Key Content**:
- ALWAYS start with Anchor Style
- Describe SPECIFIC, RECOGNIZABLE scenes
- Conditional celebrity content handling:
  - If `canUseCelebrityLikeness`: May use celebrity likenesses for newsworthy content
  - If NOT `canUseCelebrityLikeness`: Blocks celebrity content, focuses on non-celebrity subjects
- Hyper-specific details
- Literal, concrete descriptions

**Used When**:
- ✅ Anchor style exists
- ❌ NOT a factual progression (no factual details)

**Examples**:
- Historical events
- Scientific processes
- Non-celebrity narratives

---

### 6. `prompts/descriptions/image-prompt-instructions-with-anchor-factual.txt`
**Purpose**: Instructions for image prompts when Anchor exists AND factual details are available

**Variables**:
- `{{anchorStylePreview}}` - First 100 characters of Anchor style

**Key Content**:
- ALWAYS start with Anchor Style
- Accurately depict Factual Details
- Literal, PHYSICAL elements
- Medical/scientific accuracy
- Example: "Week 4: Neural Tube Forms" with specific medical details

**Used When**:
- ✅ Anchor style exists
- ✅ Factual details available (progression timelines with fact-checking)

**Examples**:
- Fetal development
- Construction processes
- Disease progression
- Scientific processes

---

### 7. `prompts/descriptions/image-prompt-instructions-without-anchor.txt`
**Purpose**: Instructions for image prompts when Anchor style is NOT available

**Variables**:
- `{{themeColor}}` - User's theme color (optional)
- `{{canUseCelebrityLikeness}}` - Boolean from newsworthiness test

**Key Content**:
- Literal, concrete descriptions
- Direct references to physical reality
- No Anchor style (fallback mode)
- Theme color as subtle accent (if provided)
- Conditional celebrity content handling:
  - If `canUseCelebrityLikeness`: May use celebrity likenesses for newsworthy content
  - If NOT `canUseCelebrityLikeness`: Blocks celebrity content

**Used When**:
- ❌ Anchor generation failed
- ❌ Anchor style is null/undefined

**Examples**:
- Any timeline where Anchor generation failed
- Fallback for error cases

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/ai/generate-descriptions                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  STEP 1:       │
                    │  Test          │
                    │  Newsworthiness│
                    │  (NEW)         │
                    └────────┬───────┘
                             │
                             ▼
        ┌─────────────────────────────────────┐
        │  Load: newsworthiness-test/         │
        │        system.txt                   │
        │  Load: newsworthiness-test/         │
        │        user.txt                     │
        │  Variables: timelineTitle,          │
        │            timelineDescription      │
        └──────────────┬──────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Violation?     │
              │  (celebrity +   │
              │   high risk)    │
              └────────┬────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        YES                           NO
        │                             │
        ▼                             ▼
┌───────────────┐          ┌────────────────┐
│  Return 400  │          │  STEP 2:        │
│  Error +      │          │  Generate       │
│  Show Dialog  │          │  Anchor        │
│  (STOP)       │          │  (ALWAYS)      │
└───────────────┘          └────────┬────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │  Load: anchor/system.txt     │
                    │  Load: anchor/user.txt        │
                    └──────────────┬────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  anchorStyle    │
                          │  generated?     │
                          └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    YES                           NO
                    │                             │
                    ▼                             ▼
            ┌───────────────┐          ┌──────────────────────────┐
            │  STEP 3:      │          │  Use:                    │
            │  Check        │          │  • descriptions/system.txt│
            │  Factual?     │          │  • descriptions/user-     │
            └───────┬───────┘          │    prompt.txt            │
                    │                  │  • image-prompt-         │
                    │                  │    instructions-         │
                    │                  │    without-anchor.txt    │
                    │                  └──────────────────────────┘
               ┌────┴────┐
               │         │
              YES       NO
               │         │
               ▼         ▼
          ┌─────┐  ┌─────┐
          │ A   │  │ B   │
          └──┬──┘  └──┬──┘
             │        │
             ▼        ▼
┌──────────────────────────────────────────────────────┐
│  Path A: With Anchor + Factual                       │
│  • descriptions/system.txt                            │
│  • descriptions/user-prompt.txt                       │
│  • image-prompt-instructions-with-anchor-factual.txt │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Path B: With Anchor + Regular                       │
│  • descriptions/system.txt                            │
│  • descriptions/user-prompt.txt                      │
│  • image-prompt-instructions-with-anchor.txt         │
│  • canUseCelebrityLikeness (from newsworthiness test)│
└──────────────────────────────────────────────────────┘
```

---

## Summary Table

| Prompt File | Used When | Variables | Purpose |
|------------|-----------|-----------|---------|
| `newsworthiness-test/system.txt` | **BEFORE descriptions** | None | Legal analysis framework |
| `newsworthiness-test/user.txt` | **BEFORE descriptions** | timelineTitle, timelineDescription | Request newsworthiness test |
| `anchor/system.txt` | **ALWAYS** | None | Define Anchor generation role |
| `anchor/user.txt` | **ALWAYS** | timelineDescription, eventTitles, imageStyle, themeColor | Request Anchor generation |
| `descriptions/system.txt` | **ALWAYS** | writingStyleInstructions, imagePromptInstructions, eventCount, canUseCelebrityLikeness | Define description generation role |
| `descriptions/user-prompt.txt` | **ALWAYS** | timelineDescription, sourceRestrictions, imageContext, eventCount, events | Request descriptions |
| `image-prompt-instructions-with-anchor.txt` | Anchor exists + Regular timeline | anchorStylePreview, canUseCelebrityLikeness | Image prompts with Anchor (most common) |
| `image-prompt-instructions-with-anchor-factual.txt` | Anchor exists + Factual progression | anchorStylePreview | Image prompts with Anchor + medical accuracy |
| `image-prompt-instructions-without-anchor.txt` | Anchor missing/failed | themeColor, canUseCelebrityLikeness | Image prompts fallback (no Anchor) |

---

## Usage Scenarios

### Scenario 1: Celebrity/Film Timeline (Blocked)
```
1. Newsworthiness Test: ❌
   → Uses: newsworthiness-test/system.txt, newsworthiness-test/user.txt
   → Result: canUseCelebrityLikeness = false, hasViolation = true
   → API returns 400 error with violation info
   → Frontend shows TermsViolationDialog popup
   → User must amend description to proceed
```

### Scenario 1b: Newsworthy Celebrity Timeline (Allowed)
```
1. Newsworthiness Test: ✅
   → Uses: newsworthiness-test/system.txt, newsworthiness-test/user.txt
   → Result: canUseCelebrityLikeness = true (e.g., "Election of Governor Cuomo")
   → Proceeds to description generation

2. Anchor Generation: ✅
   → Uses: anchor/system.txt, anchor/user.txt
   → Output: Anchor style appropriate to subject

3. Description Generation: ✅
   → Uses: descriptions/system.txt, descriptions/user-prompt.txt
   → Image Instructions: image-prompt-instructions-with-anchor.txt
   → canUseCelebrityLikeness = true → May use celebrity likenesses
   → Result: Descriptions + image prompts with celebrity likenesses allowed
```

### Scenario 2: Non-Celebrity Timeline (Historical Event)
```
1. Newsworthiness Test: ✅
   → Uses: newsworthiness-test/system.txt, newsworthiness-test/user.txt
   → Result: canUseCelebrityLikeness = false (not celebrity content)
   → No violation (not celebrity content, so allowed)
   → Proceeds to description generation

2. Anchor Generation: ✅
   → Uses: anchor/system.txt, anchor/user.txt
   → Output: Anchor style appropriate to subject

3. Description Generation: ✅
   → Uses: descriptions/system.txt, descriptions/user-prompt.txt
   → Image Instructions: image-prompt-instructions-with-anchor.txt
   → canUseCelebrityLikeness = false → Blocks celebrity content (not applicable)
   → Result: Descriptions + image prompts for non-celebrity subject
```

### Scenario 3: Fetal Development Timeline
```
1. Anchor Generation: ✅
   → Uses: anchor/system.txt, anchor/user.txt
   → Output: Anchor style for medical/scientific visualization

2. Factual Details Generation: ✅
   → Additional API call to fact-checker
   → Output: factualDetails object with medical facts

3. Description Generation: ✅
   → Uses: descriptions/system.txt, descriptions/user-prompt.txt
   → Image Instructions: image-prompt-instructions-with-anchor-factual.txt
   → Reason: Anchor exists AND factual details available
   → Result: Medically accurate descriptions + image prompts
```

### Scenario 4: Anchor Generation Failed
```
1. Anchor Generation: ❌ (failed)
   → Error logged, continues without Anchor
   → anchorStyle = null

2. Description Generation: ✅
   → Uses: descriptions/system.txt, descriptions/user-prompt.txt
   → Image Instructions: image-prompt-instructions-without-anchor.txt
   → Reason: No Anchor available
   → Result: Descriptions + basic image prompts (no visual consistency)
```

---

## Template Variables Reference

### Anchor Prompts
- `{{timelineDescription}}` - Full timeline description
- `{{eventTitles}}` - Comma-separated event titles
- `{{imageStyle}}` - Image style (e.g., "Illustration")
- `{{themeColor}}` - Hex color code (optional)

### Description Prompts
- `{{writingStyleInstructions}}` - Style-specific text
- `{{imagePromptInstructions}}` - Conditional instructions (varies)
- `{{eventCount}}` - Number of events
- `{{canUseCelebrityLikeness}}` - Boolean from newsworthiness test
- `{{timelineDescription}}` - Full timeline description
- `{{sourceRestrictions}}` - Array of source URLs/names
- `{{imageContext}}` - Image style + theme color context
- `{{events}}` - Array of {year, title} objects
- `{{anchorStylePreview}}` - First 100 chars of Anchor
- `{{themeColor}}` - Hex color code (optional)

### Newsworthiness Test Prompts
- `{{timelineTitle}}` - User's timeline title
- `{{timelineDescription}}` - User's timeline description

### Template Syntax
- `{{variable}}` - Simple replacement
- `{{#if variable}}...{{/if}}` - Conditional block
- `{{#each array}}...{{/each}}` - Loop through array
- `{{@index}}` - Current index in loop

---

## Editing Prompts

All prompts are in `prompts/` directory and can be edited directly:

1. **Anchor prompts**: Edit `prompts/anchor/` files
2. **Description prompts**: Edit `prompts/descriptions/` files
3. **Changes take effect immediately** (no restart needed)
4. **See**: `prompts/README.md` for detailed editing guide

---

## Key Decisions

### When is Newsworthiness Test Performed?
- **Answer**: BEFORE description generation (if timelineTitle provided)
- **Purpose**: Determine if celebrity likenesses can be used legally
- **Result**: 
  - If violation (celebrity + high risk) → API returns 400, shows dialog
  - If passed → `canUseCelebrityLikeness = true`, proceeds normally
  - If failed/no title → `canUseCelebrityLikeness = false`, proceeds with restrictions

### When is Anchor Generated?
- **Answer**: ALWAYS (for all timelines that pass newsworthiness check)
- **Exception**: If generation fails, continues without it

### When are Factual Details Used?
- **Answer**: When timeline is a progression AND fact-checking succeeds
- **Detection**: `appearsToBeProgression === true` + fact-checker returns data

### Which Image Prompt Instructions?
- **With Anchor + Factual**: `image-prompt-instructions-with-anchor-factual.txt`
- **With Anchor + Regular**: `image-prompt-instructions-with-anchor.txt` (includes `canUseCelebrityLikeness`)
- **Without Anchor**: `image-prompt-instructions-without-anchor.txt` (includes `canUseCelebrityLikeness`)

### Celebrity Content Handling
- **If `canUseCelebrityLikeness = true`**: May use celebrity likenesses for newsworthy content
- **If `canUseCelebrityLikeness = false`**: Blocks celebrity content entirely, focuses on non-celebrity subjects
- **Violation**: If celebrity content detected + high risk → Blocks generation, shows TermsViolationDialog

---

## Related Documentation

- [Timeline Creation Flow](TIMELINE_CREATION_FLOW.md) - Complete user flow
- [Newsworthiness Test](NEWSWORTHINESS_TEST.md) - Detailed guide to newsworthiness testing
- [Prompts README](../prompts/README.md) - How to edit prompts
- [Timeline Generation Flow](reference/TIMELINE_GENERATION_FLOW.md) - Technical flow

