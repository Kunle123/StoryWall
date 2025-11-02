import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ImageStyleStepProps {
  imageStyle: string;
  setImageStyle: (style: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
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
  setThemeColor 
}: ImageStyleStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 4: Select Image Style
        </h2>
        <p className="text-muted-foreground mb-6">
          Choose an art style and optional theme color for all timeline images
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base mb-3 block">Image Style</Label>
          <div className="flex flex-wrap gap-2">
            {imageStyles.map((style) => (
              <Badge
                key={style}
                variant={imageStyle === style ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => setImageStyle(style)}
              >
                {style}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base mb-3 block">Theme Color (Optional)</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select a dominant color theme for the generated images
          </p>
          <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
    </div>
  );
};

