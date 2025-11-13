# Prompts Directory

This directory contains all AI prompts used for timeline generation. You can edit these files directly to modify how the AI generates content.

## Structure

```
prompts/
├── anchor/                    # Anchor style generation (visual consistency)
│   ├── system.txt            # System prompt for anchor generation
│   └── user.txt              # User prompt with template variables
├── descriptions/              # Description and image prompt generation
│   ├── system.txt            # System prompt for descriptions
│   ├── user-prompt.txt        # User prompt template
│   ├── image-prompt-instructions-with-anchor.txt
│   ├── image-prompt-instructions-with-anchor-factual.txt
│   └── image-prompt-instructions-without-anchor.txt
└── README.md                  # This file
```

## Template Variables

Prompts use a simple template syntax:

- `{{variable}}` - Replaces with the variable value
- `{{#if variable}}...{{/if}}` - Conditional block (only shown if variable is truthy)
- `{{#each array}}...{{/each}}` - Loop through array items
- `{{@index}}` - Current index in `{{#each}}` loops

### Available Variables

#### Anchor Prompts (`anchor/user.txt`)
- `{{timelineDescription}}` - The timeline description
- `{{eventTitles}}` - Comma-separated list of event titles
- `{{imageStyle}}` - User's chosen image style (e.g., "Illustration")
- `{{themeColor}}` - User's theme color (optional)

#### Description Prompts (`descriptions/user-prompt.txt`)
- `{{timelineDescription}}` - The timeline description
- `{{sourceRestrictions}}` - Array of source restrictions (if any)
- `{{imageContext}}` - Image style and theme color context
- `{{eventCount}}` - Number of events
- `{{events}}` - Array of event objects with `year` and `title`

## Editing Prompts

1. **Find the prompt file** you want to edit in the structure above
2. **Edit the file directly** - no compilation needed
3. **Save the file** - changes take effect immediately on next API call
4. **Test your changes** by generating a new timeline

## Examples

### Adding a new instruction to Anchor generation

Edit `prompts/anchor/user.txt` and add your instruction. For example:

```
...existing content...

NEW REQUIREMENT: Always include a subtle film grain effect in the visual palette description.
```

### Modifying faceless mannequin specifications

Edit `prompts/descriptions/image-prompt-instructions-with-anchor.txt` and update the "FACELESS MOOD DOUBLE SPECIFICATIONS" section.

### Changing description style instructions

Edit `prompts/descriptions/system.txt` and modify the writing style instructions.

## Notes

- **No restart required**: Changes to prompt files take effect immediately
- **Template syntax**: Use `{{variable}}` for simple replacements, `{{#if}}` for conditionals
- **File encoding**: All files should be UTF-8
- **Line breaks**: Preserve line breaks in prompts as they affect AI output formatting

## Loading Prompts in Code

Prompts are loaded using the utility in `lib/prompts/loader.ts`:

```typescript
import { loadAnchorPrompts, loadDescriptionPrompts } from '@/lib/prompts/loader';

// Load anchor prompts
const anchorPrompts = loadAnchorPrompts({
  timelineDescription: "...",
  eventTitles: "Event 1, Event 2",
  imageStyle: "Illustration",
  themeColor: "#DC2626"
});

// Load description prompts
const descriptionPrompts = loadDescriptionPrompts({
  timelineDescription: "...",
  events: [...],
  writingStyle: "narrative",
  // ... other variables
});
```

