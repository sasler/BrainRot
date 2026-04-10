"use client";

import { useId } from "react";
import type { RatingData } from "./RatingsProvider";

interface RatingSummaryProps {
  rating: RatingData | null;
  size?: "sm" | "md";
  accentColor?: string;
}

function StarIcon({
  filled,
  half,
  size,
  color,
  uniqueId,
}: {
  filled: boolean;
  half: boolean;
  size: number;
  color: string;
  uniqueId: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {half && (
        <defs>
          <linearGradient id={uniqueId}>
            <stop offset="50%" stopColor={color} />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.26 5.06 16.7 6 11.21l-4-3.9 5.53-.8L10 1.5z"
        fill={half ? `url(#${uniqueId})` : filled ? color : "transparent"}
        stroke={filled || half ? color : "rgba(255,255,255,0.15)"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RatingSummary({
  rating,
  size = "sm",
  accentColor = "var(--neon-amber)",
}: RatingSummaryProps) {
  const baseId = useId();

  if (!rating) return null;

  const starSize = size === "sm" ? 12 : 16;
  const stars = [];
  const fullStars = Math.floor(rating.average);
  const fractionalPart = rating.average % 1;
  const nextStarIsFull = fractionalPart >= 0.75;
  const nextStarIsHalf = fractionalPart >= 0.25 && fractionalPart < 0.75;

  for (let i = 1; i <= 5; i++) {
    const isNextStar = i === fullStars + 1;
    const filled = i <= fullStars || (isNextStar && nextStarIsFull);
    const half = !filled && isNextStar && nextStarIsHalf;
    stars.push(
      <StarIcon
        key={i}
        filled={filled}
        half={half}
        size={starSize}
        color={accentColor}
        uniqueId={`${baseId}-star-${i}`}
      />,
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">{stars}</div>
      <span
        className={`font-mono ${size === "sm" ? "text-[10px]" : "text-xs"} text-foreground/50`}
      >
        {rating.average.toFixed(1)}
        <span className="text-foreground/30"> ({rating.count})</span>
      </span>
    </div>
  );
}
