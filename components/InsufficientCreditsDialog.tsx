"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required: number;
  current: number;
  action: string;
  onBuyCredits: () => void;
  onContinueWithout?: () => void;
}

export const InsufficientCreditsDialog = ({
  open,
  onOpenChange,
  required,
  current,
  action,
  onBuyCredits,
  onContinueWithout,
}: InsufficientCreditsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Insufficient Credits
          </DialogTitle>
          <DialogDescription>
            You need {required} credits for {action}, but you only have {current} credits.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Required:</span>
            <span className="font-semibold text-destructive">{required} credits</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Your Balance:</span>
            <span className="font-semibold">{current} credits</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onContinueWithout && (
            <Button
              variant="outline"
              onClick={() => {
                onContinueWithout();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto"
            >
              Continue Without AI
            </Button>
          )}
          <Button
            onClick={() => {
              onBuyCredits();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            <Coins className="mr-2 h-4 w-4" />
            Buy Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

