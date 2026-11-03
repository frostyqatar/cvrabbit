# CVRabbit

A private, mobile-first CV editor and PDF generator. Upload an existing PDF or DOCX, review the extracted sections, refine them in a calm structured editor, and generate a polished A4 PDF from seven distinct designs.

CVRabbit is not an AI CV writer. It does not invent, rewrite, or suggest content. Extraction only reorganises text that is already in the uploaded document.

---

## What is included

- **Supabase authentication** with Google OAuth and a secure email-link fallback.
- **Per-user CV storage** in Postgres with row-level security.
- **Private original-file storage** in a non-public Supabase Storage bucket.
- **Automatic saving** with debounced writes, offline detection, retry backoff, and a local recovery copy.
- **Multiple CVs** per account: create, upload, rename, duplicate, switch, and delete.
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

### 2. Connect the existing CRGT Supabase project

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<crgt-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Do not add a service-role key to the browser build. The app only uses the public key; RLS and Storage policies enforce ownership.

### 3. Apply the schema

Open the Supabase SQL editor for the **CRGT** project and run:

`supabase/migrations/20261103000100_cvrabbit_init.sql`

This creates:

- `public.cvs`
- owner-only RLS policies for select, insert, update, and delete
- the `touch_cv` trigger for `updated_at` and `revision`
- the private `cv-originals` storage bucket
- owner-folder storage policies for read, upload, update, and delete

The bucket is private. CVRabbit never calls `getPublicUrl` for uploaded originals.

### 4. Authentication

**Google (primary):** enable the Google provider in the CRGT project's Authentication settings and add the project's callback URL:

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

1. **Parser tests** against four synthetic PDFs:
   - one-page simple CV
   - detailed two-page CV
   - long multi-section CV
   - two-column CV
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

The app is Vercel-ready.

```bash
vercel --prod
```

Add these environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then add the production domain to Supabase Authentication → URL Configuration:

```
Site URL: https://your-domain.example
Redirect URLs: https://your-domain.example/auth/callback
```

Google OAuth must also allow the Supabase callback URL. No secrets are committed to the repository.

---

## Privacy model

- Every `cvs` query is filtered by both `user_id` and RLS.
- `auth.uid() = user_id` is required for select, insert, update, and delete.
- Original files live at `{user_id}/{cv_id}/original.{pdf|docx}` in a private bucket.
- Storage object policies allow access only when the first folder equals `auth.uid()`.
- Deleting a CV removes the original object and the database row.
- Uploaded files are read on the user's device; only the original file is uploaded for safekeeping.
- No analytics, advertising, or AI processing is included.
- Local drafts live in the browser's `localStorage` and are removed after a successful save.

---

## Project layout

```
src/
  app/                 routes for landing, login, dashboard, editor, auth callback
  components/
    app/               shared application chrome
    auth/              login flow
    brand/             logo and Google mark
    dashboard/         CV list, upload and extraction review
    editor/            structured editor, autosave UI, generation panel
    templates/         PDF document and visual template thumbnails
    ui/                shadcn-style primitives
  lib/
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
- DOCX support covers standard Word documents; legacy `.doc` files are rejected with a clear message.
- The editor is intentionally not a free-form canvas; it keeps CV data structured so every template can render reliably.
- PDF generation happens in the browser, which keeps the document on the user's device and avoids a server-side rendering dependency.

---

## License

Private project for CVRabbit. Synthetic fixtures are included for testing only.
