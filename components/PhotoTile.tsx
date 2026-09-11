"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, Download, Loader2 } from "lucide-react";
import HypeButton from "@/components/HypeButton";

export interface GridPhoto {
  id: string;
  path: string;
  thumbnailUrl: string;
  mediumUrl: string;
  views: number;
  downloads: number;
  hype: number;
}

interface PhotoTileProps {
  photo: GridPhoto;
  onClick: () => void;
  hypeCount: number;
  hasHyped: boolean;
  onHyped: (newCount: number) => void;
  onHypeFailed: () => void;
}

export default function PhotoTile({
  photo,
  onClick,
  hypeCount,
  hasHyped,
  onHyped,
  onHypeFailed,
}: PhotoTileProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  async function handleDownload(event: React.MouseEvent) {
    event.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadError(false);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (!response.ok) throw new Error("Download request failed.");

      const { url } = await response.json();

      const link = document.createElement("a");
      link.href = url;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadError(true);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl bg-white/5 transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(212,163,89,0.15)]">
      {/* Warm-toned placeholder, visible until the real thumbnail
          finishes loading — replaces a blank/gray flash with
          something that already matches the app's palette. */}
      {!isImageLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-amber-900/10 to-white/5" />
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label="Open photo"
        className="absolute inset-0 active:scale-[0.97] transition-transform duration-150"
      >
        <Image
          src={photo.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, 150px"
          onLoad={() => setIsImageLoaded(true)}
          className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
            isImageLoaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-md"
          }`}
        />
      </button>

      {/* Top-right: download button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={downloadError ? "Download failed, try again" : "Download original photo"}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-amber-500/30 disabled:opacity-60"
      >
        {isDownloading ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <Download size={14} aria-hidden="true" />
        )}
      </button>

      {downloadError && (
        <span className="absolute right-1.5 top-9 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-red-300">
          Failed
        </span>
      )}

      {/* Bottom-left: view count + hype button, always visible */}
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1">
        <span className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
          <Eye size={11} aria-hidden="true" />
          {photo.views}
        </span>
        <span className="pointer-events-auto">
          <HypeButton
            photoId={photo.id}
            count={hypeCount}
            hasHyped={hasHyped}
            onHyped={onHyped}
            onHypeFailed={onHypeFailed}
            size="small"
          />
        </span>
      </div>
    </div>
  );
}