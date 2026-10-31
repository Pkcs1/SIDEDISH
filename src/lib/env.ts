import { z } from "zod";

/**
 * Zod schema that defines the exact environment variables our server requires.
 * Using .trim().min(1, ...) ensures both missing (undefined) and blank ("")
 * values fail with a clear, human-readable message.
 */
const envSchema = z.object({
  GEMINI_API_KEY: z
    .string()
    .trim()
    .min(
      1,
      "GEMINI_API_KEY is missing. Add it to .env.local (for local development) or Vercel Environment Variables."
    )
    .refine(
      (val) => val !== "your-gemini-api-key-here",
      "GEMINI_API_KEY is still set to the placeholder value ('your-gemini-api-key-here'). Replace it with your real Gemini API key in .env.local."
    ),
  GEMINI_MODEL: z
    .string()
    .trim()
    .min(
      1,
      "GEMINI_MODEL is missing. Add it to .env.local (e.g. GEMINI_MODEL=\"gemini-3.8-flash\") or Vercel Environment Variables."
    ),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates and returns the server environment variables.
 * Throws a readable error listing every missing variable if validation fails.
 */
export function getEnv(): Env {
  const parsed = envSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
    GEMINI_MODEL: process.env.GEMINI_MODEL ?? "",
  });

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => `- ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid or missing environment variables:\n${errorMessages}`
    );
  }

  return parsed.data;
}
