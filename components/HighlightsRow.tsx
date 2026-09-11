"use client";

import Image from "next/image";
import { Eye, Flame, Download } from "lucide-react";

export interface HighlightPhoto {
  id: string;
  friendName: string;
  thumbnailUrl: string;
  mediumUrl: string;
  views: number;
  downloads: number;
  hype: number;
}

type StatKey = "views" | "downloads" | "hype";

interface HighlightsRowProps {
  title: string;
  statKey: StatKey;
  photos: HighlightPhoto[];
  onPhotoClick: (photo: HighlightPhoto) => void;
}

const STAT_ICON: Record<StatKey, typeof Eye> = {
  views: Eye,
  hype: Flame,
  downloads: Download,
};

export default function HighlightsRow({ title, statKey, photos, onPhotoClick }: HighlightsRowProps) {
  const StatIcon = STAT_ICON[statKey];

  if (photos.length === 0) {
    return null; // no data yet for this category — nothing to show, not an error
  }

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white/90">
        <StatIcon size={15} aria-hidden="true" />
        {title}
      </h2>

      <div
        className="highlights-row-scroll flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.highlights-row-scroll::-webkit-scrollbar { display: none; }`}</style>

        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onPhotoClick(photo)}
            aria-label={`Photo by ${photo.friendName}, ${photo[statKey]} ${statKey}`}
            className="flex-shrink-0 text-left"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-white/5">
              <Image
                src={photo.thumbnailUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
              <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[11px] text-white">
                <StatIcon size={11} aria-hidden="true" />
                {photo[statKey]}
              </span>
            </div>
            <p className="mt-1 max-w-[80px] truncate text-[11px] text-white/60">
              {photo.friendName}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}