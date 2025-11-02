"use client";

import { create } from 'zustand';

interface CreditsState {
  credits: number;
  isLoading: boolean;
  fetchCredits: () => Promise<void>;
  deductCredits: (amount: number, action: string) => Promise<boolean>;
  addCredits: (amount: number) => void;
}

export const useCredits = create<CreditsState>((set, get) => ({
  credits: 100,
  isLoading: false,
  
  fetchCredits: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      
      if (response.ok) {
        if (data.error) {
          console.error('[Credits] API returned error:', data.error, data.message);
          // Still set credits to 100 as fallback, but log the error
        }
        set({ credits: data.credits || 100 });
      } else {
        console.error('[Credits] Failed to fetch credits:', response.status, data);
        // Keep current credits on error
      }
    } catch (error) {
      console.error('[Credits] Network error fetching credits:', error);
      // Keep current credits on network error
    } finally {
      set({ isLoading: false });
    }
  },
  
  deductCredits: async (amount: number, action: string) => {
    // Always fetch fresh credits from server before checking
    await get().fetchCredits();
    const currentCredits = get().credits;
    
    if (currentCredits < amount) {
      // Return false - component will show toast
      return false;
    }
    
    try {
      const response = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, action }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        // Update credits from error response if available
        if (error.credits !== undefined) {
          set({ credits: error.credits });
        }
        throw new Error(error.error || 'Failed to deduct credits');
      }
      
      const data = await response.json();
      set({ credits: data.credits });
      return true;
    } catch (error: any) {
      console.error('Failed to deduct credits:', error);
      // Refresh credits to ensure we have latest
      await get().fetchCredits();
      return false;
    }
  },
  
  addCredits: (amount: number) => {
    set((state) => ({ credits: state.credits + amount }));
  },
}));

