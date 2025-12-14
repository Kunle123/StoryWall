import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface ImageStyleStepProps {
  imageStyle: string;
  setImageStyle: (style: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  hasRealPeople?: boolean; // If true, disable photorealistic option
  includesPeople?: boolean;
  setIncludesPeople?: (includes: boolean) => void;
}

const imageStyles = [
  "Illustration",
  "Watercolor",
  "Sketch",
  "Minimalist",
  "Vintage",
  "3D Render",
  "Abstract",
];

export const ImageStyleStep = ({ 
  imageStyle, 
  setImageStyle,
  themeColor,
  setThemeColor,
  hasRealPeople = false, // Keep prop for compatibility but don't use it
  includesPeople = true,
  setIncludesPeople
}: ImageStyleStepProps) => {
  const [customStyle, setCustomStyle] = useState("");
  
  // Set default to "Illustration" if imageStyle is empty
  useEffect(() => {
    if (!imageStyle || imageStyle.trim() === "") {
      setImageStyle("Illustration");
    }
  }, [imageStyle, setImageStyle]);

  // Sync customStyle with imageStyle when customStyle is provided
  // This ensures custom styles are immediately available for validation
  useEffect(() => {
    if (customStyle && customStyle.trim()) {
      const trimmed = customStyle.trim();
      setImageStyle(trimmed);
      console.log('[ImageStyleStep] Synced custom style to imageStyle:', trimmed);
    } else if (!imageStyle || imageStyles.includes(imageStyle)) {
      // Only clear if no preset is selected (preset takes priority)
      // Don't clear if a preset is selected
    }
  }, [customStyle, setImageStyle, imageStyle]);

  const handleStyleClick = (style: string) => {
    console.log('[ImageStyleStep] Setting image style:', style);
    setImageStyle(style);
    // Clear custom style when preset is selected
    setCustomStyle("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 4: Select Image Style
        </h2>
        <p className="text-muted-foreground mb-6">
          Choose an art style for all timeline images
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base mb-3 block">Image Style</Label>
          {imageStyle && (
            <p className="text-sm text-muted-foreground mb-3">
              Selected: <strong>{imageStyle}</strong>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {imageStyles.map((style) => (
              <Button
                key={style}
                type="button"
                variant={imageStyle === style ? "default" : "outline"}
                className="px-4 py-2 text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[ImageStyleStep] Button clicked:', style);
                  handleStyleClick(style);
                }}
              >
                {style}
              </Button>
            ))}
          </div>
          <div className="mt-4">
            <Label className="text-sm mb-2 block">Or describe your own style</Label>
            <Textarea
              placeholder="e.g., in a comic book hero style"
              value={customStyle}
              onChange={(e) => {
                const value = e.target.value;
                setCustomStyle(value);
                // Immediately sync to imageStyle for validation
                if (value && value.trim()) {
                  setImageStyle(value.trim());
                  console.log('[ImageStyleStep] Custom style changed, synced to imageStyle:', value.trim());
                }
              }}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        {/* People Checkbox */}
        {setIncludesPeople && (
          <div className="flex items-start space-x-2 p-4 border rounded-lg">
            <Checkbox
              id="includes-people"
              checked={includesPeople}
              onCheckedChange={(checked) => setIncludesPeople(checked === true)}
            />
            <div className="space-y-0.5 flex-1">
              <Label
                htmlFor="includes-people"
                className="text-base font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                This timeline includes people (celebrities, politicians, public figures)
              </Label>
              <p className="text-sm text-muted-foreground">
                Uncheck this if your timeline is about concepts, processes, science, medicine, or topics without specific named people. This helps generate more accurate images.
              </p>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

