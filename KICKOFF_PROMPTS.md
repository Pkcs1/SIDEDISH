# Kickoff prompts

Paste these into your coding agent **one at a time, in order**. Finish and test each milestone (and commit to Git) before moving to the next.

Put `AGENTS.md` in the root of your repo first. Every prompt tells the agent to read it.

---

## Prompt 1: Milestone 0 (Skeleton)

```
You are helping me build a web app that turns college study material into daily practice questions (like Duolingo, but for my courses). I'm a beginner programmer, so I want to understand what you build.

First, read AGENTS.md in the repo root completely. Follow every rule in it.

Task: Milestone 0 (Skeleton).

STEP 1: Before writing any code, reply with a short plan: which commands you'll run, which files you'll create, and what each one does in plain language. Then wait for my approval.

STEP 2 (after I approve): 
- Create a Next.js project (App Router, TypeScript strict, Tailwind, ESLint, `src/` directory).
- Install the official Google Gen AI SDK for TypeScript and Zod. Check the current official docs for the exact package name and usage before installing.
- Create `src/lib/env.ts` that validates environment variables (GEMINI_API_KEY, GEMINI_MODEL) with Zod and fails with a clear message if one is missing.
- Create `.env.example` with fake placeholder values. Make sure `.env.local` is ignored by Git.
- Create `src/lib/ai/client.ts` that sets up the Gemini client (server-side only).
- Create one page with a single button: "Test Gemini". Clicking it calls a server-side API route that sends a short fixed prompt to Gemini and returns the reply, which the page displays. Show a loading state and a readable error message if it fails.
- Add a `typecheck` script (`tsc --noEmit`) to package.json.

STEP 3: Explain to me, file by file, what you created and why. Define any jargon.

STEP 4: Give me beginner-friendly instructions for: pushing the project to GitHub, connecting the repo to Vercel, and adding the environment variables in the Vercel dashboard. Tell me how to verify the deployed site works.

Acceptance criteria:
- `npm run typecheck`, `npm run lint`, and `npm run build` all pass (run them and show me the results).
- The button works locally.
- The API key never appears in client-side code.
- AGENTS.md checklist: M0 marked done only after I confirm the live Vercel URL works.

Do not build anything beyond this. No database, no uploads, no styling beyond basic.
```

---

## Prompt 2: Milestone 1 (Core loop, no database)

```
Read AGENTS.md again, then do Milestone 1 (Core loop, no database).

Goal: I paste a section of study material (Markdown or plain text), choose how many questions I want, and the app generates multiple-choice questions from it. I answer them one at a time, get instant feedback with an explanation, and see a score at the end. Nothing is saved yet; state lives in the browser session only.

STEP 1: Reply with a plan first (files, data shapes, flow) and wait for my approval.

STEP 2 (after approval), build:

1. A page with a large text area, a "number of questions" input (default 10, max 20), and a "Generate" button.

2. A server-side function in `src/lib/ai/generateQuestions.ts` that:
   - Takes the material text and the number of questions.
   - Calls Gemini with the system prompt below, requesting JSON that matches the schema below.
   - Validates the response with Zod. On failure, retries once; on a second failure, returns a clear error.

3. Zod schema for one question:
   - `type`: "mcq"
   - `prompt`: string (may contain LaTeX)
   - `choices`: array of exactly 4 strings
   - `correctIndex`: number 0-3
   - `explanation`: string
   - `sourceQuote`: string (short verbatim excerpt from the material)
   - `difficulty`: "easy" | "medium" | "hard"

4. A quiz UI: one question at a time, click a choice, immediately show right/wrong, the explanation, and the source quote. "Next" button. Final screen with score and a list of what I got wrong.

5. Render Markdown and math (LaTeX via KaTeX) in prompts, choices, and explanations.

6. Guards: cap the input text length (tell me the limit you chose and why), enforce a max questions limit, and show friendly errors.

System prompt to use for generation (put it in its own constant so it's easy to edit):

"""
You are an expert university exam question writer. You will receive one section of course material in Markdown.

Write exactly {n} multiple-choice practice questions based ONLY on that material.

Rules:
- Every question must be answerable using the provided text. Do not introduce facts, definitions, or notation that are not in the material.
- Test understanding, not trivia. Prefer "why", "which applies", and "what follows" over copying a sentence.
- Mix difficulty: roughly one third easy, one third medium, one third hard.
- Each question has exactly 4 choices and exactly one correct answer.
- Wrong choices must be plausible and reflect common misconceptions or typical mistakes, not obviously silly options.
- The explanation must say why the correct answer is right and briefly why the others are wrong.
- "sourceQuote" must be a short verbatim excerpt (under 25 words) copied from the material that supports the answer.
- Write math in LaTeX: $...$ inline and $$...$$ for blocks.
- Write in the same language as the material.
- If the material is too short or thin to support {n} good questions, return fewer questions instead of inventing content.
- Do not repeat the same idea across questions.
"""

STEP 3: Explain in plain language how data flows from my text box to Gemini and back to the screen, and what Zod is doing in the middle.

Acceptance criteria:
- I can paste notes, generate questions, finish a quiz, and see my score.
- Math displays correctly.
- Bad or invalid AI output never crashes the app; it shows a friendly message.
- typecheck, lint, and build pass.
- No client-side code touches the API key.

Do not add a database, accounts, file upload, or the daily system yet.
```

---

## Reusable template for later milestones (M2 to M7)

```
Read AGENTS.md again. We are now on Milestone [N]: [name].

Goal: [one or two sentences describing what should work when this is done]

Before coding:
1. Tell me which files and tables will be created or changed, and why.
2. Flag anything that's ambiguous or any decision you need from me.
3. Wait for my approval.

While coding:
- Follow every rule in AGENTS.md (especially: serverless limits, Gemini server-side only, Zod validation, no new dependencies without asking).
- Keep changes limited to this milestone.

When done:
- Run typecheck, lint, and build and show me the real results.
- Explain in plain language what you built and why, and define any new jargon.
- Give me step-by-step manual test instructions.
- Suggest a Git commit message.
- Update the milestone checklist in AGENTS.md.

Acceptance criteria:
- [list specific, testable things]
```

---

## Tips for using these

- If the agent builds something you don't understand, ask: "Explain this file as if I've never seen code, and tell me what would break if I deleted it."
- If the agent starts adding things you didn't ask for, reply: "Stop. Re-read AGENTS.md section 10 and 13, and stay within this milestone."
- Commit to Git after every working step. If an AI edit breaks something, you can roll back.
