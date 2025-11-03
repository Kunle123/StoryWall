# Guidelines for Handling Famous People in Timelines

## Copyright & Publicity Right Concerns

When creating timelines featuring famous people, there are legal considerations to address:

### Legal Issues

1. **Right of Publicity**: Using someone's likeness without permission can violate their right of publicity, even if the image is AI-generated.

2. **Copyright**: AI models may be trained on copyrighted images of famous people, creating potential copyright issues.

3. **Living People**: Recent court cases suggest stricter protections for living individuals.

4. **Deceased People**: Rights may still apply depending on jurisdiction and estate management.

## Recommended Approach ✅

### Use Stylized/Artistic Representations

**Safe Practices:**
- ✅ **Artistic styles** (Illustration, Sketch, Watercolor, Vintage paintings)
- ✅ **Symbolic representations** (focus on context, settings, objects)
- ✅ **Period-appropriate generic figures** (not specific likenesses)
- ✅ **Historical paintings aesthetic** (mimics public domain works)
- ✅ **Emphasize setting over person** (show the event, not the person)

### Automatic Protection (Implemented)

The system now automatically:

1. **Detects famous people** in prompts (keywords like "king", "president", "Einstein", etc.)
2. **Modifies prompts** to use stylized representations
3. **Switches style** from "Photorealistic" to "Illustration" for famous people
4. **Adds safety instructions** to focus on context rather than likeness

### Example Transformations

**Before (Risky):**
```
"Photorealistic portrait of Abraham Lincoln signing the Emancipation Proclamation"
```

**After (Safe):**
```
"Illustration style historical scene: stylized representation of the Emancipation Proclamation signing. Focus on historical setting, period-appropriate clothing, and symbolic elements rather than specific facial features"
```

## Best Practices for Users

### ✅ DO:
- Use "Illustration", "Sketch", or "Watercolor" styles for famous people
- Focus on events and contexts rather than portraits
- Use symbolic elements (documents, buildings, settings)
- Emphasize period-appropriate details

### ❌ AVOID:
- Photorealistic styles for specific famous people
- Requests for "portrait of [famous person]"
- Focusing on recognizable facial features
- Using images for commercial purposes without permission

## Technical Implementation

The system includes automatic protection in:
- `lib/utils/famousPeopleHandler.ts` - Detection and prompt modification
- `app/api/ai/generate-images/route.ts` - Applies safety transforms
- `app/api/ai/generate-descriptions/route.ts` - Instructs AI to use safe prompts

## Disclaimers

For educational/historical timelines, consider adding:
> "Images are artistic representations and not intended to be direct likenesses of any individual. All images are AI-generated and stylized for educational purposes."

## When to Avoid

If a timeline is primarily about a specific famous person's life:
- Consider using public domain paintings/photos (with proper attribution)
- Or focus on events/contexts rather than the person
- Or obtain proper licensing/permissions

## Fair Use Consideration

Educational timelines may qualify for fair use, but:
- It's not guaranteed
- Varies by jurisdiction
- Commercial use reduces fair use protection
- Stylized representations are safer than direct likenesses

## Recommendations

**For Historical Timelines:**
- Use artistic styles (Illustration, Vintage, Watercolor)
- Focus on events and contexts
- Use symbolic representations
- Emphasize period details over person details

**For Contemporary Figures:**
- Consider avoiding direct representation
- Use symbolic/abstract representations
- Focus on events/achievements rather than portraits
- May require explicit permission for recognizable features

---

**Note:** This is not legal advice. Consult with a lawyer for specific concerns about copyright and publicity rights in your jurisdiction.

