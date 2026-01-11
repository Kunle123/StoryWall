// Simple in-memory store for tracking image generation progress
// Used for streaming progress updates to the client

type ProgressCallback = (imageUrl: string, index: number, eventTitle: string, completed: number, total: number) => void;

class ProgressStore {
  private callbacks: Map<string, ProgressCallback> = new Map();

  register(jobId: string, callback: ProgressCallback) {
    this.callbacks.set(jobId, callback);
  }

  unregister(jobId: string) {
    this.callbacks.delete(jobId);
  }

  notify(jobId: string, imageUrl: string, index: number, eventTitle: string, completed: number, total: number) {
    const callback = this.callbacks.get(jobId);
    if (callback) {
      callback(imageUrl, index, eventTitle, completed, total);
    }
  }

  has(jobId: string): boolean {
    return this.callbacks.has(jobId);
  }
}

export const progressStore = new ProgressStore();
