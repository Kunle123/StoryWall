import { create } from 'zustand';
import { toast } from '@/hooks/use-toast';

interface CreditsState {
  credits: number;
  deductCredits: (amount: number, action: string) => boolean;
  addCredits: (amount: number) => void;
}

export const useCredits = create<CreditsState>((set, get) => ({
  credits: 100, // Starting credits
  
  deductCredits: (amount: number, action: string) => {
    const currentCredits = get().credits;
    
    if (currentCredits < amount) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${amount} credits for ${action}. You have ${currentCredits} credits remaining.`,
        variant: "destructive",
      });
      return false;
    }
    
    set({ credits: currentCredits - amount });
    
    toast({
      title: "Credits Used",
      description: `${amount} credits used for ${action}. ${currentCredits - amount} credits remaining.`,
    });
    
    return true;
  },
  
  addCredits: (amount: number) => {
    set((state) => ({ credits: state.credits + amount }));
    toast({
      title: "Credits Added",
      description: `${amount} credits added to your account. Total: ${get().credits} credits.`,
    });
  },
}));
