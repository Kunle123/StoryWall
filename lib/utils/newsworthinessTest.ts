/**
 * Newsworthiness Test for Celebrity Likeness Usage
 * 
 * Tests whether a timeline project can legally use celebrity likenesses
 * based on Fair Use and Right of Publicity principles.
 */

import { getAIClient, createChatCompletion } from '@/lib/ai/client';
import { loadPrompt } from '@/lib/prompts/loader';

export interface NewsworthinessTestResult {
  canUseLikeness: boolean;
  riskLevel: 'Low' | 'Medium' | 'High';
  justification: string;
  recommendation: string;
  inferredAttributes?: {
    subjects: string[];
    format: string;
    useOfLikeness: string;
    useOfCopyrightedMaterial: string;
    framing: string;
  };
}

/**
 * Heuristic pre-filter for newsworthiness (fast, no API call)
 * Returns null if ambiguous (needs full test), otherwise returns quick result
 */
function quickNewsworthinessCheck(
  timelineTitle: string,
  timelineDescription: string
): NewsworthinessTestResult | null {
  const titleLower = timelineTitle.toLowerCase();
  const descLower = timelineDescription.toLowerCase();
  const combined = `${titleLower} ${descLower}`;
  
  // Clear newsworthy indicators (political, death, major events)
  const newsworthyKeywords = [
    'election', 'president', 'governor', 'mayor', 'senator', 'congress', 'parliament',
    'death', 'dies', 'passed away', 'obituary', 'memorial',
    'scandal', 'trial', 'court', 'lawsuit', 'arrest', 'charged',
    'award', 'oscar', 'nobel', 'grammy', 'emmy',
    'marriage', 'divorce', 'announcement', 'public statement',
    'war', 'conflict', 'crisis', 'disaster', 'emergency',
  ];
  
  // Clear non-newsworthy indicators (entertainment, films, general biography)
  const nonNewsworthyKeywords = [
    'film', 'movie', 'actor', 'actress', 'celebrity', 'star',
    'biography', 'life story', 'career', 'filmography',
    'timeline of', 'story of', 'history of',
  ];
  
  const hasNewsworthy = newsworthyKeywords.some(kw => combined.includes(kw));
  const hasNonNewsworthy = nonNewsworthyKeywords.some(kw => combined.includes(kw));
  
  // If clearly newsworthy, return early
  if (hasNewsworthy && !hasNonNewsworthy) {
    return {
      canUseLikeness: true,
      riskLevel: 'Low',
      justification: 'Timeline contains clear newsworthy events (election, death, major public events)',
      recommendation: 'Likeness usage is appropriate for newsworthy content',
    };
  }
  
  // If clearly non-newsworthy entertainment, return early
  if (hasNonNewsworthy && !hasNewsworthy && 
      (titleLower.includes('film') || titleLower.includes('movie') || 
       descLower.includes('film') || descLower.includes('movie'))) {
    return {
      canUseLikeness: false,
      riskLevel: 'High',
      justification: 'Timeline is about entertainment/films without clear newsworthy angle',
      recommendation: 'Use mood-based, faceless representations instead of celebrity likenesses',
    };
  }
  
  // Ambiguous - needs full test
  return null;
}

/**
 * Test if a timeline project can use celebrity likenesses
 * Returns true if newsworthy/transformative use, false otherwise
 * 
 * Optimized: Uses heuristic pre-filter to avoid expensive API call when possible
 */
export async function testNewsworthiness(
  timelineTitle: string,
  timelineDescription: string
): Promise<NewsworthinessTestResult> {
  try {
    // Quick heuristic check first (no API call)
    const quickResult = quickNewsworthinessCheck(timelineTitle, timelineDescription);
    if (quickResult) {
      console.log('[NewsworthinessTest] Quick heuristic result:', quickResult.riskLevel);
      return quickResult;
    }
    
    // Ambiguous case - need full AI test
    console.log('[NewsworthinessTest] Ambiguous case, running full AI test');
    const client = getAIClient();
    
    // Load newsworthiness test prompts
    const systemPrompt = loadPrompt('newsworthiness-test/system.txt');
    const userPrompt = loadPrompt('newsworthiness-test/user.txt', {
      timelineTitle,
      timelineDescription,
    });
    
    console.log('[NewsworthinessTest] Testing timeline:', timelineTitle);
    
    const response = await createChatCompletion(client, {
      model: 'gpt-4o', // Use GPT-4o for legal analysis
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent legal analysis
      max_tokens: 1000,
    });
    
    if (!response.choices?.[0]?.message?.content) {
      console.warn('[NewsworthinessTest] No response from AI, defaulting to safe mode');
      return {
        canUseLikeness: false,
        riskLevel: 'High',
        justification: 'AI test failed, defaulting to safe mode',
        recommendation: 'Use mood-based, faceless representations instead of celebrity likenesses',
      };
    }
    
    try {
      const result = JSON.parse(response.choices[0].message.content);
      
      const testResult: NewsworthinessTestResult = {
        canUseLikeness: result.overallRiskAssessment?.canUseLikeness === true,
        riskLevel: result.overallRiskAssessment?.riskLevel || 'High',
        justification: result.rightOfPublicityAnalysis?.justification || 'Analysis completed',
        recommendation: result.overallRiskAssessment?.recommendation || 'Use caution with celebrity likenesses',
        inferredAttributes: result.inferredAttributes,
      };
      
      console.log('[NewsworthinessTest] Result:', {
        canUseLikeness: testResult.canUseLikeness,
        riskLevel: testResult.riskLevel,
        title: timelineTitle,
      });
      
      return testResult;
    } catch (parseError: any) {
      console.error('[NewsworthinessTest] Failed to parse JSON response:', parseError.message);
      console.error('[NewsworthinessTest] Raw response:', response.choices[0].message.content.substring(0, 500));
      
      // Default to safe mode if parsing fails
      return {
        canUseLikeness: false,
        riskLevel: 'High',
        justification: 'Failed to parse legal analysis, defaulting to safe mode',
        recommendation: 'Use mood-based, faceless representations instead of celebrity likenesses',
      };
    }
  } catch (error: any) {
    console.error('[NewsworthinessTest] Error performing test:', error.message);
    
    // Default to safe mode on error
    return {
      canUseLikeness: false,
      riskLevel: 'High',
      justification: `Test failed: ${error.message}`,
      recommendation: 'Use mood-based, faceless representations instead of celebrity likenesses',
    };
  }
}

