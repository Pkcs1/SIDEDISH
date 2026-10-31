import { GoogleGenAI } from "@google/genai";
import { getEnv } from "@/lib/env";

/**
 * Creates a server-side Gemini client using the validated API key.
 * All Gemini API calls in this project must live inside src/lib/ai/
 * and run only on the server so the API key is never exposed to the browser.
 */
export function createGeminiClient(): {
  client: GoogleGenAI;
  model: string;
} {
  const env = getEnv();

  const client = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  return {
    client,
    model: env.GEMINI_MODEL,
  };
}

/**
 * Sends a short fixed prompt to Gemini to verify our API key and connection work.
 */
export async function generateTestReply(): Promise<string> {
  const { client, model } = createGeminiClient();

  const interaction = await client.interactions.create({
    model,
    input:
      "Say hello in one short, encouraging sentence to a college student who just connected their study app to Gemini!",
  });

  const reply = interaction.output_text?.trim();

  if (!reply) {
    throw new Error("Gemini returned an empty response.");
  }

  return reply;
}
