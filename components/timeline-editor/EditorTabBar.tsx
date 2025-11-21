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
          {/* Left side: Back button */}
          <Button
            variant="outline"
            onClick={onBack}
            disabled={currentStep === 1}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Center: Step indicator */}
          <div className="text-sm text-muted-foreground order-1 sm:order-2">
            Step {currentStep} of {totalSteps}
          </div>

          {/* Right side: Next/Save/Preview buttons */}
          <div className="flex gap-3 w-full sm:w-auto order-3 sm:order-3">
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
              <>
                {!showPreview ? (
                  <>
                    {onPreview && (
                      <Button
                        variant="outline"
                        onClick={onPreview}
                        disabled={!canProceed}
                        className="flex-1 sm:flex-initial"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Timeline
                      </Button>
                    )}
                    {onSave && (
                      <Button
                        onClick={onSave}
                        disabled={!canProceed || isSaving}
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
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={onBack}
                      className="flex-1 sm:flex-initial"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    {onSave && (
                      <Button
                        onClick={onSave}
                        disabled={!canProceed || isSaving}
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
                    )}
                  </>
                )}
              </>
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
          {(currentStep === 6 && showPreview) || currentStep !== 6 ? (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full sm:w-auto text-muted-foreground hover:text-destructive order-4 sm:order-4"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

