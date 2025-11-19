"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";

interface VerificationResult {
  year?: number;
  title: string;
  description?: string;
  verified: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues?: string[];
}

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verifiedEvents: VerificationResult[];
  summary: {
    total: number;
    verified: number;
    flagged: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}

export function VerificationDialog({
  open,
  onOpenChange,
  verifiedEvents,
  summary,
}: VerificationDialogProps) {
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-6">
          <div>
            <div className="text-2xl font-bold">{summary.verified}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{summary.flagged}</div>
            <div className="text-sm text-muted-foreground">Flagged</div>
          </div>
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
              
              {event.issues && event.issues.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Issues Found:</p>
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

