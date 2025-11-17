"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimelineEvent } from "./Timeline";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RotateCw } from "lucide-react";

interface EditEventDialogProps {
  event: TimelineEvent;
  timelineId?: string;
  timeline?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdate: (event: TimelineEvent) => void;
}

export function EditEventDialog({
  event,
  timelineId,
  timeline,
  open,
  onOpenChange,
  onEventUpdate,
}: EditEventDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || "");
  const [year, setYear] = useState(event.year?.toString() || "");
  const [month, setMonth] = useState(event.month?.toString() || "");
  const [day, setDay] = useState(event.day?.toString() || "");
  const [number, setNumber] = useState(event.number?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isNumbered = event.number !== undefined;

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = {
        title: title.trim(),
        description: description.trim() || null,
      };

      if (isNumbered) {
        const num = parseInt(number);
        if (!isNaN(num)) {
          updates.number = num;
        }
      } else {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum)) {
          updates.year = yearNum;
        }
        if (month) {
          const monthNum = parseInt(month);
          if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            updates.month = monthNum;
          }
        }
        if (day) {
          const dayNum = parseInt(day);
          if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
            updates.day = dayNum;
          }
        }
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update event");
      }

      const updatedEvent = await response.json();
      
      // Transform to TimelineEvent format
      const timelineEvent: TimelineEvent = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        year: updatedEvent.year,
        month: updatedEvent.month,
        day: updatedEvent.day,
        number: updatedEvent.number,
        numberLabel: updatedEvent.numberLabel,
        image: updatedEvent.image_url,
        category: updatedEvent.category,
      };

      onEventUpdate(timelineEvent);
      
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!timelineId) {
      toast({
        title: "Error",
        description: "Timeline ID is required",
        variant: "destructive",
      });
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/events/${event.id}/regenerate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timelineId,
          imageStyle: timeline?.imageStyle || "Illustration",
          themeColor: timeline?.themeColor || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to regenerate image");
      }

      const result = await response.json();
      
      // Update the event with new image
      const updatedEvent: TimelineEvent = {
        ...event,
        image: result.imageUrl,
      };

      onEventUpdate(updatedEvent);
      
      toast({
        title: "Success",
        description: "Image regenerated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate image",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the event details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={4}
            />
          </div>

          {isNumbered ? (
            <div>
              <Label htmlFor="number">Number</Label>
              <Input
                id="number"
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Event number"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Year"
                />
              </div>
              <div>
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="Month (1-12)"
                />
              </div>
              <div>
                <Label htmlFor="day">Day</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  placeholder="Day (1-31)"
                />
              </div>
            </div>
          )}

          {event.image && (
            <div>
              <Label>Current Image</Label>
              <div className="mt-2 rounded-lg overflow-hidden border border-border">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}

          <div>
            <Button
              variant="outline"
              onClick={handleRegenerateImage}
              disabled={isRegenerating}
              className="w-full"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Regenerate Image
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Regenerate using the same theme, style, and prompt as the original timeline
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

