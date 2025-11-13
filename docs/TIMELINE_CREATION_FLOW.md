# Timeline Creation Flow - Visual Guide

This document provides a comprehensive visual guide to the timeline creation process, including all steps, inputs, options, and API calls.

## Overview

The timeline creation process consists of **6 steps** that guide users through creating a complete timeline with AI-generated content and images.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TIMELINE CREATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: Timeline Info  →  Step 2: Writing Style & Events  →          │
│  Step 3: Event Details  →  Step 4: Image Style  →                        │
│  Step 5: Generate Images  →  Step 6: Review & Publish                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Timeline Information

### Required Inputs
- **Timeline Name** (text input)
  - Example: "The Great British Bake Off Winners Journey"
  
- **Description** (textarea, 5 rows)
  - Example: "A timeline of all the winners, memorable moments, and show-stopping bakes from the iconic baking competition"

### Optional Inputs (in "More Options" accordion)

#### Basic Options
- **Hashtags** (tag input)
  - Press Enter or comma to add
  - Used for discoverability
  
- **Max Events** (number input, 1-100)
  - Default: 20
  - Each image costs 1 credit

#### Advanced Options
- **Allow Fictional Information** (toggle switch)
  - Default: OFF (factual mode)
  - When ON: AI can generate creative/fictional content
  
- **Private Timeline** (toggle switch)
  - Default: OFF (public)
  - When ON: Timeline only visible to creator

- **Numbered Events** (toggle switch)
  - Default: OFF (uses dates)
  - When ON: Events numbered sequentially (e.g., "Day 1", "Day 2")
  - **Event Label** (text input, appears when numbered is ON)
    - Default: "Day"
    - Examples: "Day", "Event", "Step", "Week"

- **Start Date** (date picker, optional)
  - Only shown when "Numbered Events" is OFF
  - Calendar popup for date selection

- **End Date** (date picker, optional)
  - Only shown when "Numbered Events" is OFF
  - Must be after Start Date
  - Calendar popup for date selection

- **Source Restrictions** (text input + badges)
  - Add multiple sources
  - Examples: "The writings of Noam Chomsky", "Official NHS publications"
  - AI must source information ONLY from these sources

- **Reference Photo** (file upload)
  - Upload JPEG, PNG, GIF, or WebP (max 10MB)
  - **Person Name** (required if photo uploaded)
    - Text input: "e.g., Taylor Swift, Zohran Mamdani"
  - **Permission Checkbox** (required if photo uploaded)
    - "I confirm that I have permission to use this photo for image generation"
  - Photo uploaded to Cloudinary
  - Used for person matching in image generation

### Validation
- ✅ Can proceed if: Timeline Name AND Description are filled

---

## Step 2: Writing Style & Events

### Required Inputs

#### 1. Writing Style Selection
- **Preset Styles** (button group):
  - Narrative
  - Jovial
  - Professional
  - Casual
  - Academic
  - Poetic

- **Custom Style** (textarea, 2 rows, optional)
  - Example: "in the style of Jack Bauer from the television series 24"
  - Overrides preset if provided

#### 2. Event Generation

**Option A: Generate with AI** (primary button)
- Calls: `POST /api/ai/generate-events`
- Request body:
  ```json
  {
    "timelineDescription": "...",
    "timelineName": "...",
    "maxEvents": 20,
    "isFactual": true,
    "isNumbered": false,
    "numberLabel": "Day",
    "sourceRestrictions": ["..."] // optional
  }
  ```
- Response:
  ```json
  {
    "events": [
      { "year": 2020, "title": "..." },
      { "year": 2021, "title": "..." }
    ],
    "imageReferences": [ // optional, if people detected
      { "name": "Person Name", "url": "https://..." }
    ],
    "sources": [...] // optional, if web search used
  }
  ```
- **Warning shown**: AI may contain inaccuracies for recent events (2023-present)
- Button disabled after successful generation

**Option B: Add Manually** (secondary button)
- Adds empty event to list
- User fills in year/number and title manually

### Events List Display
- Each event shows:
  - **Year/Number input** (number input, width: 32)
    - For numbered: Shows "Day 1", "Day 2", etc.
    - For dated: Shows year input
  - **Title input** (text input)
  - **Delete button** (trash icon)

### Validation
- ✅ Can proceed if:
  - Writing style OR custom style is selected
  - At least one event exists
  - All events have titles

---

## Step 3: Event Details

### Required Inputs

#### Generate Descriptions
- **"Generate Descriptions with AI"** button (full width)
- Calls: `POST /api/ai/generate-descriptions`
- Request body:
  ```json
  {
    "events": [
      { "year": 2020, "title": "..." },
      { "year": 2021, "title": "..." }
    ],
    "timelineDescription": "...",
    "writingStyle": "Narrative",
    "imageStyle": "Illustration", // Always included
    "themeColor": "#DC2626", // Optional
    "sourceRestrictions": ["..."] // Optional
  }
  ```
- Response:
  ```json
  {
    "descriptions": ["...", "..."],
    "imagePrompts": ["...", "..."] // AI-generated prompts for images
  }
  ```
- **No credit cost** for description generation
- Generates descriptions AND image prompts for all events

#### Manual Entry
- Each event has a **Description textarea** (4 rows)
- User can type descriptions manually
- Image prompts are hidden (auto-generated, used later)

### Event Display
- Shows: Year/Number, Title, Description textarea
- All events must have descriptions to proceed

### Validation
- ✅ Can proceed if: All events have descriptions

---

## Step 4: Image Style

### Required Inputs

#### Image Style Selection
- **Preset Styles** (button group):
  - Illustration (default)
  - Watercolor
  - Sketch
  - Minimalist
  - Vintage
  - 3D Render
  - Abstract

- **Custom Style** (textarea, 2 rows, optional)
  - Example: "in a comic book hero style"
  - Overrides preset if provided

#### Theme Color (Optional)
- **Preset Colors** (button group with color swatches):
  - None
  - Blue (#3B82F6)
  - Purple (#A855F7)
  - Green (#10B981)
  - Orange (#F97316)
  - Red (#EF4444)
  - Pink (#EC4899)
  - Teal (#14B8A6)
  - Yellow (#EAB308)

- **Custom Color** (color picker + "Apply Color" button)
  - HTML5 color input
  - Applied as subtle accent in images

#### People Checkbox (Optional)
- **"This timeline includes people"** (checkbox)
  - Default: CHECKED
  - Uncheck for: concepts, processes, science, medicine
  - Affects image generation prompts

### Validation
- ✅ Can proceed if: Image style (preset or custom) is selected

---

## Step 5: Generate Images

### Two Tabs: AI Generated | Manual Upload

#### Tab 1: AI Generated

**Image Style & Color** (can be changed here)
- Same options as Step 4
- Style: Preset buttons or custom textarea
- Theme Color: Preset buttons or custom color picker

**Event Selection**
- Checkboxes for each event
- All events selected by default
- Shows: Year/Number, Title, Description preview, existing image (if any)

**Cost Display**
- Shows selected event count
- Cost calculation:
  - Each image: **1 credit**
  - Example: 13 events = **13 credits**

**Generate Button**
- Calls: `POST /api/ai/generate-images`
- Request body:
  ```json
  {
    "events": [
      {
        "title": "...",
        "description": "...",
        "year": 2020,
        "imagePrompt": "..." // From Step 3
      }
    ],
    "imageStyle": "Illustration",
    "themeColor": "#DC2626",
    "imageReferences": [...], // From Step 2 (if people detected)
    "includesPeople": true,
    "referencePhoto": { // Optional, from Step 1
      "url": "https://...",
      "personName": "..."
    }
  }
  ```
- Response:
  ```json
  {
    "images": ["https://...", "https://...", ...],
    "prompts": ["...", "...", ...]
  }
  ```

**Progress Display**
- Progress bar (0-100%)
- Shows: "Generating image X of Y (Z%)"
- Estimated time: ~4 seconds per image
- Auto-retry failed images (max 2 retries)

**Generated Images Display**
- Grid of generated images
- Each shows: Image, Year/Title, Description
- Actions per image:
  - **Edit** button (opens dialog)
  - **Regenerate** button
    - First 5 regenerations: **FREE**
    - After 5: **10 credits** each
    - Shows remaining free count

#### Tab 2: Manual Upload

- File upload for each event
- Accepts: JPEG, PNG, GIF, WebP (max 10MB)
- Shows preview after upload
- Can change/replace uploaded images

### Validation
- ✅ Can proceed if: At least one event has an image (AI or manual)

---

## Step 6: Review & Publish

### Timeline Preview
- Shows all events with:
  - Year/Number
  - Title
  - Description
  - Image (if generated/uploaded)

### Final Options
- **Timeline Name** (editable)
- **Description** (editable)
- **Public/Private** toggle (editable)
- **Hashtags** (editable)

### Publish Button
- Calls: `POST /api/timelines`
- Creates timeline in database
- Then: `POST /api/events` for each event
- Redirects to timeline view page

### Save Progress
- All state saved to `localStorage` automatically
- Persists across page refreshes
- Cleared on successful publish or cancel

---

## API Endpoints Used

### 1. Generate Events
```
POST /api/ai/generate-events
```
- **Purpose**: Generate timeline events from description
- **Cost**: No credits (included in timeline creation)
- **Timeout**: 120 seconds
- **Returns**: Events array, optional image references, optional sources

### 2. Generate Descriptions
```
POST /api/ai/generate-descriptions
```
- **Purpose**: Generate event descriptions and image prompts
- **Cost**: No credits (included in timeline creation)
- **Timeout**: 120 seconds
- **Returns**: Descriptions array, image prompts array

### 3. Generate Images
```
POST /api/ai/generate-images
```
- **Purpose**: Generate images for events
- **Cost**: 
  - Each image: 1 credit
  - Regeneration: First 5 free, then 10 credits each
- **Returns**: Image URLs array
- **Auto-retry**: Failed images retried up to 2 times

### 4. Upload Image
```
POST /api/upload
```
- **Purpose**: Upload reference photo or manual event images
- **Cost**: No credits
- **Returns**: Cloudinary URL

### 5. Create Timeline
```
POST /api/timelines
```
- **Purpose**: Save timeline to database
- **Cost**: No credits
- **Returns**: Timeline object with ID

### 6. Create Events
```
POST /api/events
```
- **Purpose**: Save events to database
- **Cost**: No credits
- **Returns**: Event objects

---

## Credit Costs Summary

| Action | Cost |
|--------|------|
| Generate Events | FREE |
| Generate Descriptions | FREE |
| Generate Images | 1 credit per image |
| Regenerate Image (first 5 per event) | FREE |
| Regenerate Image (after 5) | 10 credits |
| Upload Images | FREE |

---

## State Management

### Local Storage
- Key: `timeline-editor-state`
- Saves: All form inputs, events, current step
- Auto-saves on every change
- Auto-loads on page load
- Cleared on: Publish success, Cancel

### Form State
- All inputs are controlled components
- State persists across step navigation
- Can go back/forward between steps
- Validation prevents skipping incomplete steps

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: /editor                               │
└────────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Timeline Info                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Required: Name, Description                              │ │
│  │ Optional: Hashtags, Max Events, Dates, Source Restrictions│ │
│  │           Reference Photo, Privacy, Fictional toggle      │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                            │ [Next]
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Writing Style & Events                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Required: Writing Style, At least 1 event                 │ │
│  │ Actions: Generate with AI OR Add Manually                 │ │
│  │ API: POST /api/ai/generate-events                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                            │ [Next]
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Event Details                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Required: Description for all events                      │ │
│  │ Actions: Generate All OR Type Manually                    │ │
│  │ API: POST /api/ai/generate-descriptions                  │ │
│  │ Output: Descriptions + Image Prompts (hidden)            │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                            │ [Next]
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Image Style                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Required: Image Style (preset or custom)                  │ │
│  │ Optional: Theme Color, People checkbox                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                            │ [Next]
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Generate Images                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Tabs: AI Generated | Manual Upload                        │ │
│  │ AI Tab: Select events, Generate (10+ credits)             │ │
│  │ API: POST /api/ai/generate-images                        │ │
│  │ Manual Tab: Upload files per event                        │ │
│  │ API: POST /api/upload                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                            │ [Next]
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Review & Publish                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Preview: All events with images                           │ │
│  │ Editable: Name, Description, Privacy, Hashtags           │ │
│  │ Action: Publish                                           │ │
│  │ API: POST /api/timelines, POST /api/events              │ │
│  │ Redirect: /timeline/[id]                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   SUCCESS!    │
                    │ Timeline Live │
                    └───────────────┘
```

---

## Key Features

### Auto-Save
- All form state saved to localStorage
- Persists across page refreshes
- Resume where you left off

### Validation
- Each step validates required fields
- Cannot proceed until requirements met
- Clear error messages

### Credit System
- Free: Events, Descriptions
- Paid: Images (1 credit per image)
- Free Regenerations: First 5 per event

### AI Features
- Event generation from description
- Description generation with writing style
- Image prompt generation (automatic, hidden)
- Image generation with style/color matching
- Person matching (if reference photo provided)

### Flexibility
- Can mix AI and manual input
- Can edit any generated content
- Can regenerate images individually
- Can upload manual images instead of AI

---

## Notes

- **Image Prompts**: Generated automatically in Step 3, stored in event state, used in Step 5
- **Anchor Style**: Generated automatically for all timelines to ensure visual consistency
- **Faceless Mood Doubles**: Used for film/cultural timelines to avoid copyright issues
- **Reference Photos**: Must have person name and permission confirmation
- **Source Restrictions**: Force AI to use only specified sources for accuracy

