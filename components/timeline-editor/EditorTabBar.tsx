"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye, Save, X } from "lucide-react";

interface EditorTabBarProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSaving?: boolean;
  showPreview?: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onPreview?: () => void;
  onSave?: () => void;
}

export const EditorTabBar = ({
  currentStep,
  totalSteps,
  canProceed,
  isSaving = false,
  showPreview = false,
  onBack,
  onNext,
  onCancel,
  onPreview,
  onSave,
}: EditorTabBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Center: Step indicator */}
          <div className="text-sm text-muted-foreground order-1 sm:order-2 w-full sm:w-auto text-center sm:text-left">
            Step {currentStep} of {totalSteps}
          </div>

          {/* Back and Next buttons on same row in mobile */}
          <div className="flex gap-3 w-full sm:w-auto order-2 sm:order-1">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={currentStep === 1}
              className="flex-1 sm:flex-initial"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

            {/* Next/Save/Preview buttons */}
            {currentStep === 5 ? (
              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="flex-1 sm:flex-initial"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : currentStep === 6 ? (
              // Step 6: Always show Save button (preview is always visible)
              onSave && (
                      <Button
                        onClick={onSave}
                  disabled={isSaving}
                        className="flex-1 sm:flex-initial"
                      >
                        {isSaving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Timeline
                          </>
                        )}
                      </Button>
              )
            ) : (
              <Button
                onClick={onNext}
                className="flex-1 sm:flex-initial"
                variant={!canProceed ? "outline" : "default"}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Cancel button */}
            <Button
              variant="ghost"
              onClick={onCancel}
            className="w-full sm:w-auto text-muted-foreground hover:text-destructive order-3 sm:order-3"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
        </div>
      </div>
    </div>
  );
};

