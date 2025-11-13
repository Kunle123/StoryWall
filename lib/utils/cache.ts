import crypto from 'crypto';

/**
 * Simple in-memory cache for API responses
 * TODO: Replace with Redis/KV store for production
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Generate a content hash for caching
 */
export function hashContent(content: Record<string, any>): string {
  const str = JSON.stringify(content);
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Get cached value if available and not expired
 */
export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Set cache value
 */
export function setCached<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}

