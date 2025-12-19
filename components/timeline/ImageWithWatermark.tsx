"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface ImageWithWatermarkProps {
  src: string;
  alt: string;
  isFirstOrLast: boolean;
  timelineIsPublic: boolean;
  className?: string;
}

export function ImageWithWatermark({
  src,
  alt,
  isFirstOrLast,
  timelineIsPublic,
  className = "",
}: ImageWithWatermarkProps) {
  const router = useRouter();

  // Only show watermark on public timelines and if it's first or last image
  const showWatermark = timelineIsPublic && isFirstOrLast;

  return (
    <div className="relative inline-block w-full">
      <img
        src={src}
        alt={alt}
        className={className}
      />
      {showWatermark && (
        <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-md bg-black/70 backdrop-blur-sm shadow-lg">
          <p className="text-[11px] text-white/95 leading-tight whitespace-nowrap">
            Created with AI on{" "}
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                router.push("/");
              }}
              className="font-bold text-white hover:text-white/90 underline transition-colors"
            >
              Storywall.com
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

