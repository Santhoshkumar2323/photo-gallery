import Link from "next/link";

interface FriendTabsProps {
  friends: string[];
}

const PALETTE = ["#B85C7A", "#4C7FA8", "#3F8C6E", "#C08A3E", "#6E69A8", "#B4534F"];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function FriendTabs({ friends }: FriendTabsProps) {
  if (friends.length === 0) {
    return (
      <p className="text-sm text-muted">
        No photos uploaded yet — run the upload script to get started.
      </p>
    );
  }

  return (
    <div
      className="friend-tabs-scroll flex gap-4 overflow-x-auto pb-2"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style>{`.friend-tabs-scroll::-webkit-scrollbar { display: none; }`}</style>

      {friends.map((name, i) => (
        <Link
          key={name}
          href={`/${name}`}
          aria-label={`Gallery for ${name}`}
          className="animate-fade-rise group flex flex-shrink-0 flex-col items-center gap-2 text-center"
          style={{ "--delay": `${i * 60}ms` } as React.CSSProperties}
        >
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-medium text-white ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:ring-[var(--gold)] group-hover:shadow-[0_0_16px_var(--gold-glow)]"
            style={{ backgroundColor: colorForName(name) }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[72px] truncate text-xs text-muted transition-colors group-hover:text-[var(--text)]">
            {name}
          </span>
        </Link>
      ))}
    </div>
  );
}