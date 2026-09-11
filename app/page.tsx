"use client";

import { useEffect, useState } from "react";
import FriendTabs from "@/components/FriendTabs";
import HighlightsRow, { type HighlightPhoto } from "@/components/HighlightsRow";
import Lightbox from "@/components/Lightbox";

interface HighlightsData {
  mostViewed: HighlightPhoto[];
  mostHyped: HighlightPhoto[];
  mostDownloaded: HighlightPhoto[];
}

type Tab = "gallery" | "highlights";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("gallery");
  const [friends, setFriends] = useState<string[] | null>(null);
  const [highlights, setHighlights] = useState<HighlightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lightboxState, setLightboxState] = useState<{
    photos: HighlightPhoto[];
    index: number;
  } | null>(null);

  function openLightbox(photos: HighlightPhoto[], clickedPhoto: HighlightPhoto) {
    const index = photos.findIndex((p) => p.id === clickedPhoto.id);
    setLightboxState({ photos, index: index === -1 ? 0 : index });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [friendsRes, highlightsRes] = await Promise.all([
          fetch("/api/friends", { cache: "no-store" }),
          fetch("/api/highlights", { cache: "no-store" }),
        ]);

        if (!friendsRes.ok || !highlightsRes.ok) {
          throw new Error("One or more dashboard requests failed.");
        }

        const friendsBody = await friendsRes.json();
        const highlightsBody = await highlightsRes.json();

        if (!cancelled) {
          setFriends(friendsBody.friends);
          setHighlights(highlightsBody);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard load failed:", err);
          setError("Couldn't load the gallery right now. Try refreshing.");
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = friends === null || highlights === null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-medium tracking-wide text-[var(--text)]">
        {activeTab === "gallery" ? "Our gallery" : "Highlights"}
      </h1>

      <div className="mb-10 flex gap-6 border-b border-white/10">
        <TabButton active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")}>
          Our gallery
        </TabButton>
        <TabButton active={activeTab === "highlights"} onClick={() => setActiveTab("highlights")}>
          Highlights
        </TabButton>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {isLoading && !error && (
        <p className="text-sm text-muted">Loading...</p>
      )}

      {!isLoading && !error && activeTab === "gallery" && (
        <div className="animate-fade-rise">
          <FriendTabs friends={friends} />
        </div>
      )}

      {!isLoading && !error && activeTab === "highlights" && (
        <div className="animate-fade-rise flex flex-col gap-8">
          <HighlightsRow
            title="Most viewed"
            statKey="views"
            photos={highlights.mostViewed}
            onPhotoClick={(photo) => openLightbox(highlights.mostViewed, photo)}
          />
          <HighlightsRow
            title="Most hyped"
            statKey="hype"
            photos={highlights.mostHyped}
            onPhotoClick={(photo) => openLightbox(highlights.mostHyped, photo)}
          />
          <HighlightsRow
            title="Most downloaded"
            statKey="downloads"
            photos={highlights.mostDownloaded}
            onPhotoClick={(photo) => openLightbox(highlights.mostDownloaded, photo)}
          />
        </div>
      )}

      {lightboxState && (
        <Lightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState(null)}
        />
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative pb-3 text-sm font-medium transition-colors ${
        active ? "text-[var(--gold)]" : "text-muted hover:text-[var(--text)]"
      }`}
    >
      {children}
      <span
        className={`absolute bottom-0 left-0 h-[2px] w-full bg-[var(--gold)] transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}