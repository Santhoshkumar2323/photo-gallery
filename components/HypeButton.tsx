"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";

interface HypeButtonProps {
  photoId: string;
  count: number;
  hasHyped: boolean;
  onHyped: (newCount: number) => void;
  onHypeFailed: () => void;
  size?: "small" | "large";
}

export default function HypeButton({
  photoId,
  count,
  hasHyped,
  onHyped,
  onHypeFailed,
  size = "small",
}: HypeButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justPopped, setJustPopped] = useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation(); 

    if (hasHyped || isSubmitting) return;

    const deviceId = getDeviceId();
    if (!deviceId) return; 

    setIsSubmitting(true);
    setJustPopped(true);
    onHyped(count + 1); 

    try {
      const response = await fetch("/api/hype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, deviceId }),
      });

      if (!response.ok) {
        onHypeFailed();
        return;
      }

      const body = await response.json();
      onHyped(body.hype); 
    } catch (err) {
      console.error("Hype request failed:", err);
      onHypeFailed();
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setJustPopped(false), 300);
    }
  }

  const iconSize = size === "large" ? 22 : 12;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={hasHyped || isSubmitting}
      aria-label={hasHyped ? `Hyped, ${count} total` : `Hype this photo, ${count} so far`}
      aria-pressed={hasHyped}
      className={
        size === "large"
          ? `flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
              hasHyped
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/10 text-white hover:bg-white/15"
            }`
          : `flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-all duration-200 ${
              hasHyped
                ? "bg-amber-500/25 text-amber-300"
                : "bg-black/50 text-white backdrop-blur-sm"
            }`
      }
    >
      <Flame
        size={iconSize}
        aria-hidden="true"
        fill={hasHyped ? "currentColor" : "none"}
        className={`transition-transform duration-300 ${justPopped ? "scale-125" : "scale-100"}`}
      />
      {size === "small" && count}
    </button>
  );
}