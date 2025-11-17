# Design Description: Step 1 - Timeline Information

## Location
`components/timeline-editor/TimelineInfoStep.tsx`

## Overview
Step 1 is the initial information gathering step in the timeline creation flow. It collects basic timeline metadata, description options, and advanced configuration options through an accordion.

## Layout Structure
- **Container**: Vertical spacing 6 units (`space-y-6`)
- **Header Section**: Title and subtitle
- **Form Fields**: Vertical spacing 4 units (`space-y-4`)
- **Accordion**: "More Options" collapsible section

---

## Header Section

### Title
- **Text**: "Step 1: Timeline Information"
- **Styling**: text-2xl, font-display, font-semibold, mb-4

### Subtitle
- **Text**: "Provide basic information about your timeline"
- **Styling**: text-muted-foreground, mb-6

---

## Required Fields

### 1. Timeline Name

**Label**:
- **Text**: "Timeline Name"
- **Styling**: text-base, mb-2, block

**Input Field**:
- **Type**: Text input (`<Input />`)
- **ID**: `timeline-name`
- **Placeholder**: "e.g., The Great British Bake Off Winners Journey"
- **Value**: Bound to `timelineName` state
- **Height**: 10 units (`h-10`)
- **Validation**: Required (checked in `canProceed()`)

---

### 2. Description

**Label**:
- **Text**: "Description"
- **Styling**: text-base, mb-2, block

#### Subject Type Selection (Conditional)

**Trigger Condition**: 
- Only appears when `timelineName` has at least 3 characters
- Only appears when `isPersonSubject === null` (not yet selected)

**Layout**:
- **Container**: mb-3, space-y-2
- **Label**: "Is the subject of your timeline a person?" (text-sm)

**Buttons**:
- **Layout**: Flex gap-2
- **Button 1**: "Yes, it's a person"
  - Variant: Outline
  - Size: Small
  - Flex: 1 (equal width)
  - Action: Sets `isPersonSubject = true`
- **Button 2**: "No, it's something else"
  - Variant: Outline
  - Size: Small
  - Flex: 1 (equal width)
  - Action: Sets `isPersonSubject = false`

#### Description Template Dropdown (Conditional)

**Trigger Condition**:
- Only appears when `isPersonSubject !== null` (subject type selected)
- Only appears when description options are available

**Layout**:
- **Container**: mb-3, space-y-2
- **Label**: "Choose a description template:" (text-sm)

**Select Component**:
- **Component**: `<Select />` from shadcn/ui
- **Value**: Bound to `timelineDescription`
- **Placeholder**: "Select a description template"
- **Options**: 
  - **Person Subjects** (6 options):
    1. "A biographical timeline of the key moments and milestones in their life and career."
    2. "An overview of their public life, documenting their major achievements and significant events."
    3. "A critical analysis of their impact and influence on their field and the wider culture."
    4. "An examination of the key themes and patterns that have defined their work and legacy."
    5. "A historical account of a significant event or period, and their central role within it."
    6. "A visual summary exploring the context, causes, and consequences of a notable controversy or achievement."
  - **Non-Person Subjects** (5 options):
    1. "A historical timeline of its origin, key events, and evolution over time."
    2. "An overview of its creation, major milestones, and lasting impact."
    3. "A critical analysis of its cultural significance, influence, and legacy."
    4. "An examination of the key themes, styles, and defining characteristics of the subject."
    5. "A detailed account of a specific era, event, or controversy associated with the subject."

**Textarea Field**:
- **Type**: Textarea (`<Textarea />`)
- **ID**: `timeline-description`
- **Placeholder**: "e.g., A timeline of all the winners, memorable moments, and show-stopping bakes from the iconic baking competition"
- **Value**: Bound to `timelineDescription` state
- **Height**: Minimum 120px (`min-h-[120px]`)
- **Resize**: Disabled (`resize-none`)
- **Rows**: 5
- **Validation**: Required (checked in `canProceed()`)

---

### 3. Hashtags

**Label**:
- **Text**: "Hashtags"
- **Styling**: text-base, mb-2, block

**Helper Text**:
- **Text**: "Add hashtags to help others discover your timeline. Press Enter or comma to add."
- **Styling**: text-sm, text-muted-foreground, mb-2

**Component**:
- **Component**: `<HashtagInput />` (custom component)
- **Props**:
  - `hashtags`: Array of hashtag strings
  - `onChange`: Callback to update hashtags
  - `placeholder`: "Type to search or add hashtags..."
- **Behavior**: 
  - Press Enter or comma to add hashtag
  - Supports search/autocomplete
  - Displays as removable badges

---

### 4. Max Events

**Layout**: mt-2, space-y-2

**Conditional Helper Text**:
- **If maxEvents <= 20**:
  - Text: "AI will generate up to 20 events based on your timeline description"
  - Styling: text-sm, text-muted-foreground
- **If maxEvents > 20**:
  - Text: "For > 20 events, enter the max number here. (If using AI, each image costs 1 credit)"
  - Styling: text-sm, text-muted-foreground

**Input Field**:
- **Layout**: Flex items-center, gap-2
- **Label**: "Max Events:" (text-sm)
- **Input**:
  - **Type**: Text input (`<Input />`)
  - **ID**: `max-events`
  - **Input Mode**: Numeric (`inputMode="numeric"`)
  - **Pattern**: `[0-9]*` (numeric only)
  - **Value**: Bound to `maxEventsInput state
  - **Width**: 28 units (`w-28`)
  - **Height**: 9 units (`h-9`)
  - **Validation**:
    - Only accepts digits
    - Range: 1-100
    - Default: 20 if empty on blur
    - Clamps to 1 if < 1, 100 if > 100
- **Helper Text**: "(max 100)" (text-xs, text-muted-foreground)

**Behavior**:
- Updates `maxEvents` state on valid input
- Validates on blur (ensures value is within range)
- Defaults to 20 if empty on blur

---

## More Options Accordion

**Component**: `<Accordion />` from shadcn/ui
- **Type**: Single, collapsible
- **Value**: `"more-options"`
- **Trigger**: "More Options"

### Accordion Content

**Layout**: space-y-4, pt-2

#### 1. Allow Fictional Information Switch

**Layout**: 
- **Container**: Flex items-center justify-between, p-4, border, rounded-lg
- **Left Side**: space-y-0.5
  - **Label**: "Allow Fictional Information" (text-base)
  - **Description**: "Enable AI to use fictional or creative content when generating timeline events" (text-sm, text-muted-foreground)
- **Right Side**: Switch component

**Switch**:
- **ID**: `allow-fictional`
- **Checked**: `!isFactual` (inverted - switch ON means NOT factual)
- **Action**: Toggles `isFactual` state
- **Default**: `isFactual = true` (switch OFF by default)

---

#### 2. Private Timeline Switch

**Layout**:
- **Container**: Flex items-center justify-between, p-4, border, rounded-lg
- **Left Side**: space-y-0.5
  - **Label**: "Private Timeline" (text-base)
  - **Description**: "Make this timeline private (only visible to you)" (text-sm, text-muted-foreground)
- **Right Side**: Switch component

**Switch**:
- **ID**: `is-private`
- **Checked**: `!isPublic` (inverted - switch ON means NOT public)
- **Action**: Toggles `isPublic` state
- **Default**: `isPublic = true` (switch OFF by default)

---

#### 3. Numbered Events Switch

**Layout**:
- **Container**: Flex items-center justify-between, p-4, border, rounded-lg
- **Left Side**: space-y-0.5, flex-1
  - **Label**: "Numbered Events" (text-base)
  - **Description**: "Use sequential numbering instead of dates (e.g., "12 Days of Christmas")" (text-sm, text-muted-foreground)
  - **Conditional Input** (shown when `isNumbered = true`):
    - **Container**: mt-3
    - **Label**: "Event Label" (text-sm, mb-1, block)
    - **Input**:
      - **Type**: Text input
      - **ID**: `number-label`
      - **Placeholder**: "Day, Event, Step, etc."
      - **Value**: Bound to `numberLabel` state
      - **Height**: 9 units (`h-9`)
      - **Default**: "Day"
    - **Helper Text**: "Events will be labeled as "{numberLabel} 1", "{numberLabel} 2", etc." (text-xs, text-muted-foreground, mt-1)
- **Right Side**: Switch component

**Switch**:
- **ID**: `is-numbered`
- **Checked**: `isNumbered` state
- **Action**: Toggles `isNumbered` state
- **Disabled**: If `setIsNumbered` is not provided
- **Default**: `isNumbered = false` (switch OFF by default)

**Behavior**:
- When enabled, hides date pickers
- When enabled, shows "Event Label" input field
- Events will be numbered sequentially instead of dated

---

#### 4. Date Range Pickers (Conditional)

**Condition**: Only shown when `isNumbered = false`

**Layout**: grid grid-cols-1 md:grid-cols-2 gap-4

##### Start Date Picker

**Label**:
- **Text**: "Start Date (Optional)"
- **Styling**: text-base, mb-2, block

**Popover Component**:
- **Trigger**: Button
  - **Variant**: Outline
  - **Width**: Full (`w-full`)
  - **Justify**: Start, text-left
  - **Font**: Normal
  - **Height**: 10 units (`h-10`)
  - **Icon**: CalendarIcon (mr-2, h-4 w-4)
  - **Text**: 
    - If `startDate` exists: Formatted date using `format(startDate, "PPP")`
    - If no date: "Pick a date" (text-muted-foreground)
- **Content**: Calendar component
  - **Mode**: Single selection
  - **Selected**: `startDate` state
  - **On Select**: Updates `startDate` via `setStartDate`
  - **Initial Focus**: Enabled
  - **Styling**: p-3, pointer-events-auto

##### End Date Picker

**Label**:
- **Text**: "End Date (Optional)"
- **Styling**: text-base, mb-2, block

**Popover Component**:
- **Trigger**: Button (same styling as Start Date)
  - **Text**: 
    - If `endDate` exists: Formatted date using `format(endDate, "PPP")`
    - If no date: "Pick a date" (text-muted-foreground)
- **Content**: Calendar component
  - **Mode**: Single selection
  - **Selected**: `endDate` state
  - **On Select**: Updates `endDate` via `setEndDate`
  - **Disabled Dates**: If `startDate` exists, disables dates before `startDate`
  - **Initial Focus**: Enabled
  - **Styling**: p-3, pointer-events-auto

**Behavior**:
- Both dates are optional
- End date cannot be before start date
- Dates are formatted using `date-fns` `format` function with "PPP" format (e.g., "January 1, 2024")

---

#### 5. Source Restrictions

**Layout**: space-y-3, p-4, border, rounded-lg

**Label**:
- **Text**: "Source Restrictions (Optional)"
- **Styling**: text-base

**Description**:
- **Text**: "Require that descriptions and titles are sourced solely from specific resources. Add social media accounts, websites, or custom sources."
- **Styling**: text-sm, text-muted-foreground

**Input Section**:
- **Layout**: Flex gap-2

**Source Type Dropdown**:
- **Component**: `<Select />`
- **Value**: `sourceType` state
- **Width**: 180px (`w-[180px]`)
- **Height**: 9 units (`h-9`)
- **Options**:
  1. "Custom Source" (value: `custom`)
  2. "Website URL" (value: `url`)
  3. "Twitter/X" (value: `twitter`)
  4. "Instagram" (value: `instagram`)
  5. "TikTok" (value: `tiktok`)
  6. "Facebook" (value: `facebook`)
  7. "LinkedIn" (value: `linkedin`)
  8. "YouTube" (value: `youtube`)

**Source Input Field**:
- **Layout**: flex-1, relative
- **Type**: Text input (`<Input />`)
- **ID**: `source-restrictions`
- **Placeholder**: Dynamic based on `sourceType` (from `SOURCE_TYPE_CONFIGS`)
- **Value**: `sourceInput` state
- **Height**: 9 units (`h-9`)
- **Validation**:
  - Shows error state (border-destructive) if `sourceError` exists
  - Clears error on input change
  - Validates on Enter key or "Add" button click
- **Keyboard**: Enter key triggers `handleAddSource()`
- **Error Display**: 
  - If `sourceError` exists: Shows error text (text-xs, text-destructive, absolute, mt-1)

**Add Button**:
- **Type**: Button
- **Variant**: Outline
- **Size**: Small
- **Text**: "Add"
- **Disabled**: When `sourceInput` is empty
- **Action**: Calls `handleAddSource()`

**Helper Text**:
- **Text**: "Example: {example from SOURCE_TYPE_CONFIGS}"
- **Styling**: text-xs, text-muted-foreground

**Source Badges** (if sources added):
- **Layout**: flex flex-wrap gap-2, mt-2
- **Badge Component**: 
  - Variant: Secondary
  - Content:
    - **Icon**: Platform-specific icon (detected from source text)
      - Twitter: Twitter icon
      - Instagram: Instagram icon
      - TikTok: Music icon (closest match)
      - Facebook: Facebook icon
      - LinkedIn: LinkedIn icon
      - YouTube: YouTube icon
      - URL/Custom: Globe icon
    - **Text**: Source text (max-w-xs, truncate)
    - **Remove Button**: X icon (w-3 h-3), hover:bg-secondary, rounded-full, p-0.5
  - **Action**: Clicking X removes the source from the list

**Auto-Detection**:
- Automatically detects source type from input text
- Only auto-detects if current type is "custom"
- Updates dropdown to match detected type

**Validation**:
- Each source type has specific validation rules
- Invalid sources show error message
- Valid sources are formatted and added to list

---

#### 6. Reference Photo Upload

**Layout**: space-y-3, p-4, border, rounded-lg

**Label**:
- **Text**: "Reference Photo (Optional)"
- **Styling**: text-base

**Description**:
- **Text**: "Upload a reference photo to base illustrations on. You must confirm who is in the photo and that you have permission to use it."
- **Styling**: text-sm, text-muted-foreground

##### Upload State (No Photo)

**File Input**:
- **Type**: Hidden file input (`<input type="file" />`)
- **Accept**: `image/jpeg,image/png,image/gif,image/webp`
- **Ref**: `fileInputRef`
- **Disabled**: When `isUploadingPhoto = true`
- **On Change**: Calls `handleFileSelect()`

**Upload Button**:
- **Type**: Button
- **Variant**: Outline
- **Size**: Small
- **Content**:
  - **If Uploading**:
    - Loader2 icon (w-4 h-4, mr-2, animate-spin)
    - Text: "Uploading..."
  - **If Not Uploading**:
    - Upload icon (w-4 h-4, mr-2)
    - Text: "Upload Reference Photo"
- **Disabled**: When `isUploadingPhoto = true`
- **Action**: Triggers file input click

**File Validation**:
- **Types**: JPEG, PNG, GIF, WebP only
- **Size**: Maximum 10MB
- **Error Handling**: Shows toast notification for invalid files

**Upload Process**:
1. Creates temporary blob URL for preview
2. Uploads to Cloudinary via `/api/upload` endpoint
3. Includes `x-reference-photo: true` header
4. Updates preview with Cloudinary URL
5. Revokes temporary blob URL
6. Shows success toast

##### Preview State (Photo Uploaded)

**Preview Image**:
- **Container**: relative, w-full, h-48, border, rounded-lg, overflow-hidden, bg-muted
- **Image**: 
  - Source: `previewUrl` (Cloudinary URL)
  - Alt: "Reference photo preview"
  - Styling: w-full, h-full, object-contain
- **Remove Button**:
  - Position: absolute, top-2, right-2
  - Variant: Destructive
  - Size: Icon (h-8 w-8)
  - Icon: X (w-4 h-4)
  - Action: Calls `handleRemovePhoto()`

**Person Name Input**:
- **Label**: "Who is in this photo? *" (text-sm)
- **Type**: Text input
- **ID**: `photo-person-name`
- **Placeholder**: "e.g., Taylor Swift, Zohran Mamdani, etc."
- **Value**: `referencePhotoPersonName` state
- **Height**: 9 units (`h-9`)
- **Required**: Yes (indicated by asterisk)

**Permission Checkbox**:
- **Layout**: flex items-start space-x-2
- **Component**: `<Checkbox />`
- **ID**: `photo-permission`
- **Checked**: `referencePhotoHasPermission` state
- **Action**: Updates permission state
- **Label**: "I confirm that I have permission to use this photo for image generation" (text-sm, font-normal, cursor-pointer)

**Validation Message** (if incomplete):
- **Condition**: Photo uploaded but name or permission missing
- **Text**: "Please provide the person's name and confirm you have permission to use this photo."
- **Styling**: text-xs, text-muted-foreground

**State Management**:
- `referencePhoto` object contains:
  - `file`: File object (null after upload, only URL stored)
  - `url`: Cloudinary URL string
  - `personName`: String
  - `hasPermission`: Boolean

---

## Validation Rules

### Required Fields
1. **Timeline Name**: Must not be empty
2. **Description**: Must not be empty

### Optional Fields
- All other fields are optional
- Max Events: Defaults to 20 if not specified
- Dates: Can be left unset
- Source Restrictions: Can be empty
- Reference Photo: Can be omitted

### Conditional Validation
- **Reference Photo**: If uploaded, requires:
  - Person name (non-empty string)
  - Permission checkbox checked

---

## State Management

### Local State
- `maxEventsInput`: String representation of max events
- `sourceInput`: Current source input text
- `sourceType`: Selected source type
- `sourceError`: Validation error message
- `referencePhotoPersonName`: Name of person in reference photo
- `referencePhotoHasPermission`: Permission confirmation
- `previewUrl`: Preview URL for uploaded photo
- `isUploadingPhoto`: Upload progress state
- `isPersonSubject`: Boolean or null (person/thing selection)
- `fileInputRef`: Reference to hidden file input

### Props State (Managed by Parent)
- `timelineName`: Timeline title
- `timelineDescription`: Timeline description
- `isPublic`: Public/private setting
- `isFactual`: Factual/fictional setting
- `startDate`: Optional start date
- `endDate`: Optional end date
- `isNumbered`: Numbered events toggle
- `numberLabel`: Label for numbered events
- `maxEvents`: Maximum number of events
- `sourceRestrictions`: Array of source strings
- `referencePhoto`: Reference photo object
- `hashtags`: Array of hashtag strings

---

## User Flow

1. **User enters timeline name** → Subject type buttons appear (if name ≥ 3 chars)
2. **User selects person/thing** → Description template dropdown appears
3. **User selects template** → Description textarea is pre-filled
4. **User can edit description** → Manual editing allowed
5. **User adds hashtags** → Optional, for discoverability
6. **User sets max events** → Optional, defaults to 20
7. **User expands "More Options"** → Advanced settings appear
8. **User configures switches** → Fictional, private, numbered options
9. **User sets dates** → Optional, only if not numbered
10. **User adds sources** → Optional, for content restrictions
11. **User uploads reference photo** → Optional, requires name and permission

---

## Responsive Design

- **Date Pickers**: Stack vertically on mobile (`grid-cols-1`), side-by-side on desktop (`md:grid-cols-2`)
- **Source Input**: Full width on mobile, flex-1 on desktop
- **Accordion**: Full width on all screen sizes
- **Buttons**: Full width on mobile where appropriate, auto width on desktop

---

## Accessibility

- All inputs have proper labels
- File input is hidden but accessible via button
- Checkboxes have associated labels
- Error messages are announced
- Keyboard navigation supported (Enter to add sources)
- Focus management in date pickers

---

## Visual Design

### Colors
- **Primary**: Used for active states, links
- **Muted**: Used for helper text, placeholders
- **Destructive**: Used for error states, remove buttons
- **Secondary**: Used for badges, switches

### Spacing
- **Section Spacing**: 6 units between major sections
- **Field Spacing**: 4 units between form fields
- **Internal Spacing**: 2-3 units within components

### Typography
- **Headings**: text-2xl, text-base (labels)
- **Body**: text-sm, text-xs (helper text)
- **Font Weights**: Semibold (headings), normal (body)

