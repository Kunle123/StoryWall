import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CreateTimelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (name: string, description: string) => void;
}

export const CreateTimelineModal = ({ open, onOpenChange, selectedCount, onConfirm }: CreateTimelineModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name, description);
      setName("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[23px] font-bold">Create New Timeline</DialogTitle>
          <DialogDescription className="text-[15px]">
            {selectedCount} {selectedCount === 1 ? "card" : "cards"} selected
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeline-name" className="text-[15px]">Timeline Name</Label>
            <Input
              id="timeline-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Journey 2024"
              required
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeline-description" className="text-[15px]">Description (optional)</Label>
            <Textarea
              id="timeline-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a brief description for your timeline..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Timeline
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
