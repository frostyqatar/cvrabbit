# CVRabbit

A private, mobile-first CV editor and PDF generator. Upload an existing PDF or DOCX, review the extracted sections, refine them in a calm structured editor, and generate a polished A4 PDF from seven distinct designs.

Extraction never invents content. As an optional extra, you can connect your own OpenAI, Claude, DeepSeek, or Gemini key and let that model rewrite the extracted text into stronger, cleaner sections. CVRabbit does not supply the model, store your key, or keep the result anywhere except your own private CV record.

---

## What is included

- **Supabase authentication** with Google OAuth and a secure email-link fallback.
- **Per-user CV storage** in Postgres with row-level security.
- **Private original-file storage** in a non-public Supabase Storage bucket.
- **Automatic saving** with debounced writes, offline detection, retry backoff, and a local recovery copy.
- **Multiple CVs** per account: create, upload, rename, duplicate, switch, and delete.
- **Optional AI-assisted import** with your own provider key: choose OpenAI, Claude, DeepSeek, or Gemini, then get a rewritten, fully structured CV that preserves every fact.
- **Clear all fields** with two separate confirmation dialogs.
- **Structured editor** for personal details, unlimited experience and education entries, nested skill categories → skills → tasks, and optional additional sections.
- **Seven PDF templates**: Classic Professional, Modern Minimalist, Executive, Corporate, Creative, Compact, and ATS-Friendly.
- **Live PDF preview** generated from the same document component as the download, so the preview and file match.
- **Customisation** for template, accent colour, typeface, density, section visibility, and section order.
- **Mobile-first UI** with sticky section navigation, safe-area aware action bars, and a full-screen generation panel on small screens.
- **No public file URLs** and no sharing of data between accounts.

---

## Stack

- Next.js 16 (App Router, Turbopack) and React 19
- TypeScript
- Tailwind CSS v4 with shadcn-style primitives
- Supabase Auth, Postgres, Storage, and Row Level Security
- `@react-pdf/renderer` for selectable-text PDF generation
- `react-pdf` / PDF.js for the canvas preview
- `pdfjs-dist` and Mammoth for on-device PDF/DOCX extraction
- Zustand + Immer for editor state
- Sonner for concise save and error feedback

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Connect the CVRabbit Supabase project

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cpjxavwhlwnxejacbwnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Do not add a service-role key to the browser build. The app only uses the public key; RLS and Storage policies enforce ownership.

### 3. Apply the schema

Open the Supabase SQL editor for the **CVRabbit** project and run:

`supabase/migrations/20261103000100_cvrabbit_init.sql`

This creates:

- `public.cvs`
- owner-only RLS policies for select, insert, update, and delete
- the `touch_cv` trigger for `updated_at` and `revision`
- the private `cv-originals` storage bucket
- owner-folder storage policies for read, upload, update, and delete

The bucket is private. CVRabbit never calls `getPublicUrl` for uploaded originals.

### 4. Authentication

**Google (primary):** enable the Google provider in the CVRabbit project's Authentication settings and add the project's callback URL:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

Then add your Google OAuth client ID and secret in Supabase. The app uses PKCE and redirects through `/auth/callback`.

**Email link (fallback):** the login screen also supports Supabase magic links. This is useful when Google has not been configured yet or when a user prefers email. Magic-link emails require Supabase's email provider or custom SMTP to be configured.

If Google is not enabled, the login screen explains the problem and offers the email fallback instead of failing silently.

### 5. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Design system

The exact palette is defined in `src/app/globals.css`:

| Token | Hex | Use |
| --- | --- | --- |
| Onyx | `#000f08` | Primary ink, dark surfaces |
| Jet Black | `#1c3738` | Primary buttons, active navigation |
| Charcoal | `#4d4847` | Secondary text |
| Mint Cream | `#f4fff8` | Page background |
| Cool Steel | `#8baaad` | Accents, focus rings, rails |

Typography is Manrope for UI and Instrument Serif for display. PDFs use bundled Lato, Spectral, and Crimson Text files under `public/fonts`, so generation does not depend on a third-party font service at runtime.

---

## PDF generation

`src/components/templates/cv-document.tsx` is the single source of truth for the PDF. The preview and download both call `generateCvBlob()`, which renders this component with `@react-pdf/renderer`.

- A4 page size
- selectable and searchable text
- real link annotations for email, phone, LinkedIn, portfolio, and project links
- automatic page wrapping
- section heading groups kept with their first content block
- skill categories kept together when reasonably sized
- no images, icons, or decorative graphics in the ATS template
- only non-empty fields are rendered

The ATS template deliberately avoids letter-spaced headings and decorative rules so automated parsers see clean text.

---

## AI-assisted import (optional)

The import dialog offers three paths: read the file locally, let an AI model rewrite it, or start blank. AI import is entirely opt-in and uses the user's own provider account.

- **Providers and models** (verified 3 November 2026): OpenAI GPT-6.1 Terra, GPT-6.1 Sol, GPT-6 Luna; Claude Sonnet 5.5, Haiku 5.5, Opus 5.5; DeepSeek V4.1 Flash and V4 Pro; Gemini 3.8 Flash, Gemini 4 Argon, Gemini 3.5 Flash-Lite.
- **Bring your own key.** The key is held in memory and, if the user ticks "Keep key in this tab", in `sessionStorage`. It is never written to Postgres, never included in CV rows, and never logged.
- **Only text leaves the device.** PDF/DOCX parsing still happens in the browser, and only the extracted text is posted to `/api/ai/extract`, which forwards it to the chosen provider. The original file is not sent.
- **Faithful rewriting.** The system prompt forbids inventing facts, metrics, employers, dates, or skills. It only improves phrasing: action-verb bullets, a factual 45–90 word summary, consistent dates, and clean section grouping.
- **Token safeguards.** The route requires an authenticated user, throttles to eight imports per ten minutes per account, caps input at 48,000 characters, caps output at 16,000–32,000 tokens depending on the provider, times out after 90 seconds, retries nothing automatically, and allows at most two manual AI attempts per import.
- **Recoverable output.** Model JSON is repaired rather than discarded: fenced output, leading commentary, unescaped newlines, trailing commas, wrapper objects, and output cut off by the token limit are all salvaged. If the reply is still unusable, the user can finish with the free local reading instead.

AI import never changes the privacy model of the CV itself: the result is saved to the same owner-only `cvs` row and can be edited field by field.

---

## Automatic saving

`src/lib/editor/use-autosave.ts`:

- debounces edits by roughly 900 ms
- avoids overlapping writes and queues a follow-up when content changes mid-save
- retries failed writes with exponential backoff
- shows **Saving…**, **Saved**, **Unable to save**, and **Offline** states
- stores a local draft after every change and removes it after a successful save
- offers an explicit restore/discard banner if a newer local draft is found
- flushes the latest edits before returning to the dashboard
- warns before closing the tab with unsaved changes

No field is mandatory. Empty sections and fields are excluded from the generated document.

---

## Testing

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

`npm run test` runs:

1. **Parser tests** against five synthetic PDFs:
   - one-page simple CV
   - detailed two-page CV
   - long multi-section CV
   - two-column CV
   - wrapped-line / split-bullet regression CV
2. **PDF tests** for all seven templates:
   - A4 size
   - selectable text
   - link annotations
   - content from every experience/education/additional block
   - compact density does not add pages
   - minimal and completely empty CVs render without crashing

Generate the fixtures again with:

```bash
npm run fixtures
```

All fixtures contain fictional people and organisations. No real CV data is committed.

The development-only `/design-lab` route provides a visual QA surface for every template and is disabled in production builds.

---

## Deployment

Production is deployed on Vercel:

```
https://cvrabbit.vercel.app
```

The GitHub repository is connected to the Vercel project, so a push to `main` produces a production deployment.

Environment variables in Vercel (Production, Preview, and Development):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Supabase Authentication → URL Configuration must contain:

```
Site URL: https://cvrabbit.vercel.app
Redirect URLs:
https://cvrabbit.vercel.app/auth/callback
https://cvrabbit.vercel.app/auth/confirm
https://cvrabbit.vercel.app/**
http://localhost:3000/**
```

`/auth/callback` handles the PKCE code exchange used by Google and the default email link. `/auth/confirm` is a fallback for Supabase email templates that send `{{ .TokenHash }}` directly.

Google OAuth must also allow the Supabase callback URL:

```
https://cpjxavwhlwnxejacbwnc.supabase.co/auth/v1/callback
```

No secrets are committed to the repository. AI provider keys belong to each user and are supplied at import time.

---

## Privacy model

- Every `cvs` query is filtered by both `user_id` and RLS.
- `auth.uid() = user_id` is required for select, insert, update, and delete.
- Original files live at `{user_id}/{cv_id}/original.{pdf|docx}` in a private bucket.
- Storage object policies allow access only when the first folder equals `auth.uid()`.
- Deleting a CV removes the original object and the database row.
- Uploaded files are read on the user's device; only the original file is uploaded for safekeeping.
- No analytics or advertising are included.
- AI import is opt-in, uses the user's own provider key, and sends only extracted text. Keys are never persisted server-side.
- Local drafts live in the browser's `localStorage` and are removed after a successful save.

---

## Project layout

```
src/
  app/                 routes for landing, login, dashboard, editor, auth callbacks, AI import API
  components/
    app/               shared application chrome
    auth/              login flow
    brand/             logo and Google mark
    dashboard/         CV list, upload, AI import setup and extraction review
    editor/            structured editor, autosave UI, clear-all, generation panel
    templates/         PDF document and visual template thumbnails
    ui/                shadcn-style primitives
  lib/
    ai/                provider catalogue, prompt, JSON repair, browser client
    cv/                types, parsing, PDF extraction, sample data
    editor/            editor store and autosave hook
    pdf/               fonts, theme tokens, PDF generation
    supabase/          browser/server clients, data access, configuration
  proxy.ts             session refresh and route protection
supabase/migrations/   database, RLS, and storage policies
scripts/               fixture generation and automated parser/PDF tests
fixtures/              synthetic test CVs
```

---

## Known boundaries

- Scanned/image-only PDFs do not contain selectable text. CVRabbit keeps the original file and offers manual entry rather than pretending extraction succeeded.
- AI import requires the user's own provider key and account credit. Model line-ups change; the catalogue in `src/lib/ai/providers.ts` is the single place to update. Local reading is always available and free.
- DOCX support covers standard Word documents; legacy `.doc` files are rejected with a clear message.
- The editor is intentionally not a free-form canvas; it keeps CV data structured so every template can render reliably.
- PDF generation happens in the browser, which keeps the document on the user's device and avoids a server-side rendering dependency.

---

## License

Private project for CVRabbit. Synthetic fixtures are included for testing only.
