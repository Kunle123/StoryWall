"use client";

import { useState } from "react";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  showWatermark?: boolean;
  watermarkText?: string;
}

export function WatermarkedImage({
  src,
  alt,
  className = "",
  showWatermark = false,
  watermarkText = "Created with AI on Storywall.com",
}: WatermarkedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative inline-block w-full">
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={() => setImageLoaded(true)}
        loading="lazy"
      />
      {showWatermark && imageLoaded && (
        <div
          className="absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] font-medium text-white/90 bg-black/40 backdrop-blur-sm pointer-events-none select-none"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {watermarkText}
        </div>
      )}
    </div>
  );
}

