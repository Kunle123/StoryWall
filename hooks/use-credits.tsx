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
      if (response.ok) {
        const data = await response.json();
        set({ credits: data.credits || 100 });
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
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

