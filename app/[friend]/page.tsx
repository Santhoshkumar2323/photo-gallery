import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";

interface FriendPageProps {
  params: Promise<{ friend: string }>;
}

function displayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function FriendPage({ params }: FriendPageProps) {
  const { friend } = await params;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-white/60"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back
      </Link>

      <h1 className="mb-6 text-xl font-medium text-white">{displayName(friend)}</h1>

      <PhotoGrid friendName={friend} />
    </main>
  );
}