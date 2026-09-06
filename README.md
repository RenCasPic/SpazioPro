# SpazioPro — Visualize. Estimate. Build.

A design + estimating platform for **US** remodeling and construction. Take a
photo of a room, analyze it, visualize material changes, then generate a
professional **estimate** or **proposal** in USD based on quantities, materials,
labor, equipment, delivery, disposal, permits and **local sales tax**.

Fully **bilingual** (English `en-US` default, Español `es-US`) — and the estimate
PDF language is independent of the app UI language.

> This estimate is for planning purposes only. Actual costs may vary based on
> verified measurements, site conditions, material availability, supplier
> pricing, labor requirements, permits, and local taxes.

---

## Quick start (demo mode — no external services)

```bash
npm install
cp .env.example .env.local     # optional — demo mode works with nothing set
npm run dev                    # http://localhost:3000  → redirects to /en-US
npm test                       # 30 tests: imperial math, tax jurisdictions, snapshots, i18n
```

Demo account (pre-filled on the login screen): `demo@spaziopro.app` / `demo`.
Data is stored in the browser (localStorage); AI is simulated locally.

---

## Market: United States

| | |
| --- | --- |
| Currency | **USD** (`Intl.NumberFormat`, never hand-concatenated `$`) |
| Units | **Imperial** — ft, in, sq ft, linear ft, cu yd, gal. Stored internally in inches; presented in ft + in |
| Sales tax | **No national rate.** Resolved from the project's jurisdiction: ZIP → city → county → state (`lib/market/tax-service.ts`, `TaxService.getTaxRate`). 5 no-sales-tax states handled |
| Pricing | Per-state USD prices with supplier + availability + lead time. National fallback; never converted from other markets |
| Labor | US categories (Painting, Drywall, Flooring/Tile Installation, Framing, Cabinet/Countertop Installation, Electrical, Plumbing, HVAC, Demolition, Finish Carpentry, …) priced per state |
| Cost model | Materials · Labor · Equipment · Delivery · Disposal · Permits · Other → Subtotal → Discount → **Sales Tax** → Grand Total |

The architecture supports adding countries later (`countries`, `Country` type),
but the MVP is US-only by design.

---

## Flow

```
Onboarding → State / City / ZIP → Create Project (property address)
→ Upload Space → AI Analysis → Measure (ft/in) → Design → Materials → Furniture
→ Quantities → Local US Prices → Labor → Equipment / Delivery / Disposal / Permits
→ Sales Tax (from location) → Estimate → Proposal → PDF
```

## Routes (all locale-prefixed: `/en-US/...`, `/es-US/...`)

`/` landing · `/login` `/register` · `/onboarding` · `/dashboard` · `/projects`
`/projects/new` · `/projects/[id]` `…/editor` `…/images` `…/estimate`
`…/scenarios` `…/settings` · `/catalog` · `/clients` · `/estimates` `/estimates/[id]`
· `/settings`

---

## Internationalization

- No hardcoded UI strings. Everything goes through `t("namespace.key")`.
- Dictionaries: `locales/en-US/*.json`, `locales/es-US/*.json` (common, dashboard,
  projects, editor, estimates, catalog, settings, onboarding, pdf).
- `app/[locale]/` segment; `proxy.ts` redirects and detects locale (cookie →
  `Accept-Language` → default). Header switcher (`EN` / `ES`) sets a cookie and
  hard-swaps the path.
- **App language ≠ market ≠ estimate language.** A user can run the app in
  Español while every project stays USD / imperial / US suppliers / US tax, and
  generate the PDF in English.
- A test asserts both dictionaries expose the same keys.

---

## Architecture

```
UI (app/[locale], components/)
  → hooks/               use-editor · use-project · use-estimate · use-products · use-market · use-ai · use-session
  → lib/services/        project · location · room · item · image · client · estimate · config · profile · pdf
  → lib/market/          country/state · currency · tax · pricing · labor-rate · delivery · catalog · market
  → lib/calculations/    units · conversions · dimensions · quantities · materials · labor · taxes · estimate · money
  → lib/ai/              provider (VisionProvider/SegmentationProvider/ImageGenerationProvider/EstimationProvider) + demo-provider
  → lib/i18n/            config · dictionaries · translate
  → lib/db/ (localStorage, demo)   ·   lib/supabase/ + supabase/migrations (real backend)
```

No business logic in `page.tsx`. Calculations are pure functions with tests.

### Reproducible estimates

Generating an estimate freezes a `market_snapshot` — country, state, city, ZIP,
sales-tax rate + jurisdiction, product prices, labor rates, delivery rates, FX —
plus a `price_snapshot` per line. A historical estimate **never changes** because
a price, tax, labor or delivery rate moves. Recalculation is explicit.

### Changing a project's location

`projectService.changeLocation()` re-resolves the state, sales-tax rate,
per-item prices and labor rates — after the user confirms in
`ChangeLocationDialog`. Existing estimates keep their snapshot. Covered by
`__tests__/location-change.test.ts`.

### AI

`AI_PROVIDER=demo` (default) needs no network or key and implements the exact
interfaces a real provider would. Endpoints: `POST /api/ai/{analyze-room,
segment-room,generate-design,estimate}`.

---

## API

```
GET  /api/countries        GET /api/states        GET /api/states/[code]
GET  /api/markets/[state]
GET  /api/products         GET /api/products/[id]  GET /api/products/[id]/price?state=CA
GET  /api/labor-rates?state=CA
GET  /api/tax-rates?state=CA&city=Los%20Angeles&zip=90001
POST /api/ai/analyze-room | segment-room | generate-design | estimate
POST /api/pdf/estimate     POST /api/pdf/proposal
GET/POST         /api/projects           GET/PATCH/DELETE /api/projects/[id]
GET              /api/projects/[id]/location
GET/POST         /api/estimates          GET             /api/estimates/[id]
```

Inputs validated with Zod (`lib/validations/`). Mutating routes derive the user
from the authenticated session — never from the request body. In demo mode the
project/estimate routes return `501` and persistence is client-side.

---

## Supabase backend (optional)

1. Create a Supabase project.
2. Apply `supabase/migrations/001_initial_schema.sql` (tables, indexes, **RLS**
   keyed to `owns_project()`, auto-profile trigger).
3. Apply `supabase/seed.sql` — `npm run seed` regenerates it from the same data
   modules the app uses (51 states, 68 tax jurisdictions, 36 products, 1,188
   per-state prices).
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_MODE=false`.
5. Storage buckets: `project-images`, `project-renders`, `avatars`, `pdfs`,
   `product-images` with per-owner policies.

---

## Scripts

| | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | vitest |
| `npm run seed` | regenerate `supabase/seed.sql` |
| `npm run lint` | ESLint |
