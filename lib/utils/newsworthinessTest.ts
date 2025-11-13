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
 * Test if a timeline project can use celebrity likenesses
 * Returns true if newsworthy/transformative use, false otherwise
 */
export async function testNewsworthiness(
  timelineTitle: string,
  timelineDescription: string
): Promise<NewsworthinessTestResult> {
  try {
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

