/**
 * Debug Logger for Timeline Creation Process
 * Captures all prompts, AI responses, and user inputs for analysis
 */

interface DebugLogEntry {
  timestamp: string;
  step: string;
  type: 'user_input' | 'prompt' | 'ai_response' | 'system_info';
  data: any;
}

class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private timelineId?: string;
  private timelineName?: string;
  private timelineDescription?: string;

  /**
   * Initialize logger with timeline info
   */
  init(timelineName?: string, timelineDescription?: string, timelineId?: string) {
    this.timelineId = timelineId;
    this.timelineName = timelineName;
    this.timelineDescription = timelineDescription;
    this.logs = [];
    
    if (timelineName || timelineDescription) {
      this.log('user_input', 'Timeline Input', {
        timelineName,
        timelineDescription,
        timelineId,
      });
    }
  }

  /**
   * Log user input
   */
  logUserInput(step: string, data: any) {
    this.log('user_input', step, data);
  }

  /**
   * Log prompt sent to AI
   */
  logPrompt(step: string, systemPrompt: string, userPrompt: string, metadata?: any) {
    this.log('prompt', step, {
      systemPrompt,
      userPrompt,
      metadata: metadata || {},
    });
  }

  /**
   * Log AI response
   */
  logAIResponse(step: string, response: any, metadata?: any) {
    this.log('ai_response', step, {
      response,
      metadata: metadata || {},
    });
  }

  /**
   * Log system information
   */
  logSystemInfo(step: string, info: any) {
    this.log('system_info', step, info);
  }

  /**
   * Internal log method
   */
  private log(type: DebugLogEntry['type'], step: string, data: any) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      step,
      type,
      data,
    });
  }

  /**
   * Get all logs as formatted text
   */
  getFormattedLog(): string {
    const sections: string[] = [];
    
    sections.push('='.repeat(80));
    sections.push('TIMELINE CREATION DEBUG LOG');
    sections.push('='.repeat(80));
    sections.push('');
    
    if (this.timelineName) {
      sections.push(`Timeline Name: ${this.timelineName}`);
    }
    if (this.timelineDescription) {
      sections.push(`Timeline Description: ${this.timelineDescription}`);
    }
    if (this.timelineId) {
      sections.push(`Timeline ID: ${this.timelineId}`);
    }
    sections.push('');
    
    let currentStep = '';
    for (const entry of this.logs) {
      if (entry.step !== currentStep) {
        if (currentStep) sections.push('');
        sections.push('-'.repeat(80));
        sections.push(`STEP: ${entry.step.toUpperCase()}`);
        sections.push('-'.repeat(80));
        currentStep = entry.step;
      }
      
      sections.push(`[${entry.timestamp}] ${entry.type.toUpperCase()}`);
      sections.push('');
      
      if (entry.type === 'prompt') {
        sections.push('SYSTEM PROMPT:');
        sections.push(entry.data.systemPrompt);
        sections.push('');
        sections.push('USER PROMPT:');
        sections.push(entry.data.userPrompt);
        if (entry.data.metadata && Object.keys(entry.data.metadata).length > 0) {
          sections.push('');
          sections.push('METADATA:');
          sections.push(JSON.stringify(entry.data.metadata, null, 2));
        }
      } else if (entry.type === 'ai_response') {
        sections.push('AI RESPONSE:');
        if (typeof entry.data.response === 'string') {
          sections.push(entry.data.response);
        } else {
          sections.push(JSON.stringify(entry.data.response, null, 2));
        }
        if (entry.data.metadata && Object.keys(entry.data.metadata).length > 0) {
          sections.push('');
          sections.push('METADATA:');
          sections.push(JSON.stringify(entry.data.metadata, null, 2));
        }
      } else if (entry.type === 'user_input') {
        sections.push('USER INPUT:');
        sections.push(JSON.stringify(entry.data, null, 2));
      } else if (entry.type === 'system_info') {
        sections.push('SYSTEM INFO:');
        sections.push(JSON.stringify(entry.data, null, 2));
      }
      
      sections.push('');
    }
    
    sections.push('='.repeat(80));
    sections.push('END OF DEBUG LOG');
    sections.push('='.repeat(80));
    
    return sections.join('\n');
  }

  /**
   * Get logs as JSON
   */
  getJSONLog(): string {
    return JSON.stringify({
      timelineName: this.timelineName,
      timelineDescription: this.timelineDescription,
      timelineId: this.timelineId,
      logs: this.logs,
    }, null, 2);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get logs array
   */
  getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }
}

// Singleton instance
let debugLogger: DebugLogger | null = null;

export function getDebugLogger(): DebugLogger {
  if (!debugLogger) {
    debugLogger = new DebugLogger();
  }
  return debugLogger;
}

export function resetDebugLogger() {
  debugLogger = new DebugLogger();
  return debugLogger;
}

