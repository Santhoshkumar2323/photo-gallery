"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PhotoTile, { type GridPhoto } from "@/components/PhotoTile";
import Lightbox from "@/components/Lightbox";

interface PhotoGridProps {
  friendName: string;
}

interface HypeState {
  count: number;
  hasHyped: boolean;
}

export default function PhotoGrid({ friendName }: PhotoGridProps) {
  const [photos, setPhotos] = useState<GridPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [hypeOverrides, setHypeOverrides] = useState<Record<string, HypeState>>({});

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  const isInitialLoad = page === 1 && photos.length === 0 && !error;

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      loadingRef.current = true;
      setIsLoadingMore(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/photos?friend=${encodeURIComponent(friendName)}&page=${pageToLoad}`
        );
        if (!response.ok) throw new Error("Failed to load photos.");

        const body = await response.json();
        setPhotos((prev) => [...prev, ...body.photos]);
        setHasMore(body.hasMore);
        hasMoreRef.current = body.hasMore;
      } catch (err) {
        console.error("PhotoGrid load failed:", err);
        setError("Couldn't load photos right now.");
      } finally {
        loadingRef.current = false;
        setIsLoadingMore(false);
      }
    },
    [friendName]
  );

  const triggerNextPageLoad = useCallback(() => {
    if (hasMoreRef.current && !loadingRef.current) {
      const nextPage = pageRef.current + 1;
      pageRef.current = nextPage;
      setPage(nextPage);
      loadPage(nextPage);
    }
  }, [loadPage]);


  useEffect(() => {
    if (loadingRef.current) return;

    setPhotos([]);
    setPage(1);
    setHasMore(true);
    setHypeOverrides({});
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadPage(1);
  }, [friendName]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          triggerNextPageLoad();
        }
      },
      { rootMargin: "600px" } // Slightly boosted window threshold for smoother fetching on tall monitors
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [triggerNextPageLoad, isLoadingMore, photos.length]);

  function getHypeState(photo: GridPhoto): HypeState {
    return hypeOverrides[photo.id] ?? { count: photo.hype, hasHyped: false };
  }

  function handleHyped(photoId: string, newCount: number) {
    setHypeOverrides((prev) => ({ ...prev, [photoId]: { count: newCount, hasHyped: true } }));
  }

  function handleHypeFailed(photoId: string) {
    setHypeOverrides((prev) => {
      const current = prev[photoId];
      if (!current) return prev;
      return { ...prev, [photoId]: { count: current.count - 1, hasHyped: false } };
    });
  }

  return (
    <div>
      {isInitialLoad && <p className="text-sm text-white/50">Loading...</p>}

      {!isInitialLoad && photos.length === 0 && !error && (
        <p className="text-sm text-white/50">No photos here yet.</p>
      )}

      {error && photos.length === 0 && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {photos.length > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
        >
          {photos.map((photo, index) => {
            const hypeState = getHypeState(photo);
            return (
              <PhotoTile
                key={photo.id}
                photo={photo}
                onClick={() => setLightboxIndex(index)}
                hypeCount={hypeState.count}
                hasHyped={hypeState.hasHyped}
                onHyped={(newCount) => handleHyped(photo.id, newCount)}
                onHypeFailed={() => handleHypeFailed(photo.id)}
              />
            );
          })}
        </div>
      )}

      {/* Kept as a simple structural spacer so it triggers smoothly without flashing visible blocks */}
      <div ref={sentinelRef} className="h-1 w-full" />

      {isLoadingMore && photos.length > 0 && (
        <p className="mt-3 text-center text-xs text-white/40">Loading more...</p>
      )}

      {error && photos.length > 0 && (
        <p className="mt-3 text-center text-xs text-red-400">{error}</p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onLoadMore={triggerNextPageLoad} 
          hypeOverrides={hypeOverrides}
          onHype={handleHyped}
          onHypeFailed={handleHypeFailed}
        />
      )}
    </div>
  );
}
