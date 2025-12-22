/**
 * Prompt Storage System
 * Allows storing and retrieving custom prompts for iterative improvement
 */

interface StoredPrompt {
  id: string;
  step: 'events' | 'descriptions' | 'images';
  systemPrompt?: string;
  userPrompt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    description?: string;
    testResults?: any;
    improvements?: string[];
  };
}

// In-memory storage (can be replaced with database later)
const promptStorage = new Map<string, StoredPrompt>();

export function savePrompt(
  step: 'events' | 'descriptions' | 'images',
  systemPrompt?: string,
  userPrompt?: string,
  metadata?: StoredPrompt['metadata']
): string {
  const id = `${step}-${Date.now()}`;
  const prompt: StoredPrompt = {
    id,
    step,
    systemPrompt,
    userPrompt,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };
  
  promptStorage.set(id, prompt);
  return id;
}

export function getPrompt(id: string): StoredPrompt | null {
  return promptStorage.get(id) || null;
}

export function getLatestPrompt(step: 'events' | 'descriptions' | 'images'): StoredPrompt | null {
  const prompts = Array.from(promptStorage.values())
    .filter(p => p.step === step)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  return prompts[0] || null;
}

export function updatePrompt(
  id: string,
  systemPrompt?: string,
  userPrompt?: string,
  metadata?: Partial<StoredPrompt['metadata']>
): StoredPrompt | null {
  const existing = promptStorage.get(id);
  if (!existing) return null;
  
  const updated: StoredPrompt = {
    ...existing,
    systemPrompt: systemPrompt !== undefined ? systemPrompt : existing.systemPrompt,
    userPrompt: userPrompt !== undefined ? userPrompt : existing.userPrompt,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
    metadata: {
      ...existing.metadata,
      ...metadata,
    },
  };
  
  promptStorage.set(id, updated);
  return updated;
}

export function getAllPrompts(step?: 'events' | 'descriptions' | 'images'): StoredPrompt[] {
  const prompts = Array.from(promptStorage.values());
  if (step) {
    return prompts.filter(p => p.step === step);
  }
  return prompts;
}

export function deletePrompt(id: string): boolean {
  return promptStorage.delete(id);
}

