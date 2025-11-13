import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Info } from "lucide-react";

interface TermsViolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation?: string;
}

export function TermsViolationDialog({
  open,
  onOpenChange,
  recommendation,
}: TermsViolationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-destructive">Terms & Conditions Violation</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            This timeline violates our Terms and Conditions. Please amend your description.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="info">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Why are celebrity timelines restricted?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2">
                <p>
                  Celebrity timelines are restricted due to copyright and Right of Publicity laws.
                  Using celebrity likenesses without proper authorization can result in legal issues.
                </p>
                <p className="font-medium pt-2">What you can do instead:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Focus on newsworthy events (elections, major life events, public interest stories)</li>
                  <li>Create timelines about non-celebrity subjects (historical events, scientific processes, concepts)</li>
                  <li>Frame celebrity-related content as news reporting or critical commentary on newsworthy events</li>
                  <li>For film reviews, use mood-based representations that don't use celebrity likenesses</li>
                </ul>
                {recommendation && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="font-medium mb-1">Recommendation:</p>
                    <p>{recommendation}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

