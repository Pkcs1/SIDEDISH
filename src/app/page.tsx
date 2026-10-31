"use client";

import { useState } from "react";

export default function HomePage() {
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleTestGemini() {
    setIsLoading(true);
    setReply(null);
    setError(null);

    try {
      const response = await fetch("/api/test-gemini", {
        method: "POST",
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? `Request failed with status ${response.status}`);
        return;
      }

      setReply(data.reply ?? "Received an empty response.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the server. Please check if the dev server is running."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 text-zinc-900">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">Study App — Milestone 0</h1>
        <p className="text-sm text-zinc-600">
          Click the button below to test the server-side connection to Gemini.
        </p>

        <button
          type="button"
          onClick={handleTestGemini}
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? "Testing Gemini..." : "Test Gemini"}
        </button>

        {reply && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <p className="font-medium">Gemini Reply:</p>
            <p className="mt-1 whitespace-pre-wrap">{reply}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            <p className="font-medium">Error:</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
