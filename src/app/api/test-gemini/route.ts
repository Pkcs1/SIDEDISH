import { NextResponse } from "next/server";
import { generateTestReply } from "@/lib/ai/client";

/**
 * POST /api/test-gemini
 * Runs on the server only. Calls our Gemini helper in src/lib/ai/client.ts
 * and returns either { reply } or a readable { error } message.
 */
export async function POST() {
  try {
    const reply = await generateTestReply();
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in POST /api/test-gemini:", error);

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while contacting Gemini.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
