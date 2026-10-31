<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Instructions for any AI coding agent working in this repository. Read this fully before making changes.

---

## 1. What this project is

A web app like Duolingo, but for studying college material.

The user imports course material (PDF, slides, pasted notes, or Markdown). The app converts it to Markdown, splits it into sections, uses Gemini to generate practice questions from those sections, and serves a fresh daily set of questions. Questions the user gets wrong come back sooner (spaced repetition).

**Core pipeline:**

```
Import -> Convert to Markdown -> Chunk by headings -> Generate questions (Gemini)
-> Store -> Build daily set -> Answer + grade -> Update review schedule
```

**Current scope:** single user (the owner). But every table still gets a `user_id` so login can be added later without a rewrite.

---

## 2. Who you are working with (important)

The owner is a **beginner programmer**. They want to understand the code, not just receive it. Therefore:

- **Explain before and after.** Before a task: say what you're about to do and why. After: summarize what changed in plain language.
- **Define jargon the first time you use it** (e.g. "serverless function", "ORM", "migration") in one short sentence.
- **Prefer simple, readable code** over clever code. Add short comments explaining *why* a non-obvious piece exists.
- **Small steps.** One feature or fix per task. Never rewrite large parts of the project unprompted.
- **If a requirement is ambiguous, ask** instead of guessing and building the wrong thing.
- **If you hit an error, explain what the error means** and which layer it came from (frontend, API route, database, Gemini call, deployment).

---

## 3. Tech stack (decided)

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict mode) |
| Styling / UI | Tailwind CSS, shadcn/ui components when needed |
| Hosting | Vercel |
| Database | Postgres (Supabase or Neon, see "Pending decisions") |
| DB access | Drizzle ORM (type-safe queries, migrations) |
| File storage | Vercel Blob or Supabase Storage (uploaded PDFs) |
| AI | Google Gemini API, via the official Google Gen AI SDK for TypeScript |
| Validation | Zod |
| Spaced repetition | `ts-fsrs` (do not write our own algorithm) |
| Markdown + math rendering | `react-markdown`, `remark-math`, `rehype-katex` |
| Scheduling | Vercel Cron Jobs calling an API route |

**Before installing any package or using an SDK, check its current official documentation.** Package names and APIs change. Do not rely on memory for exact function names or versions.

**Do not add a new dependency without asking the owner first.** State what it does and why it's needed.

---

## 4. Target project structure

```
src/
  app/                      # routes: pages and API route handlers
    (app)/
      dashboard/            # today's set, streak, quick stats
      courses/              # courses and their materials
      session/              # answering questions one at a time
      progress/             # stats by topic
      settings/
    api/
      cron/daily/           # called by Vercel Cron to build daily sets
      materials/            # upload / convert / chunk endpoints
      questions/            # generate / grade / flag endpoints
  components/               # reusable UI pieces
  lib/
    ai/                     # ALL Gemini calls live here and nowhere else
    db/                     # schema, client, query helpers
    srs/                    # thin wrapper around ts-fsrs
    markdown/               # chunking and cleanup helpers
    env.ts                  # validated environment variables
  types/
```

Keep to this layout unless there is a good reason to change it. If you change it, say why.

---

## 5. Commands

```bash
npm run dev          # start local dev server
npm run build        # production build (must pass before deploying)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit  (add this script if missing)
```

Database commands (migrations, studio) will be added when the database milestone starts. Document them here once they exist.

**Before telling the owner a task is done, run `typecheck`, `lint`, and `build`, and report the results honestly.** If something fails, say so and explain.

---

## 6. Architecture rules (read carefully)

### 6.1 Vercel is serverless
Backend code runs as short-lived functions. Therefore:
- **Never write files to the local disk** expecting them to persist. Use the database or file storage.
- **Keep every request short.** Long work (converting a big PDF, generating many questions) must be split into small jobs. Save progress and a `status` in the database. Never do one giant function call.
- Do not use tools that need a long-running server or heavy local installs (e.g. Python-based PDF converters). PDF-to-Markdown is done by sending the PDF to Gemini.
- Check Vercel's current function time limits and cron limits in the docs before designing a long job.

### 6.2 Gemini calls: server-side only
- All Gemini code lives in `src/lib/ai/`. UI components never call Gemini directly.
- The API key is read from an environment variable on the server only. **Never expose it to client code** (no `NEXT_PUBLIC_` prefix, never imported in a client component).
- The model name comes from an environment variable (`GEMINI_MODEL`), not hardcoded, so it can be swapped easily.

### 6.3 Structured output + validation
- Ask Gemini for **JSON that matches a schema**, and validate every response with **Zod** before using or saving it.
- If validation fails: retry once. If it fails again, discard that result and log the reason. Never save unvalidated AI output.

### 6.4 Grounded questions
- Question generation must use **only the provided material**. Every generated question includes a short verbatim `source_quote` from the material that supports the answer.
- Every question stores which chunk it came from, so the owner can check it.
- Math must be written in LaTeX (`$...$` inline, `$$...$$` block) and rendered with KaTeX.
- Questions are written in the **same language as the source material**.

### 6.5 Cost and safety guards
- Enforce a daily generation cap (`DAILY_GENERATION_CAP` env var). A bug must never be able to loop API calls endlessly.
- Add basic rate limiting or caps to any endpoint that triggers a Gemini call.
- Don't regenerate questions for a chunk that already has them unless explicitly requested.

### 6.6 Time and "daily"
- "Today" depends on the user's timezone. Store a timezone setting and compute day boundaries from it. Don't use the server's date blindly.

### 6.7 Always keep a buffer
- Keep more unused questions in the pool than a day needs, so a failed or rate-limited API call never leaves the owner with an empty day.

---

## 7. Data model (summary)

All tables have `id`, `user_id`, `created_at`.

- **courses**: name.
- **materials**: course_id, title, source type (pdf / paste / markdown), file URL, `status` (`uploaded` | `converting` | `ready` | `failed`), `markdown`, error message.
- **chunks**: material_id, heading, content, order index, page range (if known).
- **questions**: chunk_id, type (`mcq` | `short_answer` | later `worked`), prompt, choices (JSON), correct answer, explanation, source_quote, difficulty (`easy` | `medium` | `hard`), `flagged` boolean.
- **attempts**: question_id, user answer, `is_correct`, answered_at. Permanent history, never overwritten.
- **review_state**: question_id, FSRS fields (due date, stability, difficulty, reps, lapses). Can be recalculated; attempts are the source of truth.
- **daily_sets**: date, list of question ids, completed boolean. Drives streaks.

Use Drizzle migrations for every schema change. Never edit the database by hand without recording it as a migration.

---

## 8. Security and secrets

- Secrets live in `.env.local` (local) and Vercel Environment Variables (deployed). **Never commit secrets.**
- Maintain `.env.example` listing every variable name with fake values.
- Validate environment variables at startup in `src/lib/env.ts` so missing ones fail loudly.
- Validate all user input (including uploaded files: type and size limits) on the server.
- Cron endpoints must verify the request actually came from Vercel Cron (shared secret check).

---

## 9. Code conventions

- TypeScript strict mode. No `any` unless unavoidable, and then comment why.
- Server Components by default; add `"use client"` only where interactivity requires it.
- Name things clearly. Prefer descriptive names over short ones.
- Handle errors visibly: show the user a helpful message and log the details server-side. No silent failures.
- Keep functions small and single-purpose.
- No dead code or commented-out blocks left behind.

---

## 10. How to work (workflow rules)

1. **Plan first.** For any task bigger than a tiny fix, reply with a short plan (files to create/change, what each does) and wait for approval before coding.
2. **One milestone at a time** (see below). Do not start the next one without being asked.
3. **Don't touch unrelated code.** If you notice a problem elsewhere, mention it; don't fix it silently.
4. **Suggest a Git commit** (with a clear message) after each working step, so changes are easy to undo.
5. **Be honest about uncertainty.** If you're not sure an API works the way you remember, check the docs or say so.
6. **After finishing, update the milestone checklist below** and summarize what was built and what to test manually.

---

## 11. Milestones

Work through these in order. Mark `[x]` when done.

- [ ] **M0, Skeleton:** Next.js + TS project, pushed to GitHub, deployed on Vercel, Gemini key set as env var. *Done when:* the live URL has a button that calls Gemini and shows the reply.
- [ ] **M1, Core loop (no database):** paste Markdown -> generate ~10 MCQs -> answer them -> score + explanations. Math renders.
- [ ] **M2, Persistence:** database added; materials, chunks, questions, attempts are saved.
- [ ] **M3, PDF import:** upload -> storage -> Gemini converts to Markdown (with LaTeX math and page markers) -> preview and edit page.
- [ ] **M4, Courses and chunking:** organize by course/topic, split by headings, generate per chunk with visible status.
- [ ] **M5, Daily engine:** daily set builder, Vercel Cron, FSRS scheduling, streak.
- [ ] **M6, Better questions:** short-answer grading by Gemini, worked problems, flag/report bad question flow.
- [ ] **M7, Polish:** XP/levels, stats by topic, authentication if sharing with others.

---

## 12. Definition of done (for any task)

- Code compiles: `typecheck`, `lint`, `build` all pass.
- Feature works when tested manually (describe the steps to test it).
- No secrets in the code or commits.
- Explained to the owner in plain language: what changed and why.
- Checklist in section 11 updated.

---

## 13. Do not

- Do not call Gemini from client-side code.
- Do not hardcode API keys or the model name.
- Do not save AI output that failed validation.
- Do not write to local disk expecting persistence.
- Do not add dependencies, change the stack, or restructure folders without asking.
- Do not build features from later milestones early.
- Do not claim something works without having run it.

---

## 14. Pending decisions (ask the owner before assuming)

- Database/auth provider: Supabase (all-in-one) vs Neon + separate auth. Default recommendation: Supabase.
- Whether the app stays single-user or opens to classmates (affects auth, cost limits).
- Exact daily set size and mix of new vs review questions (default: 10 questions, due reviews first).
