# Tab Bar Calculation Check

## Given Values
- `dialSize` (diameter) = 80-120px (let's use 100px for example)
- `dialRadius` = dialSize / 2 = 50px
- Gap across diameter = 20px
- `recessSize` = dialSize + 20 = 120px
- `recessRadius` = recessSize / 2 = 60px = dialRadius + 10px
- Tab bar height = 40px

## User Requirements
1. "30PX + dial radius which should equal 20px + recess radius"
   - 30 + dialRadius = 30 + 50 = 80
   - 20 + recessRadius = 20 + 60 = 80 ✓

2. "the absolute lowest point of the dial should be 30px above the lowest point of the tab bar"
   - Lowest point of tab bar = 0px (bottom of viewport)
   - Lowest point of dial should be at = 30px from bottom

## Current Code Calculations

### Center Position
```typescript
const centerYFromBottom = 30 + dialRadius; // 30 + 50 = 80px from bottom
```

### Dial Positioning
```typescript
bottom: `${30}px` // Bottom of dial DIV at 30px from bottom
```

**PROBLEM**: If dial DIV bottom is at 30px, and DIV is dialSize (100px) tall:
- DIV extends from 30px to 130px from bottom
- Center of DIV is at 30 + dialSize/2 = 30 + 50 = 80px ✓
- Lowest point of circle inside DIV = center - radius = 80 - 50 = 30px ✓

This seems correct!

### SVG Coordinate System
SVG: y=0 at top of tab bar, y=40 at bottom of tab bar
Viewport: bottom of tab bar at 0px, top of tab bar at 40px

Center is 80px from bottom of viewport = 40px above top of tab bar

In SVG coordinates:
```typescript
centerYInSVG = tabBarHeight - centerYFromBottom
             = 40 - 80
             = -40 (center is 40px above the SVG viewport)
```

### Recess Arc Intersection
Circle center: (screenCenterX, -40) in SVG coords
Circle radius: 60px
Tab bar top edge: y=0

At y=0: (x - cx)² + (0 - (-40))² = 60²
       (x - cx)² + 1600 = 3600
       (x - cx)² = 2000
       x - cx = ±44.7

The arc should appear at the top edge of the tab bar, extending ±44.7px horizontally.

## Potential Issue
With dialRadius = 50 and center at 80px from bottom:
- Center is 40px ABOVE the 40px tab bar
- Most of the recess circle is above the visible tab bar
- Only a small arc at the bottom of the circle intersects the tab bar top edge

Is this the intended design? Or should the center be WITHIN the tab bar?

