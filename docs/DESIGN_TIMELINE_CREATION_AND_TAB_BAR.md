# Design Description: Timeline Creation Page & Tab Bar Implementation

## 1. Timeline Creation Page (`/editor`)

### Location
`app/(main)/editor/page.tsx`

### Layout Structure
- **Container**: Full viewport height (`min-h-screen`)
- **Layout**: Flex column (`flex flex-col`)
- **Background**: Default background color (`bg-background`)
- **Main Content**: 
  - Container with max width (`container mx-auto px-4 pt-16 pb-24 max-w-5xl`)
  - Padding top: 16 units (for header)
  - Padding bottom: 24 units (for bottom navigation)

### Header
- **Component**: `<Header />` (standard app header)
- **Toaster**: Toast notifications component

### Page Header Section
- **Title**: "Create a Timeline" (text-3xl, font-display, bold, mb-2)
- **Subtitle**: "Create your AI-powered timeline in 6 simple steps" (text-muted-foreground)
- **Spacing**: Bottom margin 8 units (`mb-8`)

### Progress Steps Indicator
- **Layout**: Flex items center, space between (`flex items-center justify-between mb-8`)
- **Step Structure**: Each step has:
  - **Circle**: 10x10 rounded-full (`w-10 h-10 rounded-full`)
    - **Active/Completed**: Primary background, primary foreground text (`bg-primary text-primary-foreground`)
    - **Inactive**: Muted background, muted foreground text (`bg-muted text-muted-foreground`)
    - **Content**: Step number (font-semibold)
  - **Step Title**: Below circle (text-xs, mt-2, centered, hidden on mobile `hidden sm:block`)
  - **Connector Line**: Between steps (`h-1 flex-1 mx-2`)
    - **Completed**: Primary color (`bg-primary`)
    - **Not Completed**: Muted color (`bg-muted`)

**Steps**:
1. Timeline Info
2. Writing Style & Events
3. Event Details
4. Image Style
5. Generate Images
6. Review & Publish

### Step Content Area
- **Component**: `<Card />` with padding 6 (`p-6 mb-6`)
- **Conditional Rendering**: Shows different step components based on `currentStep`:
  - **Step 1**: `<TimelineInfoStep />`
  - **Step 2**: `<WritingStyleStep />`
  - **Step 3**: `<EventDetailsStep />`
  - **Step 4**: `<ImageStyleStep />`
  - **Step 5**: `<GenerateImagesStep />`
  - **Step 6**: Review & Publish (inline component)

### Preview Mode
- **Conditional**: Only shows when `showPreview` is true
- **Component**: `<Card />` with padding 6 (`p-6 mb-6`)
- **Content**:
  - Timeline title (text-2xl, font-display, semibold, mb-2)
  - Timeline description (text-muted-foreground)
  - Timeline cards displayed vertically (`space-y-4`)

### Navigation Buttons Section
- **Component**: `<Card />` with padding 6 (`p-6`)
- **Layout**: Flex column, gap 3 (`flex flex-col gap-3`)

#### Primary Navigation Row
- **Layout**: Flex column on mobile, row on desktop (`flex flex-col sm:flex-row justify-between gap-3`)

**Back Button**:
- **Variant**: Outline (`variant="outline"`)
- **Icon**: ArrowLeft (mr-2, h-4 w-4)
- **Text**: "Back"
- **Disabled**: When on step 1
- **Width**: Full width on mobile, auto on desktop (`w-full sm:w-auto`)

**Next/Save Buttons** (conditional based on step):

**Step 5**:
- **Button**: "Next" with ArrowRight icon
- **Disabled**: When `!canProceed()`
- **Width**: Full width on mobile, auto on desktop

**Step 6**:
- **Layout**: Flex column on mobile, row on desktop (`flex flex-col sm:flex-row gap-3 w-full sm:w-auto`)
- **Preview Button**:
  - Variant: Outline
  - Icon: Eye (mr-2, h-4 w-4)
  - Text: "Preview Timeline"
  - Disabled: When `!canProceed()`
  - Width: Flex-1 on mobile, auto on desktop
- **Save Button**:
  - Icon: Save (mr-2, h-4 w-4) or "Saving..." text
  - Text: "Save Timeline"
  - Disabled: When `!canProceed() || isSaving`
  - Width: Flex-1 on mobile, auto on desktop

**Steps 1-4**:
- **Button**: "Next" with ArrowRight icon
- **Variant**: Default when `canProceed()`, outline when `!canProceed()`
- **Width**: Full width on mobile, auto on desktop

#### Cancel Button
- **Variant**: Ghost (`variant="ghost"`)
- **Icon**: X (mr-2, h-4 w-4)
- **Text**: "Cancel"
- **Styling**: Full width, muted foreground, hover destructive (`w-full text-muted-foreground hover:text-destructive`)
- **Action**: Resets to step 1 (does not navigate away)

### State Management
- **localStorage**: All form state is saved to `localStorage` with key `'timeline-editor-state'`
- **Auto-save**: State saves automatically on any change
- **Auto-load**: State loads from localStorage on mount
- **Clear on Save**: localStorage is cleared when timeline is successfully saved

### Validation
- **Step 1**: Requires timeline name and description
- **Step 2**: Requires writing style (or custom style) and at least one event with title
- **Step 3**: Requires descriptions for all events
- **Step 4**: Requires image style (preset or custom)
- **Step 5**: Requires at least one generated image
- **Step 6**: Can always proceed (validation happens on save)

### User Flow
1. User enters timeline info (Step 1)
2. User selects writing style and generates/adds events (Step 2)
3. User adds descriptions to events (Step 3)
4. User selects image style and theme color (Step 4)
5. User generates images for events (Step 5)
6. User reviews and publishes timeline (Step 6)

### URL Parameters Support
- **Pre-fill from Social Templates**: Editor accepts URL params:
  - `title`: Pre-fills timeline name
  - `description`: Pre-fills timeline description
  - `source`: Source restriction (e.g., "twitter:custom")
  - `platform`: Platform identifier

---

## 2. Dial Widget (Create Button) Implementation

### Location
`components/layout/ExperimentalBottomMenuBar.tsx`

### Overview
The dial widget is a circular, floating button that appears at the bottom center of the screen. It serves as the primary "Create" button for the application. When clicked, it should present the user with a choice to either create a standard timeline or create a social media timeline.

### Visual Structure

#### Dial Widget
- **Shape**: Perfect circle
- **Size**: Dynamic based on viewport width (20% of viewport, min 80px, max 120px)
- **Position**: Fixed bottom, centered horizontally
- **Elevation**: Floats 30px above the tab bar
- **Background**: Card background with backdrop blur (`bg-card backdrop-blur`)
- **Border**: 2px border with 80% opacity (`border-2 border-border/80`)
- **Shadow**: Large shadow (`shadow-lg`)
- **Z-index**: 50 (above tab bar)

#### Tab Bar with Recess
- **Height**: 40px
- **Background**: Card color at 95% opacity (`bg-card/95`)
- **Recess**: Circular cutout at top center to accommodate the dial
- **Recess Size**: Dial size + 20px gap
- **Border**: Orange accent border along top edge (`#FF6B35`)
- **Backdrop Blur**: Applied for glassmorphism effect

### Dial States

#### State 1: No Timeline (Default)
- **Content**: Plus icon (8x8, stroke width 3)
- **Arc**: Full circle (100% complete)
- **Action**: Navigate to create flow selection

#### State 2: Timeline Active
- **Content**: Date information (day, month, year) or numbered value
- **Arc**: Progress indicator showing timeline position (0-100%)
- **Arc Range**: 270 degrees (-225° to +45°)
- **Arc Colors**:
  - Background: Muted foreground at 20% opacity
  - Active: Primary color with glow effect
- **Labels**: Start/end dates or numbers shown on left/right of tab bar

### Implementation Code

```typescript
"use client";

import { Plus, Home, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Sparkles } from "lucide-react";

interface DialWidgetProps {
  selectedDate?: {
    type: 'numbered' | 'dated';
    value?: string;
    day?: string | null;
    month?: string | null;
    year?: string;
  };
  timelinePosition?: number; // 0-1
  startDate?: Date;
  endDate?: Date;
  isNumbered?: boolean;
  totalEvents?: number;
}

export const DialWidget = ({
  selectedDate,
  timelinePosition = 0.5,
  startDate,
  endDate,
  isNumbered = false,
  totalEvents = 0
}: DialWidgetProps) => {
  const router = useRouter();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  
  // Calculate dial size (20% of viewport, min 80px, max 120px)
  const getDialSize = () => {
    if (typeof window !== 'undefined') {
      const vw20 = window.innerWidth * 0.2;
      return Math.min(Math.max(vw20, 80), 120);
    }
    return 80;
  };
  
  const dialSize = getDialSize();
  const radius = dialSize / 2 - 6;
  const dialCenterX = dialSize / 2;
  const dialCenterY = dialSize / 2;
  
  // Arc calculation (270-degree arc from -225° to +45°)
  const startAngle = -225;
  const endAngle = 45;
  const totalRange = endAngle - startAngle;
  const hasTimeline = selectedDate !== undefined;
  const clampedPosition = hasTimeline 
    ? Math.min(Math.max(timelinePosition, 0), 1)
    : 1;
  const currentAngle = startAngle + totalRange * clampedPosition;
  
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const polarToCartesian = (angle: number) => ({
    x: dialCenterX + radius * Math.cos(toRadians(angle)),
    y: dialCenterY + radius * Math.sin(toRadians(angle))
  });
  
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = totalRange > 180 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  
  const totalArcLength = (Math.abs(totalRange) * Math.PI * radius) / 180;
  const currentArcLength = (Math.abs(currentAngle - startAngle) * Math.PI * radius) / 180;
  
  // Tab bar dimensions
  const tabBarHeight = 40;
  const recessGap = 20;
  const recessSize = dialSize + recessGap;
  const recessRadius = recessSize / 2;
  const dialRadius = dialSize / 2;
  const centerYFromBottom = 30 + dialRadius;
  
  // Screen dimensions
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const screenCenterX = screenWidth / 2;
  const centerYInSVG = tabBarHeight - centerYFromBottom;
  const yIntersect = 0;
  const distanceFromCenter = Math.abs(centerYInSVG - yIntersect);
  const horizontalOffset = Math.sqrt(Math.max(0, recessRadius * recessRadius - distanceFromCenter * distanceFromCenter));
  const arcLeftX = screenCenterX - horizontalOffset;
  const arcRightX = screenCenterX + horizontalOffset;
  
  // Labels for tab bar
  const leftLabel = isNumbered ? "1" : (startDate ? startDate.getFullYear().toString() : null);
  const rightLabel = isNumbered ? totalEvents.toString() : (endDate ? endDate.getFullYear().toString() : null);
  
  const handleDialClick = () => {
    if (hasTimeline) {
      // If viewing a timeline, navigate to editor
      router.push("/editor");
    } else {
      // If no timeline, show create menu
      setShowCreateMenu(true);
    }
  };
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="relative">
          {/* Tab Bar with Recess */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: `${tabBarHeight}px` }}>
            <svg 
              className="absolute bottom-0 left-0 w-full pointer-events-none"
              style={{ height: `${tabBarHeight}px` }}
              viewBox={`0 0 ${screenWidth} ${tabBarHeight}`}
              preserveAspectRatio="none"
            >
              {/* Tab bar shape with circular cutout */}
              <path
                d={`
                  M 0 ${tabBarHeight}
                  L 0 0
                  L ${arcLeftX} 0
                  A ${recessRadius} ${recessRadius} 0 0 0 ${arcRightX} 0
                  L ${screenWidth} 0
                  L ${screenWidth} ${tabBarHeight}
                  Z
                `}
                fill="hsl(var(--card))"
                fillOpacity="0.95"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeOpacity="0.8"
              />
              {/* Orange accent border */}
              <path
                d={`
                  M 0 0
                  L ${arcLeftX} 0
                  A ${recessRadius} ${recessRadius} 0 0 0 ${arcRightX} 0
                  L ${screenWidth} 0
                `}
                fill="none"
                stroke="#FF6B35"
                strokeWidth="1"
                strokeOpacity="1"
              />
            </svg>
            
            {/* Backdrop blur */}
            <div 
              className="absolute bottom-0 left-0 right-0 backdrop-blur pointer-events-none"
              style={{ 
                height: `${tabBarHeight}px`,
                clipPath: `path('M 0 ${tabBarHeight} L 0 0 L ${arcLeftX} 0 A ${recessRadius} ${recessRadius} 0 0 0 ${arcRightX} 0 L ${screenWidth} 0 L ${screenWidth} ${tabBarHeight} Z')`
              }}
            />
            
            {/* Tab bar content */}
            <div 
              className="container mx-auto px-4 flex items-center justify-between max-w-4xl relative z-10" 
              style={{ 
                height: `${tabBarHeight}px`, 
                position: 'absolute', 
                bottom: 0, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '100%' 
              }}
            >
              {/* Left: Home button + start label */}
              <div className="flex items-center gap-2 flex-1 justify-end" style={{ marginRight: 'calc(-20px + 20%)' }}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => router.push("/")}
                >
                  <Home className="w-10 h-10" />
                </Button>
                {leftLabel && (
                  <div className="text-xs text-muted-foreground font-medium">
                    {leftLabel}
                  </div>
                )}
              </div>
              
              {/* Center: "Create" text */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground z-20" 
                style={{ 
                  bottom: `${tabBarHeight / 2 - 8}px`, 
                  transform: 'translate(-50%, 50%)' 
                }}
              >
                Create
              </div>
              
              {/* Spacer for dial */}
              <div style={{ width: `${recessSize}px`, flexShrink: 0 }} />
              
              {/* Right: End label + Share button */}
              <div className="flex items-center gap-2 flex-1" style={{ marginLeft: 'calc(-20px + 20%)' }}>
                {rightLabel && (
                  <div className="text-xs text-muted-foreground font-medium">
                    {rightLabel}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => {/* Share logic */}}
                >
                  <Share2 className="w-10 h-10" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Floating Dial Widget */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-card backdrop-blur supports-[backdrop-filter]:bg-card/95 border-2 border-border/80 shadow-lg flex items-center justify-center relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            style={{ 
              width: `${dialSize}px`, 
              height: `${dialSize}px`,
              bottom: `30px`,
              minWidth: `${dialSize}px`,
              minHeight: `${dialSize}px`,
              zIndex: 50
            }}
            onClick={handleDialClick}
          >
            {/* Arc SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${dialSize} ${dialSize}`}>
              {/* Background arc */}
              <path
                d={arcPath}
                fill="none"
                stroke="hsl(var(--muted-foreground) / 0.2)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Active arc */}
              <path
                d={arcPath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={totalArcLength}
                strokeDashoffset={totalArcLength - currentArcLength}
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))'
                }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-2">
              {hasTimeline ? (
                selectedDate?.type === 'numbered' ? (
                  <div className="text-sm font-bold text-foreground text-center leading-tight">
                    {selectedDate.value}
                  </div>
                ) : selectedDate?.type === 'dated' ? (
                  <>
                    <div className="flex flex-col items-center justify-center leading-tight" style={{ height: '48px' }}>
                      <div className="text-[13px] font-bold text-foreground" style={{ height: '16px', lineHeight: '16px' }}>
                        {selectedDate.day || ''}
                      </div>
                      <div className="text-[11px] font-medium text-foreground/80" style={{ height: '14px', lineHeight: '14px' }}>
                        {selectedDate.month || ''}
                      </div>
                      <div className="text-[13px] font-bold text-foreground" style={{ height: '16px', lineHeight: '16px' }}>
                        {selectedDate.year}
                      </div>
                    </div>
                  </>
                ) : null
              ) : (
                <Plus className="w-8 h-8 text-foreground" strokeWidth={3} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Menu Dialog */}
      <Dialog open={showCreateMenu} onOpenChange={setShowCreateMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Timeline</DialogTitle>
            <DialogDescription>
              Choose how you'd like to create your timeline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                router.push("/editor");
                setShowCreateMenu(false);
              }}
            >
              <FileText className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Create Timeline</div>
                <div className="text-xs text-muted-foreground">
                  Build a custom timeline from scratch
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                router.push("/social");
                setShowCreateMenu(false);
              }}
            >
              <Sparkles className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Create Social Timeline</div>
                <div className="text-xs text-muted-foreground">
                  Use templates for social media content
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

### Styling Details

**Dial Widget**:
- **Border Radius**: 50% (perfect circle)
- **Background**: Card color with backdrop blur
- **Border**: 2px solid, 80% opacity
- **Shadow**: Large shadow for elevation
- **Hover**: 90% opacity transition
- **Cursor**: Pointer

**Arc**:
- **Stroke Width**: 4px
- **Line Cap**: Round
- **Background Color**: Muted foreground at 20% opacity
- **Active Color**: Primary color with glow effect
- **Animation**: Smooth transition (1.2s cubic-bezier)

**Tab Bar**:
- **Height**: 40px
- **Background**: Card color at 95% opacity
- **Recess**: Circular cutout matching dial size + 20px gap
- **Accent Border**: Orange (#FF6B35) along top edge

### Create Menu Dialog

When the dial is clicked (and no timeline is active), a dialog appears with two options:

1. **Create Timeline** → Navigates to `/editor`
   - Icon: FileText
   - Title: "Create Timeline"
   - Description: "Build a custom timeline from scratch"

2. **Create Social Timeline** → Navigates to `/social`
   - Icon: Sparkles
   - Title: "Create Social Timeline"
   - Description: "Use templates for social media content"

**Dialog Styling**:
- **Max Width**: Medium (sm:max-w-md)
- **Button Height**: Auto with padding (h-auto py-4)
- **Button Layout**: Full width, left-aligned content
- **Icon Size**: 5x5 (h-5 w-5)
- **Spacing**: 3 units between buttons

### Responsive Behavior

- **Dial Size**: Scales with viewport (20% of width, clamped 80-120px)
- **Tab Bar**: Fixed 40px height
- **Recess**: Automatically calculated based on dial size
- **Labels**: Hide on very small screens if needed

### Keyboard Detection

The dial widget hides when the mobile keyboard is visible to prevent UI obstruction:

```typescript
const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

// Detection logic using visual viewport API
useEffect(() => {
  if (window.visualViewport) {
    const handleResize = () => {
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const isKeyboardOpen = windowHeight - viewportHeight > 150;
      setIsKeyboardVisible(isKeyboardOpen);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }
}, []);
```

---

## 3. Tab Bar Implementation (Simple Version)

### Location
`components/layout/BottomMenuBar.tsx`

### Component Structure

```typescript
"use client";

import { Share2, Layers, Home, Plus, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface BottomMenuBarProps {
  viewMode?: "vertical" | "hybrid";
  onViewModeChange?: (mode: "vertical" | "hybrid") => void;
}

export const BottomMenuBar = ({ viewMode, onViewModeChange }: BottomMenuBarProps) => {
  // Component implementation
};
```

### Layout Structure
- **Container**: Fixed bottom (`fixed bottom-0 left-0 right-0`)
- **Z-index**: 40 (`z-40`)
- **Background**: Background color at 95% opacity with backdrop blur (`bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`)
- **Height**: 44px (`style={{ height: '44px' }}`)

### Content Container
- **Layout**: Container with max width (`container mx-auto px-3 h-full flex items-center justify-center max-w-4xl`)
- **Inner Container**: Flex items evenly spaced (`flex items-center justify-evenly flex-1 max-w-md`)

### Tab Buttons
All buttons use:
- **Variant**: Ghost (`variant="ghost"`)
- **Size**: Icon (`size="icon"`)
- **Dimensions**: 8x8 (`h-8 w-8`)
- **Icon Size**: 18x18 (`w-[18px] h-[18px]`)

**Tabs** (in order):
1. **Home** (`/`)
   - Icon: `<Home />`
   - Action: `router.push("/")`

2. **Portfolio** (`/portfolio`)
   - Icon: `<Folder />`
   - Action: `router.push("/portfolio")`

3. **Create** (`/editor`)
   - Icon: `<Plus />`
   - Action: `router.push("/editor")`

4. **View Mode Toggle** (conditional - only if `viewMode` and `onViewModeChange` are provided)
   - Icon: `<Layers />`
   - Action: Toggles between "vertical" and "hybrid" view modes

5. **Share**
   - Icon: `<Share2 />`
   - Action: 
     - Uses native `navigator.share()` if available
     - Falls back to clipboard copy
     - Shows toast notification

### Share Functionality
```typescript
const handleShare = async () => {
  const url = window.location.href;
  const title = document.title || "Timeline";
  
  try {
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: `Check out this timeline: ${title}`,
        url: url,
      });
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Timeline link copied to clipboard",
      });
    }
  } catch (error: any) {
    // Error handling with clipboard fallback
  }
};
```

### Usage Example
```typescript
// Basic usage
<BottomMenuBar />

// With view mode toggle
<BottomMenuBar 
  viewMode={viewMode} 
  onViewModeChange={setViewMode} 
/>
```

### Styling Details
- **Background**: Semi-transparent with backdrop blur for glassmorphism effect
- **Icons**: All icons are 18x18px for consistency
- **Spacing**: Evenly distributed across available width
- **Hover**: Ghost variant provides subtle hover effect
- **Responsive**: Works on all screen sizes

---

## 3. Create Button Branching (Proposed Implementation)

### Current State
The "Create" button in the tab bar currently navigates directly to `/editor`.

### Proposed Enhancement
When clicking the "Create" button, show a dialog/menu with two options:

1. **Create Timeline** → Navigate to `/editor`
2. **Create Social Timeline** → Navigate to `/social`

### Implementation Options

#### Option A: Dialog Menu
```typescript
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, FileText } from "lucide-react";

const [showCreateMenu, setShowCreateMenu] = useState(false);

<Dialog open={showCreateMenu} onOpenChange={setShowCreateMenu}>
  <DialogTrigger asChild>
    <Button 
      variant="ghost" 
      size="icon"
      className="h-8 w-8"
      onClick={() => setShowCreateMenu(true)}
    >
      <Plus className="w-[18px] h-[18px]" />
    </Button>
  </DialogTrigger>
  <DialogContent>
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => {
          router.push("/editor");
          setShowCreateMenu(false);
        }}
      >
        <FileText className="mr-2 h-4 w-4" />
        Create Timeline
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => {
          router.push("/social");
          setShowCreateMenu(false);
        }}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Create Social Timeline
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

#### Option B: Dropdown Menu
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button 
      variant="ghost" 
      size="icon"
      className="h-8 w-8"
    >
      <Plus className="w-[18px] h-[18px]" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => router.push("/editor")}>
      <FileText className="mr-2 h-4 w-4" />
      Create Timeline
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push("/social")}>
      <Sparkles className="mr-2 h-4 w-4" />
      Create Social Timeline
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Option C: Bottom Sheet (Mobile-friendly)
```typescript
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild>
    <Button 
      variant="ghost" 
      size="icon"
      className="h-8 w-8"
    >
      <Plus className="w-[18px] h-[18px]" />
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom">
    <div className="space-y-3 py-4">
      <Button
        variant="outline"
        className="w-full justify-start h-12"
        onClick={() => {
          router.push("/editor");
        }}
      >
        <FileText className="mr-3 h-5 w-5" />
        <div className="text-left">
          <div className="font-semibold">Create Timeline</div>
          <div className="text-xs text-muted-foreground">Build a custom timeline from scratch</div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start h-12"
        onClick={() => {
          router.push("/social");
        }}
      >
        <Sparkles className="mr-3 h-5 w-5" />
        <div className="text-left">
          <div className="font-semibold">Create Social Timeline</div>
          <div className="text-xs text-muted-foreground">Use templates for social media content</div>
        </div>
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

### Recommended Approach
**Option B (Dropdown Menu)** is recommended because:
- Clean, native-feeling interaction
- Works well on both desktop and mobile
- Minimal UI disruption
- Easy to extend with more options in the future

---

## 4. Tab Bar Component (Radix UI Tabs)

### Location
`components/ui/tabs.tsx`

### Component Structure

```typescript
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

### Usage Example (Discover Page)

```typescript
<Tabs defaultValue="trending" className="mt-6">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="trending" className="flex items-center gap-2">
      <TrendingUp className="w-4 h-4" />
      Trending
    </TabsTrigger>
    <TabsTrigger value="recent" className="flex items-center gap-2">
      <Clock className="w-4 h-4" />
      Recent
    </TabsTrigger>
  </TabsList>

  <TabsContent value="trending" className="mt-6">
    {/* Trending content */}
  </TabsContent>

  <TabsContent value="recent" className="mt-6">
    {/* Recent content */}
  </TabsContent>
</Tabs>
```

### Styling Details

**TabsList**:
- Height: 10 units (`h-10`)
- Background: Muted (`bg-muted`)
- Padding: 1 unit (`p-1`)
- Rounded: Medium (`rounded-md`)
- Text color: Muted foreground (`text-muted-foreground`)

**TabsTrigger**:
- Padding: Horizontal 3, vertical 1.5 (`px-3 py-1.5`)
- Font: Medium weight, small size (`text-sm font-medium`)
- Rounded: Small (`rounded-sm`)
- **Active State** (`data-[state=active]`):
  - Background: Default background (`bg-background`)
  - Text: Foreground color (`text-foreground`)
  - Shadow: Small (`shadow-sm`)
- **Disabled State**:
  - Pointer events: None
  - Opacity: 50%

**TabsContent**:
- Margin top: 2 units (`mt-2`)
- Focus: Visible ring on focus

### Customization
The component uses `cn()` utility for className merging, allowing easy customization:

```typescript
<TabsList className="grid w-full grid-cols-3">
  {/* Custom grid layout */}
</TabsList>

<TabsTrigger className="w-full">
  {/* Full width trigger */}
</TabsTrigger>
```

---

## 5. Design Specifications Summary

### Timeline Creation Page
- **Max Width**: 5xl (1280px)
- **Padding**: 4 units horizontal, 16 top, 24 bottom
- **Step Indicator**: 10x10 circles, 1px connector lines
- **Card Padding**: 6 units
- **Button Spacing**: 3 units gap

### Tab Bar (BottomMenuBar)
- **Height**: 44px
- **Background**: 95% opacity with backdrop blur
- **Icon Size**: 18x18px
- **Button Size**: 8x8 (32px)
- **Max Width**: 4xl (896px)

### Tab Bar (Tabs Component)
- **List Height**: 10 units (40px)
- **Trigger Padding**: 3 horizontal, 1.5 vertical
- **Font Size**: Small (14px)
- **Active Shadow**: Small

### Color Scheme
- **Primary**: Used for active states, progress indicators
- **Muted**: Used for inactive states, backgrounds
- **Background**: Default app background
- **Foreground**: Default text color
- **Border**: Subtle borders

### Responsive Breakpoints
- **Mobile**: Full width buttons, single column layouts
- **Tablet (sm)**: Auto width buttons, multi-column layouts
- **Desktop**: Max width containers, optimized spacing

