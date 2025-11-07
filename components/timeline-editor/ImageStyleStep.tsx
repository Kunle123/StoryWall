import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pipette } from "lucide-react";
import { useState, useEffect } from "react";

interface ImageStyleStepProps {
  imageStyle: string;
  setImageStyle: (style: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  hasRealPeople?: boolean; // If true, disable photorealistic option
}

const imageStyles = [
  "Photorealistic",
  "Illustration",
  "Minimalist",
  "Vintage",
  "Watercolor",
  "3D Render",
  "Sketch",
  "Abstract",
];

const themeColors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F97316" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
];

export const ImageStyleStep = ({ 
  imageStyle, 
  setImageStyle,
  themeColor,
  setThemeColor,
  hasRealPeople = false
}: ImageStyleStepProps) => {
  const [customStyle, setCustomStyle] = useState("");
  const [customColor, setCustomColor] = useState(themeColor || "#3B82F6");

  // If photorealistic is selected but real people are detected, switch to illustration
  useEffect(() => {
    if (imageStyle === "Photorealistic" && hasRealPeople) {
      setImageStyle("Illustration");
    }
  }, [hasRealPeople, imageStyle, setImageStyle]);

  const handleStyleClick = (style: string) => {
    if (style === "Photorealistic" && hasRealPeople) {
      return; // Don't allow selection
    }
    setImageStyle(style);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 4: Select Image Style
        </h2>
        <p className="text-muted-foreground mb-6">
          Choose an art style and optional theme color for all timeline images
        </p>
        {hasRealPeople && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              ⚠️ Photorealistic style is disabled for timelines with real people. Please choose an artistic style instead.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base mb-3 block">Image Style</Label>
          <div className="flex flex-wrap gap-2">
            {imageStyles.map((style) => {
              const isDisabled = style === "Photorealistic" && hasRealPeople;
              return (
                <Badge
                  key={style}
                  variant={imageStyle === style ? "default" : "outline"}
                  className={`px-4 py-2 text-sm ${
                    isDisabled 
                      ? "opacity-50 cursor-not-allowed" 
                      : "cursor-pointer"
                  }`}
                  onClick={() => !isDisabled && handleStyleClick(style)}
                >
                  {style}
                </Badge>
              );
            })}
          </div>
          <div className="mt-4">
            <Label className="text-sm mb-2 block">Or describe your own style</Label>
            <Textarea
              placeholder="e.g., in a comic book hero style"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <div>
          <Label className="text-base mb-3 block">Theme Color (Optional)</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select a dominant color theme for the generated images
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {themeColors.map((color) => (
              <Badge
                key={color.name}
                variant={themeColor === color.value ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => setThemeColor(color.value)}
              >
                <div 
                  className="w-4 h-4 rounded-full mr-2 border border-border"
                  style={{ backgroundColor: color.value }}
                />
                {color.name}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Custom Color</Label>
              <Input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setThemeColor(e.target.value);
                }}
                className="h-10 w-full cursor-pointer"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setThemeColor(customColor)}
              className="h-10"
            >
              <Pipette className="mr-2 h-4 w-4" />
              Apply Color
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

