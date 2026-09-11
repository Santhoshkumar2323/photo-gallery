"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Download, Eye, Loader2 } from "lucide-react";
import HypeButton from "@/components/HypeButton";

export interface LightboxPhoto {
  id: string;
  thumbnailUrl: string;
  mediumUrl: string;
  views: number;
  downloads: number;
  hype: number;
}

interface HypeState {
  count: number;
  hasHyped: boolean;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
  onLoadMore?: () => void;
  hypeOverrides?: Record<string, HypeState>;
  onHype?: (photoId: string, newCount: number) => void;
  onHypeFailed?: (photoId: string) => void;
}

const SWIPE_THRESHOLD_PX = 60;
const LOAD_MORE_THRESHOLD = 5; 

export default function Lightbox({
  photos,
  initialIndex,
  onClose,
  onLoadMore,
  hypeOverrides,
  onHype,
  onHypeFailed,
}: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localHype, setLocalHype] = useState<Record<string, HypeState>>({});

  const photo = photos[index];
  const usingExternalHypeState = hypeOverrides !== undefined && onHype !== undefined;

  function getHypeState(p: LightboxPhoto): HypeState {
    const source = usingExternalHypeState ? hypeOverrides! : localHype;
    return source[p.id] ?? { count: p.hype, hasHyped: false };
  }

  function handleHyped(photoId: string, newCount: number) {
    if (usingExternalHypeState) {
      onHype!(photoId, newCount);
    } else {
      setLocalHype((prev) => ({ ...prev, [photoId]: { count: newCount, hasHyped: true } }));
    }
  }

  function handleHypeFailed(photoId: string) {
    if (usingExternalHypeState && onHypeFailed) {
      onHypeFailed(photoId);
    } else {
      setLocalHype((prev) => {
        const current = prev[photoId];
        if (!current) return prev;
        return { ...prev, [photoId]: { count: current.count - 1, hasHyped: false } };
      });
    }
  }

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const checkPaginationBounds = useCallback((currentIndex: number) => {
    if (onLoadMore && currentIndex >= photos.length - LOAD_MORE_THRESHOLD) {
      onLoadMore();
    }
  }, [photos.length, onLoadMore]);

  const goNext = useCallback(() => {
    if (photos.length === 0) return;
    const nextIndex = (index + 1) % photos.length;
    setIndex(nextIndex);
    checkPaginationBounds(nextIndex);
  }, [index, photos.length, checkPaginationBounds]);

  const goPrev = useCallback(() => {
    if (photos.length === 0) return;
    const prevIndex = (index - 1 + photos.length) % photos.length;
    setIndex(prevIndex);
    checkPaginationBounds(prevIndex);
  }, [index, photos.length, checkPaginationBounds]);

  useEffect(() => {
    if (!photo) return;
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: photo.id }),
    }).catch((err) => console.error("View registration failed:", err));
  }, [photo?.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  function handlePointerDown(event: React.PointerEvent) {
    startXRef.current = event.clientX;
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!isDragging) return;
    setDragX(event.clientX - startXRef.current);
  }

  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX < -SWIPE_THRESHOLD_PX) {
      goNext();
    } else if (dragX > SWIPE_THRESHOLD_PX) {
      goPrev();
    }
    setDragX(0);
  }

  async function handleDownload() {
    if (!photo || isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (!response.ok) throw new Error("Download request failed.");
      const body: { url: string } = await response.json();

      const link = document.createElement("a");
      link.href = body.url;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  const visibleSlides = useMemo(() => {
    if (photos.length === 0) return [];
    const positions = [-1, 0, 1];
    return positions.map((offset) => {
      const targetIndex = (index + offset + photos.length) % photos.length;
      return {
        photo: photos[targetIndex],
        offset,
        key: `${photos[targetIndex].id}-${offset}`,
      };
    });
  }, [index, photos]);

  if (!photo) return null;
  const hypeState = getHypeState(photo);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ backgroundColor: "rgba(12, 9, 7, 0.97)" }}
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header Control Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-xs font-semibold tracking-wider text-white/60">
          {index + 1} / {photos.length}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close layout viewer"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Left Trigger Arrow */}
      {photos.length > 1 && (
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous image frame"
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 hidden md:flex rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
      )}

      {/* Continuous Sliding Layer Container */}
      <div
        className="relative w-full h-[75vh] max-w-5xl touch-pan-y flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: `translate3d(${dragX}px, 0px, 0px)`,
            transition: isDragging ? "none" : "transform 250ms cubic-bezier(0.215, 0.610, 0.355, 1)",
            willChange: "transform",
          }}
        >
          {visibleSlides.map(({ photo: item, offset, key }) => (
            <div
              key={key}
              className="absolute inset-0 w-full h-full flex items-center justify-center px-4"
              style={{
                transform: `translate3d(${offset * 100}%, 0px, 0px)`,
              }}
            >
              <Image
                src={item.mediumUrl}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="pointer-events-none select-none object-contain"
                priority={offset === 0}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Trigger Arrow */}
      {photos.length > 1 && (
        <button
          type="button"
          onClick={goNext}
          aria-label="Next image frame"
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 hidden md:flex rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
         >
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      )}

      {/* Bottom Floating Telemetry Control Dock */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 bg-black/50 backdrop-blur-lg px-4 py-2 rounded-full border border-white/10 shadow-2xl">
        <span className="flex items-center gap-1.5 px-1.5 text-xs font-medium text-white/80">
          <Eye size={14} aria-hidden="true" />
          {photo.views}
        </span>

        <HypeButton
          photoId={photo.id}
          count={hypeState.count}
          hasHyped={hypeState.hasHyped}
          onHyped={(newCount) => handleHyped(photo.id, newCount)}
          onHypeFailed={() => handleHypeFailed(photo.id)}
          size="large"
        />

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label="Download original file link"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Download size={14} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
