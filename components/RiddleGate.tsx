"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const RIDDLE_QUESTION =
  "Rajasekar, Sagura appo Dayalan Kaathula etho sonnaney athu ennanu unnaku theiryuma?";

export default function RiddleGate() {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || answer.trim().length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "That's not quite right. Try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-rise w-full max-w-sm surface-card rounded-2xl p-8">
      <div className="mb-6 flex justify-center">
        <span className="h-px w-10 bg-[var(--gold)]" aria-hidden="true" />
      </div>

      <h1 className="mb-3 text-center text-xl font-medium tracking-wide text-[var(--text)]">
        Before you come in...
      </h1>
      <p className="mb-8 text-center text-sm leading-relaxed text-muted">
        {RIDDLE_QUESTION}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor="riddle-answer" className="sr-only">Your answer</label>
        <input
          id="riddle-answer"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer"
          autoComplete="off"
          autoFocus
          disabled={isSubmitting}
          className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-[var(--text)] placeholder-white/30 outline-none transition-colors focus:border-[var(--gold)] disabled:opacity-50"
        />

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || answer.trim().length === 0}
          className="mt-2 rounded-lg bg-[var(--gold)] px-4 py-3 font-medium text-black transition-all hover:brightness-110 hover:glow-gold disabled:opacity-40 disabled:hover:brightness-100"
        >
          {isSubmitting ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}