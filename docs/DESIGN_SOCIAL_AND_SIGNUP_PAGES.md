# Design Description: Social Media Timeline Page & Account Creation Page

## 1. Account Creation Page (`/sign-up`)

### Location
`app/(auth)/sign-up/[[...sign-up]]/page.tsx`

### Layout Structure
- **Container**: Full viewport height (`min-h-screen`)
- **Layout**: Centered grid layout (`grid place-items-center`)
- **Padding**: 6 units (`p-6`)

### Components

#### 1. Clerk SignUp Component
- **Component**: `<SignUp />` from `@clerk/nextjs`
- **Configuration**:
  - Routing: `path` (uses path-based routing)
  - Path: `/sign-up`
  - Sign-in URL: `/sign-in`
  - Fallback redirect: `/` (home page)
  - **Appearance Customization**:
    - Footer: Hidden (`display: 'none'`) - custom footer is used instead

#### 2. Terms & Conditions Notice
- **Position**: Below the SignUp component (`mt-4`)
- **Layout**: Centered text (`text-center`)
- **Text Size**: Small (`text-sm`)
- **Color**: Muted foreground (`text-muted-foreground`)
- **Max Width**: Medium (`max-w-md`)
- **Content**: 
  - Text: "By signing up, you agree to our"
  - Links:
    - "Terms & Conditions" → `/legal/terms` (opens in new tab)
    - "Privacy Policy" → `/legal/privacy` (opens in new tab)
  - **Link Styling**: Primary color with underline (`text-primary underline`)

### Visual Design
- **Background**: Default background color (`bg-background`)
- **Centering**: Both horizontal and vertical center alignment
- **Spacing**: 6 units padding around the container

### Error State
- **Condition**: If Clerk publishable key is invalid or missing
- **Layout**: Same centered grid layout
- **Content**:
  - Heading: "Authentication not configured" (text-2xl, semibold)
  - Description: Instructions to set up Clerk keys
  - Max width: Medium (`max-w-md`)

---

## 2. Social Media Timeline Creation Page (`/social`)

### Location
`app/(main)/social/page.tsx`

### Layout Structure
- **Container**: Full viewport height (`min-h-screen`)
- **Background**: Default background (`bg-background`)
- **Main Content**: 
  - Container with max width (`container mx-auto px-4 py-8 max-w-6xl`)

### Header Section
- **Component**: `<Header />` (standard app header)
- **Toaster**: Toast notifications component

### Page Header
- **Layout**: Flex container with gap (`flex items-center gap-3 mb-4`)
- **Icon**: Sparkles icon (8x8, primary color)
- **Title**: "Create Social Media Timeline" (text-3xl, bold)
- **Description**: 
  - Text: "Choose a social media platform and template to automatically generate a timeline from your social media content."
  - Styling: Muted foreground, large text (`text-muted-foreground text-lg`)
- **Spacing**: Bottom margin 8 units (`mb-8`)

### Section 1: Platform Selection
- **Title**: "Select Platform" (text-xl, semibold, mb-4)
- **Grid Layout**: 
  - Mobile: 2 columns (`grid-cols-2`)
  - Medium: 3 columns (`md:grid-cols-3`)
  - Large: 6 columns (`lg:grid-cols-6`)
  - Gap: 4 units (`gap-4`)

#### Platform Cards
Each platform card:
- **Component**: `<Card />` with padding 4 (`p-4`)
- **Interactivity**: 
  - Cursor pointer
  - Hover: Shadow medium (`hover:shadow-md`)
  - Transition: All properties (`transition-all`)
- **Selected State**:
  - Ring: 2px primary color (`ring-2 ring-primary`)
  - Background: Primary color at 5% opacity (`bg-primary/5`)
- **Unselected State**:
  - Hover background: Muted at 50% opacity (`hover:bg-muted/50`)

**Card Content**:
- **Layout**: Centered text (`text-center`)
- **Icon**: Large emoji (text-4xl, mb-2)
- **Platform Name**: 
  - Font: Medium weight
  - Selected: Primary color
  - Unselected: Default text color

**Platforms** (6 total):
1. Twitter/X - 🐦
2. Instagram - 📷
3. Facebook - 📘
4. LinkedIn - 💼
5. TikTok - 🎵
6. YouTube - 📺

### Section 2: Template Selection
- **Conditional**: Only shows when a platform is selected
- **Title**: "Choose a Template for [Platform Name]" (text-xl, semibold, mb-4)
- **Grid Layout**:
  - Mobile: 1 column (`grid-cols-1`)
  - Medium+: 2 columns (`md:grid-cols-2`)
  - Gap: 4 units (`gap-4`)

#### Template Cards
Each template card:
- **Component**: `<Card />` with padding 6 (`p-6`)
- **Interactivity**:
  - Cursor pointer
  - Hover: Shadow large (`hover:shadow-lg`)
  - Transition: All properties
- **Selected State**:
  - Ring: 2px primary color
  - Background: Primary color at 5% opacity
- **Unselected State**:
  - Hover background: Muted at 50% opacity

**Card Content**:
- **Top Row**: Flex layout, space between (`flex items-start justify-between mb-3`)
  - Left: Large emoji icon (text-3xl)
  - Right: Category badge
- **Title**: Template title (text-lg, semibold, mb-2)
- **Description**: Template description (text-sm, muted foreground)
- **Selected Indicator** (when selected):
  - Layout: Flex items center, primary color
  - Icon: ArrowRight (w-4 h-4, mr-2)
  - Text: "Selected" (text-sm, font-medium)

**Category Badges**:
- **Engagement**: Orange background/text (`bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`)
- **Seasonal**: Green background/text (`bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`)
- **Career**: Blue background/text (`bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`)
- **Personal**: Purple background/text (`bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`)
- **Content**: Pink background/text (`bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200`)

#### Custom Template Card
- **Position**: Last card in the template grid
- **Styling**: 
  - Dashed border (`border-dashed`)
  - Border width: 2px (`border-2`)
  - Selected: Primary border color
  - Unselected: Default border color
- **Content**:
  - Icon: ✨ (text-3xl, centered)
  - Title: "Create Custom Timeline" (text-lg, semibold, centered, mb-2)
  - Description: "Define your own title and description for a personalized social media timeline." (text-sm, muted, centered)
  - Selected indicator: Same as template cards

### Section 3: Custom Template Form
- **Conditional**: Only shows when "Custom Timeline" is selected
- **Component**: `<Card />` with padding 6 (`p-6`)
- **Title**: "Custom Timeline Details" (text-lg, semibold, mb-4)

#### Form Fields
**Field 1: Timeline Title**
- **Label**: "Timeline Title" (`<Label />`)
- **Input**: 
  - Type: Text input (`<Input />`)
  - Placeholder: "e.g., Most Disliked Tweets from BBC"
  - Spacing: Margin top 1 (`mt-1`)
- **Helper Text**: 
  - "Enter a descriptive title for your timeline. You can reference specific accounts using [Account] placeholder."
  - Styling: Extra small, muted foreground (`text-xs text-muted-foreground mt-1`)

**Field 2: Timeline Description**
- **Label**: "Timeline Description" (`<Label />`)
- **Input**: 
  - Type: Textarea (`<Textarea />`)
  - Placeholder: "e.g., A timeline of the most controversial or disliked tweets from BBC, organized chronologically to show patterns and public reaction."
  - Min height: 100px (`min-h-[100px]`)
  - Spacing: Margin top 1
- **Helper Text**: 
  - "Describe what this timeline will contain and how it will be organized."
  - Styling: Extra small, muted foreground

**Form Layout**: Vertical spacing 4 units (`space-y-4`)

### Section 4: Create Button (Sticky Footer)
- **Conditional**: Only shows when a template is selected OR custom form is active
- **Position**: Sticky bottom (`sticky bottom-0`)
- **Background**: Background color at 95% opacity with backdrop blur (`bg-background/95 backdrop-blur-sm`)
- **Border**: Top border (`border-t`)
- **Padding**: Top and bottom 6 units (`pt-6 pb-6`)
- **Margin**: Top 8 units (`mt-8`)

#### Footer Card
- **Component**: `<Card />` with padding 6 (`p-6`)
- **Layout**: Flex items center, space between (`flex items-center justify-between`)

**Left Side**:
- **Title**: "Ready to Create" (font-semibold, text-lg, mb-1)
- **Subtitle**: 
  - Custom: Shows custom title or "Custom Timeline"
  - Template: Shows selected template title
  - Styling: Small text, muted foreground (`text-sm text-muted-foreground`)

**Right Side**:
- **Button**: 
  - Size: Large (`size="lg"`)
  - Text: "Create Timeline"
  - Icon: ArrowRight (w-4 h-4)
  - Gap: 2 units (`gap-2`)
  - **Disabled State**: 
    - When custom form is active AND (title OR description is empty)
    - Button becomes disabled

### Authentication
- **Requirement**: User must be signed in
- **Redirect**: If not authenticated, redirects to `/sign-in`
- **Loading State**: Returns null while Clerk is loading

### User Flow
1. User selects a platform → Platform cards highlight, templates appear
2. User selects a template OR custom option → Template/custom card highlights
3. If custom: Form appears for title/description input
4. Create button appears at bottom (sticky)
5. User clicks "Create Timeline" → Navigates to `/editor` with pre-filled data

### Data Flow
- **Template Selection**: Passes template title, description, platform, and template ID via URL params
- **Custom Selection**: Passes custom title, description, platform, and "custom" source via URL params
- **Editor Integration**: Editor page reads URL params and pre-fills the timeline creation form

### Responsive Design
- **Mobile**: 
  - Platform grid: 2 columns
  - Template grid: 1 column
  - Padding: 4 units
- **Tablet (md)**:
  - Platform grid: 3 columns
  - Template grid: 2 columns
- **Desktop (lg)**:
  - Platform grid: 6 columns (all platforms in one row)
  - Template grid: 2 columns

### Color Scheme
- **Primary**: Used for selected states, links, and accents
- **Muted**: Used for descriptions and helper text
- **Background**: Default app background
- **Border**: Subtle borders with border color
- **Category Colors**: Platform-specific colors for badges

### Typography
- **Headings**: Bold, large sizes (text-3xl, text-xl, text-lg)
- **Body**: Standard text sizes (text-sm, text-base)
- **Helper Text**: Extra small (text-xs)
- **Font Weights**: Bold for headings, semibold for section titles, medium for labels

### Interactive States
- **Hover**: Cards show shadow and background color change
- **Selected**: Cards show ring border and primary background tint
- **Disabled**: Button is disabled when custom form is incomplete
- **Transitions**: Smooth transitions on all interactive elements

