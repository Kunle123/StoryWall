import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Upload, X, Image as ImageIcon, Loader2, Globe, Twitter, Instagram, Facebook, Linkedin, Youtube, Music } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { HashtagInput } from "./HashtagInput";
import { SOURCE_TYPE_CONFIGS, SourceType, detectSourceType } from "@/lib/utils/sourceValidation";

interface TimelineInfoStepProps {
  timelineName: string;
  setTimelineName: (name: string) => void;
  timelineDescription: string;
  setTimelineDescription: (description: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  isFactual: boolean;
  setIsFactual: (isFactual: boolean) => void;
  startDate?: Date;
  setStartDate?: (date?: Date) => void;
  endDate?: Date;
  setEndDate?: (date?: Date) => void;
  isNumbered?: boolean;
  setIsNumbered?: (isNumbered: boolean) => void;
  numberLabel?: string;
  setNumberLabel?: (label: string) => void;
  maxEvents?: number;
  setMaxEvents?: (maxEvents: number) => void;
  sourceRestrictions?: string[];
  setSourceRestrictions?: (sources: string[]) => void;
  referencePhoto?: {
    file: File | null;
    url: string | null;
    personName: string;
    hasPermission: boolean;
  };
  setReferencePhoto?: (photo: {
    file: File | null;
    url: string | null;
    personName: string;
    hasPermission: boolean;
  }) => void;
  hashtags?: string[];
  setHashtags?: (hashtags: string[]) => void;
}

export const TimelineInfoStep = ({
  timelineName,
  setTimelineName,
  timelineDescription,
  setTimelineDescription,
  isPublic,
  setIsPublic,
  isFactual,
  setIsFactual,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isNumbered = false,
  setIsNumbered,
  numberLabel = "Day",
  setNumberLabel,
  maxEvents = 20,
  setMaxEvents,
  sourceRestrictions = [],
  setSourceRestrictions,
  referencePhoto,
  setReferencePhoto,
  hashtags = [],
  setHashtags,
}: TimelineInfoStepProps) => {
  const [maxEventsInput, setMaxEventsInput] = useState<string>(maxEvents.toString());
  const [sourceInput, setSourceInput] = useState<string>("");
  const [sourceType, setSourceType] = useState<SourceType>("custom");
  const [sourceError, setSourceError] = useState<string>("");
  const [referencePhotoPersonName, setReferencePhotoPersonName] = useState<string>(referencePhoto?.personName || "");
  const [referencePhotoHasPermission, setReferencePhotoHasPermission] = useState<boolean>(referencePhoto?.hasPermission || false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(referencePhoto?.url || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { toast } = useToast();
  const [isPersonSubject, setIsPersonSubject] = useState<boolean | null>(null);
  
  // Auto-detect source type when input changes (only if user hasn't manually selected a type)
  useEffect(() => {
    if (sourceInput.trim()) {
      const detected = detectSourceType(sourceInput);
      // Only auto-detect if current type is 'custom' (user hasn't manually selected)
      if (sourceType === 'custom' && detected !== 'custom') {
        setSourceType(detected);
      }
    }
  }, [sourceInput]); // Removed sourceType from deps to avoid loop
  
  // Sync external maxEvents changes to input
  useEffect(() => {
    setMaxEventsInput(maxEvents.toString());
  }, [maxEvents]);

  // Sync reference photo state
  useEffect(() => {
    if (referencePhoto) {
      setReferencePhotoPersonName(referencePhoto.personName);
      setReferencePhotoHasPermission(referencePhoto.hasPermission);
      setPreviewUrl(referencePhoto.url);
    }
  }, [referencePhoto]);

  const handleAddSource = () => {
    if (!sourceInput.trim() || !setSourceRestrictions) return;
    
    const config = SOURCE_TYPE_CONFIGS[sourceType];
    const validation = config.validate(sourceInput);
    
    if (!validation.valid) {
      setSourceError(validation.error || "Invalid source format");
      toast({
        title: "Invalid Source",
        description: validation.error || "Please check the format and try again",
        variant: "destructive",
      });
      return;
    }
    
    // Use formatted version if available, otherwise use original
    const formattedSource = validation.formatted || sourceInput.trim();
    setSourceRestrictions([...sourceRestrictions, formattedSource]);
    setSourceInput("");
    setSourceError("");
    setSourceType("custom"); // Reset to custom for next entry
  };
  
  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'tiktok': return Music; // TikTok icon (using Music as closest match)
      case 'facebook': return Facebook;
      case 'linkedin': return Linkedin;
      case 'youtube': return Youtube;
      case 'url': return Globe;
      default: return Globe;
    }
  };

  const handleRemoveSource = (index: number) => {
    if (setSourceRestrictions) {
      setSourceRestrictions(sourceRestrictions.filter((_, i) => i !== index));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Create temporary preview URL for immediate feedback
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);
    setIsUploadingPhoto(true);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-reference-photo': 'true', // Mark as reference photo for folder organization
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      const cloudinaryUrl = data.url;

      // Revoke the temporary blob URL
      URL.revokeObjectURL(tempUrl);

      // Update preview with Cloudinary URL
      setPreviewUrl(cloudinaryUrl);

      // Update state with Cloudinary URL
      if (setReferencePhoto) {
        setReferencePhoto({
          file: null, // Don't store the file object, just the URL
          url: cloudinaryUrl,
          personName: referencePhotoPersonName,
          hasPermission: referencePhotoHasPermission,
        });
      }

      toast({
        title: "Photo uploaded",
        description: "Reference photo has been uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading reference photo:", error);
      // Revoke the temporary blob URL on error
      URL.revokeObjectURL(tempUrl);
      setPreviewUrl(null);
      
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload reference photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    // Revoke blob URL if it's a temporary one (shouldn't happen after upload, but just in case)
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (setReferencePhoto) {
      setReferencePhoto({
        file: null,
        url: null,
        personName: "",
        hasPermission: false,
      });
    }
    setReferencePhotoPersonName("");
    setReferencePhotoHasPermission(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePersonNameChange = (name: string) => {
    setReferencePhotoPersonName(name);
    if (setReferencePhoto && referencePhoto) {
      setReferencePhoto({
        ...referencePhoto,
        personName: name,
      });
    }
  };

  const handlePermissionChange = (hasPermission: boolean) => {
    setReferencePhotoHasPermission(hasPermission);
    if (setReferencePhoto && referencePhoto) {
      setReferencePhoto({
        ...referencePhoto,
        hasPermission,
      });
    }
  };

  // Canned descriptions for person subjects
  const personDescriptions = [
    "A biographical timeline of the key moments and milestones in their life and career.",
    "An overview of their public life, documenting their major achievements and significant events.",
    "A critical analysis of their impact and influence on their field and the wider culture.",
    "An examination of the key themes and patterns that have defined their work and legacy.",
    "A historical account of a significant event or period, and their central role within it.",
    "A visual summary exploring the context, causes, and consequences of a notable controversy or achievement.",
  ];

  // Canned descriptions for non-person subjects
  const nonPersonDescriptions = [
    "A historical timeline of its origin, key events, and evolution over time.",
    "An overview of its creation, major milestones, and lasting impact.",
    "A critical analysis of its cultural significance, influence, and legacy.",
    "An examination of the key themes, styles, and defining characteristics of the subject.",
    "A detailed account of a specific era, event, or controversy associated with the subject.",
  ];

  // Get the appropriate descriptions based on subject type
  const getDescriptionOptions = () => {
    if (isPersonSubject === null) return [];
    return isPersonSubject ? personDescriptions : nonPersonDescriptions;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 1: Timeline Information
        </h2>
        <p className="text-muted-foreground mb-6">
          Provide basic information about your timeline
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="timeline-name" className="text-base mb-2 block">
            Timeline Name
          </Label>
          <Input
            id="timeline-name"
            placeholder="e.g., The Great British Bake Off Winners Journey"
            value={timelineName}
            onChange={(e) => setTimelineName(e.target.value)}
            className="h-10"
          />
        </div>

        <div>
          <Label htmlFor="timeline-description" className="text-base mb-2 block">
            Description
          </Label>
          
          {/* Subject type selection - show when title is entered */}
          {timelineName && timelineName.trim().length >= 3 && isPersonSubject === null && (
            <div className="mb-3 space-y-2">
              <Label className="text-sm">Is the subject of your timeline a person?</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPersonSubject(true)}
                  className="flex-1"
                >
                  Yes, it's a person
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPersonSubject(false)}
                  className="flex-1"
                >
                  No, it's something else
                </Button>
              </div>
            </div>
          )}
          
          {/* Description options dropdown - show when subject type is selected */}
          {isPersonSubject !== null && getDescriptionOptions().length > 0 && (
            <div className="mb-3 space-y-2">
              <Label className="text-sm">Choose a description template:</Label>
              <Select
                value={timelineDescription || ""}
                onValueChange={(value) => setTimelineDescription(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a description template" />
                </SelectTrigger>
                <SelectContent>
                  {getDescriptionOptions().map((option, idx) => (
                    <SelectItem key={idx} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Textarea
            id="timeline-description"
            placeholder="e.g., A timeline of all the winners, memorable moments, and show-stopping bakes from the iconic baking competition"
            value={timelineDescription}
            onChange={(e) => setTimelineDescription(e.target.value)}
            className="min-h-[120px] resize-none"
            rows={5}
          />
          <p className="text-sm text-muted-foreground mt-2">
            AI will generate up to 20 events based on your timeline description
          </p>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="allow-fictional" className="text-base">
              Allow Fictional Information
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable AI to use fictional or creative content when generating timeline events
            </p>
          </div>
          <Switch
            id="allow-fictional"
            checked={!isFactual}
            onCheckedChange={(checked) => setIsFactual(!checked)}
          />
        </div>

        {!isNumbered && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-base mb-2 block">
                Start Date (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="end-date" className="text-base mb-2 block">
                End Date (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="more-options">
            <AccordionTrigger>More Options</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-private" className="text-base">
                      Private Timeline
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Make this timeline private (only visible to you)
                    </p>
                  </div>
                  <Switch
                    id="is-private"
                    checked={!isPublic}
                    onCheckedChange={(checked) => setIsPublic(!checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="is-numbered" className="text-base">
                      Numbered Events
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Use sequential numbering instead of dates (e.g., "12 Days of Christmas")
                    </p>
                    {isNumbered && setIsNumbered && setNumberLabel && (
                      <div className="mt-3">
                        <Label htmlFor="number-label" className="text-sm mb-1 block">
                          Event Label
                        </Label>
                        <Input
                          id="number-label"
                          placeholder="Day, Event, Step, etc."
                          value={numberLabel}
                          onChange={(e) => setNumberLabel(e.target.value)}
                          className="h-9 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Events will be labeled as "{numberLabel} 1", "{numberLabel} 2", etc.
                        </p>
                      </div>
                    )}
                  </div>
                  <Switch
                    id="is-numbered"
                    checked={isNumbered}
                    onCheckedChange={(checked) => setIsNumbered?.(checked)}
                    disabled={!setIsNumbered}
                  />
                </div>

                <div>
                  <Label htmlFor="hashtags" className="text-base mb-2 block">
                    Hashtags
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add hashtags to help others discover your timeline. Press Enter or comma to add.
                  </p>
                  {setHashtags && (
                    <HashtagInput
                      hashtags={hashtags}
                      onChange={setHashtags}
                      placeholder="Type to search or add hashtags..."
                    />
                  )}
                </div>

                <div className="mt-2 space-y-2">
                  {maxEvents <= 20 ? (
                    <p className="text-sm text-muted-foreground">
                      AI will generate up to 20 events based on your timeline description
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      For &gt; 20 events, enter the max number here. (If using AI, each image costs 1 credit)
                    </p>
                  )}
                  {setMaxEvents && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="max-events" className="text-sm">
                        Max Events:
                      </Label>
                      <Input
                        id="max-events"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={maxEventsInput}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow empty string for deletion
                          if (inputValue === '') {
                            setMaxEventsInput('');
                            return;
                          }
                          // Only allow digits
                          if (!/^\d+$/.test(inputValue)) {
                            return; // Ignore non-numeric input
                          }
                          // Update local state immediately for responsive UI
                          setMaxEventsInput(inputValue);
                          const value = parseInt(inputValue, 10);
                          if (!isNaN(value) && value >= 1 && value <= 100) {
                            setMaxEvents(value);
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure value is valid on blur
                          const inputValue = e.target.value;
                          if (inputValue === '') {
                            setMaxEventsInput('20');
                            setMaxEvents(20); // Default to 20 if empty
                            return;
                          }
                          const value = parseInt(inputValue, 10);
                          if (isNaN(value) || value < 1) {
                            setMaxEventsInput('1');
                            setMaxEvents(1);
                          } else if (value > 100) {
                            setMaxEventsInput('100');
                            setMaxEvents(100);
                          } else {
                            setMaxEventsInput(value.toString());
                            setMaxEvents(value);
                          }
                        }}
                        className="h-9 w-28"
                      />
                      <span className="text-xs text-muted-foreground">
                        (max 100)
                      </span>
                    </div>
                  )}
                </div>

                {/* Source Restrictions */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="source-restrictions" className="text-base">
                      Source Restrictions (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Require that descriptions and titles are sourced solely from specific resources. 
                      Add social media accounts, websites, or custom sources.
                    </p>
                    
                    <div className="flex gap-2">
                      <Select value={sourceType} onValueChange={(value) => setSourceType(value as SourceType)}>
                        <SelectTrigger className="w-[180px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom Source</SelectItem>
                          <SelectItem value="url">Website URL</SelectItem>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex-1 relative">
                        <Input
                          id="source-restrictions"
                          placeholder={SOURCE_TYPE_CONFIGS[sourceType].placeholder}
                          value={sourceInput}
                          onChange={(e) => {
                            setSourceInput(e.target.value);
                            setSourceError(""); // Clear error on input
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSource();
                            }
                          }}
                          className={cn("h-9", sourceError && "border-destructive")}
                        />
                        {sourceError && (
                          <p className="text-xs text-destructive mt-1 absolute">{sourceError}</p>
                        )}
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSource}
                        disabled={!sourceInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Example: {SOURCE_TYPE_CONFIGS[sourceType].example}
                    </p>
                    
                    {sourceRestrictions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sourceRestrictions.map((source, index) => {
                          // Detect source type for icon
                          const detectedType = detectSourceType(source);
                          const Icon = getSourceIcon(detectedType);
                          
                          return (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1.5 pr-1"
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span className="max-w-xs truncate">{source}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSource(index)}
                                className="hover:bg-secondary rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reference Photo Upload */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-base">
                      Reference Photo (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Upload a reference photo to base illustrations on. You must confirm who is in the photo 
                      and that you have permission to use it.
                    </p>
                    
                    {!previewUrl ? (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={isUploadingPhoto}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Reference Photo
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={previewUrl}
                            alt="Reference photo preview"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={handleRemovePhoto}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="photo-person-name" className="text-sm">
                            Who is in this photo? *
                          </Label>
                          <Input
                            id="photo-person-name"
                            placeholder="e.g., Taylor Swift, Zohran Mamdani, etc."
                            value={referencePhotoPersonName}
                            onChange={(e) => handlePersonNameChange(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="photo-permission"
                            checked={referencePhotoHasPermission}
                            onCheckedChange={(checked) => handlePermissionChange(checked === true)}
                          />
                          <Label
                            htmlFor="photo-permission"
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            I confirm that I have permission to use this photo for image generation
                          </Label>
                        </div>
                        
                        {previewUrl && (!referencePhotoPersonName.trim() || !referencePhotoHasPermission) && (
                          <p className="text-xs text-muted-foreground">
                            Please provide the person's name and confirm you have permission to use this photo.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

