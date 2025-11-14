# Source Types Feature

## Overview

The Source Restrictions feature now supports multiple source types including social media platforms, websites, and custom sources. Users can add sources with automatic validation and formatting.

## Supported Source Types

### 1. **Website URL**
- **Format**: `example.com` or `https://example.com`
- **Example**: `https://www.bbc.com/news`
- **Validation**: Must be a valid URL format

### 2. **Twitter/X**
- **Format**: `@username` or `twitter.com/username` or `x.com/username`
- **Example**: `@elonmusk` or `https://twitter.com/elonmusk`
- **Validation**: Validates Twitter handle (1-15 characters, alphanumeric + underscore)
- **Formatted Output**: `Twitter: @username (https://twitter.com/username)`

### 3. **Instagram**
- **Format**: `@username` or `instagram.com/username`
- **Example**: `@instagram` or `https://instagram.com/instagram`
- **Validation**: Validates Instagram handle (1-30 characters, alphanumeric + dots + underscores)
- **Formatted Output**: `Instagram: @username (https://instagram.com/username)`

### 4. **TikTok**
- **Format**: `@username` or `tiktok.com/@username`
- **Example**: `@tiktok` or `https://tiktok.com/@tiktok`
- **Validation**: Validates TikTok handle (1-24 characters, alphanumeric + dots + underscores)
- **Formatted Output**: `TikTok: @username (https://tiktok.com/@username)`

### 5. **Facebook**
- **Format**: `facebook.com/pagename` or `fb.com/pagename` or page name
- **Example**: `facebook.com/facebook` or `Facebook Page`
- **Validation**: Validates Facebook URL or accepts page name
- **Formatted Output**: `Facebook: pagename (https://facebook.com/pagename)`

### 6. **LinkedIn**
- **Format**: `linkedin.com/in/username` or `linkedin.com/company/name` or identifier
- **Example**: `linkedin.com/in/username` or `linkedin.com/company/example`
- **Validation**: Validates LinkedIn profile or company URL
- **Formatted Output**: `LinkedIn Profile: username (https://linkedin.com/in/username)`

### 7. **YouTube**
- **Format**: `youtube.com/channel/ID` or `youtube.com/@channel` or channel name
- **Example**: `youtube.com/@channel` or `youtube.com/channel/UC...`
- **Validation**: Validates YouTube URL or accepts channel name
- **Formatted Output**: `YouTube: channel (https://youtube.com/channel)`

### 8. **Custom Source**
- **Format**: Any text description
- **Example**: `The writings of Noam Chomsky`, `Official publications from the NHS`
- **Validation**: Just checks that it's not empty
- **Formatted Output**: Uses input as-is

## How It Works

### User Experience

1. **Select Source Type**: User selects a source type from the dropdown
2. **Enter Source**: User enters the source (handle, URL, or text)
3. **Auto-Detection**: If user pastes a URL or handle, the system auto-detects the type
4. **Validation**: System validates the input format
5. **Formatting**: Valid sources are formatted consistently
6. **Display**: Sources are displayed as badges with platform icons

### Validation Logic

Each source type has its own validation function that:
- Checks format (URLs, handles, etc.)
- Normalizes input (adds https://, formats handles, etc.)
- Returns formatted string for AI prompts
- Provides error messages for invalid input

### Auto-Detection

The system automatically detects source type when user pastes:
- URLs → Detects platform from domain
- Handles starting with `@` → Detects platform from context
- Other text → Defaults to "Custom Source"

### Formatting for AI

Sources are formatted consistently for AI prompts:
- Social media: `Platform: @handle (URL)`
- URLs: `URL: https://example.com`
- Custom: Uses input as-is

This ensures the AI understands the source type and can reference it appropriately.

## Implementation Details

### Files Modified

1. **`lib/utils/sourceValidation.ts`** (NEW)
   - Validation functions for each source type
   - Auto-detection logic
   - Source type configurations

2. **`components/timeline-editor/TimelineInfoStep.tsx`**
   - Added source type dropdown
   - Integrated validation
   - Added icons for visual clarity
   - Improved error handling

### Usage in AI Prompts

Sources are passed to AI generation prompts as:
```
SOURCE RESTRICTIONS - CRITICAL: You MUST source all information, descriptions, and titles SOLELY from the following specific resources:
  1. Twitter: @username (https://twitter.com/username)
  2. Instagram: @username (https://instagram.com/username)
  3. URL: https://example.com
```

## Future Enhancements

Potential improvements:
- **RSS Feed Support**: Add RSS feed URLs
- **API Integration**: Fetch recent posts from social media APIs
- **Source Verification**: Verify that sources exist/are accessible
- **Source Preview**: Show preview of source content
- **Batch Import**: Import multiple sources from a list

## Testing

To test the feature:
1. Go to timeline creation Step 1
2. Scroll to "Source Restrictions"
3. Try different source types:
   - Paste a Twitter URL → Should auto-detect and validate
   - Select Instagram → Enter handle → Should format correctly
   - Try invalid formats → Should show error messages
4. Add multiple sources → Should display with icons
5. Remove sources → Should work correctly

