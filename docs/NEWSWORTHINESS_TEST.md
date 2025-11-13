# Newsworthiness Test for Celebrity Likeness Usage

## Overview

The system now includes an automated **newsworthiness test** that determines whether a timeline project can legally use celebrity likenesses based on Fair Use and Right of Publicity principles.

## How It Works

### 1. Test Execution

When generating descriptions for a timeline, the system:

1. **Receives timeline title and description** from the user
2. **Runs newsworthiness test** using AI legal analysis
3. **Determines if celebrity likenesses can be used** based on:
   - Right of Publicity analysis (newsworthiness exception)
   - Transformative use test
   - Copyright Fair Use analysis (four factors)
4. **Passes result to prompt generation** to conditionally allow/restrict celebrity likenesses

### 2. Test Criteria

The test evaluates:

- **Newsworthiness**: Is the project about a matter of public interest?
  - Political events (elections, resignations)
  - Major life events (deaths, marriages)
  - Public interest stories
  - Career milestones

- **Transformative Use**: Does the project add new meaning or commentary?
  - Critical reviews
  - Biographical summaries
  - News reporting
  - Social commentary

- **Commercial vs. Informational**: Is the primary purpose commercial or informational?

### 3. Test Result

The test returns:
- `canUseLikeness: true/false` - Whether celebrity likenesses can be used
- `riskLevel: Low/Medium/High` - Legal risk assessment
- `justification` - Explanation of the decision
- `recommendation` - Suggestions to minimize risk

## Integration Points

### API Route: `/api/ai/generate-descriptions`

**Location**: `app/api/ai/generate-descriptions/route.ts`

**Flow**:
```
1. Receive timelineTitle + timelineDescription
2. Call testNewsworthiness(timelineTitle, timelineDescription)
3. Get canUseCelebrityLikeness result
4. Pass to loadDescriptionPrompts({ canUseCelebrityLikeness })
5. Prompts conditionally allow/restrict celebrity likenesses
```

### Prompt Files Modified

1. **`prompts/descriptions/system.txt`**
   - Added conditional block based on `canUseCelebrityLikeness`
   - If `true`: Allows celebrity likenesses for newsworthy content
   - If `false`: Requires faceless mood doubles

2. **`prompts/descriptions/image-prompt-instructions-with-anchor.txt`**
   - Conditional character representation instructions
   - If `true`: May use celebrity likenesses
   - If `false`: Must use faceless mood doubles

3. **`prompts/descriptions/image-prompt-instructions-without-anchor.txt`**
   - Same conditional logic for non-anchor timelines

### New Files Created

1. **`prompts/newsworthiness-test/system.txt`**
   - Legal analysis system prompt
   - Defines Right of Publicity and Fair Use framework
   - Instructions for JSON output

2. **`prompts/newsworthiness-test/user.txt`**
   - User prompt template
   - Variables: `{{timelineTitle}}`, `{{timelineDescription}}`

3. **`lib/utils/newsworthinessTest.ts`**
   - `testNewsworthiness()` function
   - Calls AI with legal analysis prompts
   - Returns structured result

## Examples

### Example 1: Newsworthy (Can Use Likeness)

**Input**:
- Title: "The Election of Governor Cuomo"
- Description: "A timeline of the events and activities which led to the election of Governor Cuomo"

**Test Result**:
- `canUseLikeness: true`
- `riskLevel: Low`
- **Reason**: Political event, clearly newsworthy, informational purpose

**Prompt Behavior**: Allows celebrity likenesses in image prompts

### Example 2: Non-Newsworthy (Cannot Use Likeness)

**Input**:
- Title: "Die Hard: A Visual Review"
- Description: "A timeline of key moments from the film Die Hard"

**Test Result**:
- `canUseLikeness: false`
- `riskLevel: High`
- **Reason**: Entertainment content, commercial purpose, not newsworthy

**Prompt Behavior**: Requires faceless mood doubles, no celebrity likenesses

### Example 3: Death of Celebrity (Can Use Likeness)

**Input**:
- Title: "The Life and Legacy of [Celebrity Name]"
- Description: "A timeline covering their career and final days"

**Test Result**:
- `canUseLikeness: true`
- `riskLevel: Low`
- **Reason**: Death of public figure is newsworthy, biographical/obituary format

**Prompt Behavior**: Allows celebrity likenesses for newsworthy content

## Default Behavior

- **If test fails or title not provided**: Defaults to `canUseLikeness: false` (safe mode)
- **If test returns High risk**: `canUseLikeness: false` (even if newsworthy)
- **If test returns Low/Medium risk + newsworthy**: `canUseLikeness: true`

## Legal Framework

The test applies:

1. **Right of Publicity**:
   - Newsworthiness exception
   - Transformative use test
   - Commercial vs. informational use

2. **Copyright Fair Use** (Four Factors):
   - Purpose and character (transformative, commentary)
   - Nature of original work
   - Amount and substantiality used
   - Market effect

3. **First Amendment Protection**:
   - News reporting
   - Commentary and criticism
   - Public interest stories

## Editing the Test

The newsworthiness test prompts are in:
- `prompts/newsworthiness-test/system.txt` - Legal framework and instructions
- `prompts/newsworthiness-test/user.txt` - User input template

You can edit these directly to refine the legal analysis criteria.

## Related Documentation

- [Prompt Flow & Usage](PROMPT_FLOW.md) - Complete prompt flow guide
- [Timeline Creation Flow](TIMELINE_CREATION_FLOW.md) - User flow guide
- [Famous People Guidelines](reference/FAMOUS_PEOPLE_GUIDELINES.md) - Safety practices

