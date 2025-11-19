"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, HelpCircle, RefreshCw, Loader2 } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface VerificationResult {
  year?: number;
  month?: number;
  day?: number;
  title: string;
  description?: string;
  verified: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues?: string[];
  corrected?: boolean;
}

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verifiedEvents: VerificationResult[];
  summary: {
    total: number;
    verified: number;
    flagged: number;
    corrected?: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
  timelineDescription?: string;
  timelineName?: string;
  onEventCorrected?: (eventIndex: number, correctedEvent: VerificationResult) => void;
}

export function VerificationDialog({
  open,
  onOpenChange,
  verifiedEvents,
  summary,
  timelineDescription = '',
  timelineName = 'Untitled Timeline',
  onEventCorrected,
}: VerificationDialogProps) {
  const { toast } = useToast();
  const [correctingIndex, setCorrectingIndex] = useState<number | null>(null);

  const handleCorrectEvent = async (eventIndex: number, event: VerificationResult) => {
    if (!event.issues || event.issues.length === 0) {
      toast({
        title: "No issues",
        description: "This event has no issues to correct.",
        variant: "destructive",
      });
      return;
    }

    setCorrectingIndex(eventIndex);
    try {
      const response = await fetch("/api/ai/correct-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            year: event.year,
            month: event.month,
            day: event.day,
            title: event.title,
            description: event.description,
          },
          issues: event.issues,
          timelineDescription,
          timelineName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to correct event");
      }

      const { correctedEvent } = await response.json();
      
      if (onEventCorrected) {
        onEventCorrected(eventIndex, correctedEvent);
      }

      toast({
        title: "Event corrected",
        description: "The event has been corrected with verified information.",
      });
    } catch (error: any) {
      console.error("Error correcting event:", error);
      toast({
        title: "Failed to correct event",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setCorrectingIndex(null);
    }
  };
  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <HelpCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Verification Results</DialogTitle>
          <DialogDescription>
            Fact-checking results for {summary.total} events
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg mb-6">
          <div>
            <div className="text-2xl font-bold">{summary.verified}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{summary.flagged}</div>
            <div className="text-sm text-muted-foreground">Flagged</div>
          </div>
          {summary.corrected !== undefined && (
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.corrected}</div>
              <div className="text-sm text-muted-foreground">Auto-Corrected</div>
            </div>
          )}
          <div>
            <div className="text-2xl font-bold text-green-600">{summary.highConfidence}</div>
            <div className="text-sm text-muted-foreground">High Confidence</div>
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-4">
          {verifiedEvents.map((event, idx) => (
            <div
              key={idx}
              className={`p-4 border rounded-lg ${
                event.verified && event.confidence === 'high'
                  ? 'bg-green-50 border-green-200'
                  : event.confidence === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getConfidenceIcon(event.confidence)}
                    <h4 className="font-semibold">{event.title}</h4>
                  </div>
                  {event.year && (
                    <p className="text-sm text-muted-foreground mb-2">{event.year}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
                <div>{getConfidenceBadge(event.confidence)}</div>
              </div>
              
              {event.corrected && (
                <div className="mt-2 pt-2 border-t">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Auto-Corrected
                  </Badge>
                </div>
              )}
              
              {event.issues && event.issues.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Issues Found:</p>
                    {event.confidence !== 'high' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCorrectEvent(idx, event)}
                        disabled={correctingIndex === idx}
                      >
                        {correctingIndex === idx ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Correcting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Correct
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {event.issues.map((issue, issueIdx) => (
                      <li key={issueIdx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

