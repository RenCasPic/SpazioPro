# SpazioPro — Visualize. Estimate. Build.

An AI-powered remodeling app for the **US** market: upload a photo of a room, try
real materials on it, and get a trustworthy USD **estimate** — no construction
knowledge required. Under the hood it's built on quantities, materials, labor,
equipment, delivery, disposal, permits and **local sales tax**, with an optional
**Semantic 3D Room Model** so a surface's area comes from real geometry instead of
a guess.

Fully **bilingual** (English `en-US` default, Español `es-US`) — the estimate PDF
language is independent of the app UI language.

> This estimate is for planning purposes only. Actual costs may vary based on
> verified measurements, site conditions, material availability, supplier
> pricing, labor requirements, permits, and local taxes.

---

## Quick start (demo mode — no external services)

```bash
npm install
cp .env.example .env.local     # optional — demo mode works with nothing set
npm run dev -- -p 3100         # http://localhost:3100 → redirects to /en-US
npm test                       # 89 tests: imperial math, geometry, calibration, tax, i18n…
npm run lint
npm run build
```

`-p 3100` avoids the default port 3000 if you run other Next.js projects locally.

Demo account (pre-filled on the login screen): `demo@spaziopro.app` / `demo`.
Data is stored in the browser (`localStorage`, key `spaziopro.db.v5`); AI and 3D
reconstruction are simulated locally — nothing leaves the browser.

---

## Product flow (consumer-first)

```
What space do you want to remodel?
  → 📷 Upload a photo  (or  📐 Enter dimensions)
→ AI reads the room: type, surfaces, rough size — no measuring
→ Studio: tap a surface (floor / wall / ceiling) → pick a real material
  → applied to that surface, quantity computed automatically
→ (optional) switch to 3D: orbit the room, select a surface there instead,
  confirm one measurement to calibrate real-world scale
→ Save different "Looks", compare their cost
→ Calculate remodel → a rounded cost RANGE with a plain-language confidence note
  (never false precision like "$7,348.23")
```

The user never has to know square footage, waste percentages, labor units, tax
rates, or (in the 3D view) what a mesh, plane or point cloud is — that's all
resolved automatically. Contractor-grade tools (editable labor lines, tax/discount
settings, per-item price overrides, client/proposal management) still exist but
sit behind an **"Advanced"** disclosure on the estimate page, not the default path.

## Routes (all locale-prefixed: `/en-US/...`, `/es-US/...`)

`/` landing · `/login` `/register` · `/onboarding` · `/dashboard` · `/projects`
`/projects/new` (photo-first) · `/projects/[id]` `…/editor` (Studio, 2D + 3D)
`…/images` `…/estimate` `…/scenarios` `…/settings` · `/catalog` · `/clients` ·
`/estimates` `/estimates/[id]` · `/settings`

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
  → lib/services/         project · location · room · item · image · client · estimate · config · profile · pdf
                           · room-model-service (Semantic 3D Room Model — persistence & versioning)
  → lib/market/           country/state · currency · tax · pricing · labor-rate · delivery · catalog · market
  → lib/calculations/     units · conversions · dimensions · quantities · materials · labor · taxes · estimate
                           · money · range (rounded cost ranges) · surfaces (3D entity → quantity bridge)
  → lib/ai/               provider (VisionProvider/SegmentationProvider/ImageGenerationProvider/EstimationProvider)
                           + demo-provider
  → lib/spatial/          provider (SpatialProvider) + demo-provider · room-builder (parametric geometry)
                           · reconstruction (status state machine, confidence thresholds) · calibrate · edit
  → lib/i18n/             config · dictionaries · translate
  → lib/db/ (localStorage, demo)   ·   lib/supabase/ + supabase/migrations (real backend)
```

No business logic in `page.tsx`. Calculations are pure functions with tests.

### Reproducible estimates

Generating an estimate freezes a `market_snapshot` — country, state, city, ZIP,
sales-tax rate + jurisdiction, product prices, labor rates, delivery rates, FX —
plus a `price_snapshot` per line. A historical estimate **never changes** because
a price, tax, labor or delivery rate moves — and the same holds for the 3D model:
an estimate references a specific `room_model_id` + `version`, so recalibrating a
room later creates a new version without touching past estimates.

### Changing a project's location

`projectService.changeLocation()` re-resolves the state, sales-tax rate,
per-item prices and labor rates — after the user confirms in
`ChangeLocationDialog`. Existing estimates keep their snapshot. Covered by
`__tests__/location-change.test.ts`.

### AI providers

`AI_PROVIDER=demo` (default) needs no network or key and implements the exact
interfaces a real provider would. Endpoints: `POST /api/ai/{analyze-room,
segment-room,generate-design,estimate}`.

---

## Semantic 3D Room Model

Design doc: [`docs/3d-room-reconstruction.md`](docs/3d-room-reconstruction.md).

A room can go beyond flat photo + typed dimensions: the editor's **Photo / 3D**
toggle builds a **Semantic 3D Room Model** — a typed tree of architectural
entities (Room → Floor / Ceiling / Wall[] → Window / Door), not a photorealistic
mesh. Each entity carries its own geometry, gross/net area, `confidence`, `source`
and `calibrationStatus` (`types/room-model.ts`).

- **`SpatialProvider`** (`lib/spatial/provider.ts`) mirrors the existing
  `AIProvider` pattern — a separate interface, not folded into it, switched by
  `SPATIAL_PROVIDER` (default `demo`). `demo-provider.ts` hashes the capture ids
  into a **deterministic** parametric room via `room-builder.ts` (same input →
  same room, no fake randomness), so the whole 3D path — build, view, select,
  apply material, calibrate — works with zero external services and zero GPU.
  `lib/spatial/fixtures.ts` supplies fixed rooms (simple, with a door, with a
  low-confidence window, uncalibrated, calibrated…) for tests. A real
  photogrammetry/depth/segmentation provider is Phase 2 (see the design doc);
  the interface is ready for it.
- **Geometry is parametric**, not a scanned mesh: a floor polygon + wall planes +
  rectangular openings — a few hundred triangles, rendered client-side with
  **three.js** / **@react-three/fiber** (`components/editor/3d/`).
- **Calibration**: the model starts `uncalibrated`; the user confirms one
  real-world measurement ("How long is this wall? 14 ft 2 in") and
  `lib/spatial/calibrate.ts` rescales the whole model and bumps its version.
  AI does the geometry, the user confirms the one number that fixes absolute scale.
- **Confidence & review**: thresholds live in one place
  (`lib/spatial/reconstruction.ts`) — nothing is hardcoded per component. A
  surface only feeds the quantity engine once it's `calibrated` **and** either
  verified or above the auto-accept confidence band; low-confidence entities are
  flagged for review instead of silently trusted.
- **Quantification reuses the existing engine, unchanged.** `lib/calculations/
  surfaces.ts` turns an entity's `netAreaSqFt` into a base quantity for a given
  product unit; `resolveItemQuantity()` in `lib/calculations/estimate.ts` picks
  that up when a project item is linked to a 3D entity. Waste, pricing, labor,
  delivery, tax and the estimate total are the same pipeline every other item
  uses — there is only **one** quantity engine.
- **API**: `POST /api/projects/[id]/room-model/reconstruct` (build/rebuild),
  `GET`/`PATCH /api/projects/[id]/room-model` (read / apply a small, closed set
  of edit ops — move a wall, resize an opening, override a dimension — never
  free-form CAD editing), `POST /api/projects/[id]/room-model/calibrate`. Bodies
  validated with the shared schemas in `lib/validations/room-model.ts`.
- **Database** (optional Supabase backend): `supabase/migrations/
  002_room_models.sql` adds `room_models` (the semantic model as JSONB — the
  source of truth, versioned), `room_captures` and `room_measurements`, with
  the same `owns_project()` RLS pattern as everything else. In demo mode
  the model round-trips through `lib/services/room-model-service.ts` into
  `localStorage`, same dual-mode pattern as every other service.

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
POST             /api/projects/[id]/room-model/reconstruct
GET/PATCH        /api/projects/[id]/room-model
POST             /api/projects/[id]/room-model/calibrate
```

Inputs validated with Zod (`lib/validations/`). Mutating routes derive the user
from the authenticated session — never from the request body. In demo mode the
project/estimate/room-model routes return `501` and persistence is client-side.

---

## Supabase backend (optional)

1. Create a Supabase project.
2. Apply the migrations in order:
   - `supabase/migrations/001_initial_schema.sql` — core tables, indexes, **RLS**
     keyed to `owns_project()`, auto-profile trigger.
   - `supabase/migrations/002_room_models.sql` — Semantic 3D Room Model tables
     (`room_models`, `room_captures`, `room_measurements`), same RLS pattern.
3. Apply `supabase/seed.sql` — `npm run seed` regenerates it from the same data
   modules the app uses (51 states, 68 tax jurisdictions, 36 products, 1,188
   per-state prices).
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_MODE=false`.
5. Storage buckets: `project-images`, `project-renders`, `avatars`, `pdfs`,
   `product-images` with per-owner policies. (Heavy 3D capture artefacts — raw
   photos/depth/mesh for a real reconstruction provider — are a Phase 2 addition
   described in `docs/3d-room-reconstruction.md`; the demo/parametric path never
   needs them.)

---

## Scripts

| | |
| --- | --- |
| `npm run dev -- -p 3100` / `build` / `start` | Next.js |
| `npm test` | vitest — 89 tests |
| `npm run seed` | regenerate `supabase/seed.sql` |
| `npm run lint` | ESLint |
