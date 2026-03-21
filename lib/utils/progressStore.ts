// Simple in-memory store for tracking image generation progress
// Used for streaming progress updates to the client (see /api/ai/generate-images-stream).
//
// **Multi-instance / serverless:** Callbacks and counters live in this process only.
// If the SSE request is handled on instance A but POST /api/ai/generate-images runs on
// instance B, `notifyImageFinished` will never reach the client. Use a single replica,
// sticky sessions, or a shared bus (Redis pub/sub) for horizontal scale.
//
// **Related:** `GenerateImagesStep` uses `?stream=true` on this same route (inline SSE in
// generate-images). The abridged test page uses generate-images-stream + `jobId` — two
// streaming mechanisms; keep behavior in sync when changing event payloads.

export type ProgressImageUpdate = {
  index: number;
  eventTitle: string;
  imageUrl: string | null;
  /** Error message when this slot failed; null on success */
  error: string | null;
  /** Number of events that have finished (success or failure), 1..total */
  completed: number;
  total: number;
};

type ProgressCallback = (update: ProgressImageUpdate) => void;

class ProgressStore {
  private callbacks: Map<string, ProgressCallback> = new Map();
  /** Per-job sequential completion count (increments on each finished slot). */
  private completedCount: Map<string, number> = new Map();

  register(jobId: string, callback: ProgressCallback) {
    this.callbacks.set(jobId, callback);
    this.completedCount.set(jobId, 0);
  }

  unregister(jobId: string) {
    this.callbacks.delete(jobId);
    this.completedCount.delete(jobId);
  }

  /**
   * Call once when a single timeline image slot has finished (success or failure).
   * `completed` is derived automatically (order matches notification order, not event index).
   */
  notifyImageFinished(
    jobId: string,
    payload: {
      index: number;
      eventTitle: string;
      imageUrl: string | null;
      error: string | null;
      total: number;
    }
  ) {
    const callback = this.callbacks.get(jobId);
    if (!callback) {
      return;
    }
    const next = (this.completedCount.get(jobId) ?? 0) + 1;
    this.completedCount.set(jobId, next);
    callback({
      ...payload,
      completed: next,
    });
  }

  has(jobId: string): boolean {
    return this.callbacks.has(jobId);
  }
}

export const progressStore = new ProgressStore();
