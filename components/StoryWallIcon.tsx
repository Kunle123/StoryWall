interface StoryWallIconProps {
  size?: number;
  className?: string;
}

export const StoryWallIcon = ({ size = 24, className = "" }: StoryWallIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle outline */}
      <circle cx="12" cy="12" r="10" stroke="#4a5568" strokeWidth="1.5" fill="none" />
      {/* SW text */}
      <text
        x="12"
        y="16"
        fontSize="10"
        fontWeight="bold"
        fill="#4a5568"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        SW
      </text>
    </svg>
  );
};

