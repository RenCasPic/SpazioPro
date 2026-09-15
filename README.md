# Estimate It — From plans to price.

Professional **construction estimating and takeoff software** for the **US**
market. Import a project from photos (BIM/CAD/documents are on the roadmap —
see below), run takeoff, assign materials and labor, and produce an accurate
USD **estimate** and **proposal** — for remodelers, general contractors,
estimators, architects, designers and specialty contractors.

Two workspaces, one product: **Professional** (Takeoff, Scope of Work,
Assemblies, company pricing, estimate versioning — the default) and **Simple**
(the original photo → materials → estimate flow, still fully intact for a
quick homeowner-facing project). Switch anytime in Settings.

Fully **bilingual** (English `en-US` default, Español `es-US`) — the estimate
PDF language is independent of the app UI language.

> This estimate is for planning purposes only. Actual costs may vary based on
> verified measurements, site conditions, material availability, supplier
> pricing, labor requirements, permits, and local taxes.

---

## Quick start (demo mode — no external services)

```bash
npm install
cp .env.example .env.local     # optional — demo mode works with nothing set
npm run dev -- -p 3100         # http://localhost:3100 → redirects to /en-US
npm test                       # 117 tests: geometry, calibration, cost model, tax, i18n…
npm run lint
npm run build
```

`-p 3100` avoids the default port 3000 if you run other Next.js projects locally.

Demo account (pre-filled on the login screen): `demo@estimateit.app` / `demo`.
Data is stored in the browser (`localStorage`); AI and 3D reconstruction are
simulated locally — nothing leaves the browser.

---

## Product flow

```
Create project
  → Import: 📷 Photos (working)  ·  BIM/IFC, CAD/Plans, Documents, Site Capture (roadmap)
→ AI reads the room: type, surfaces, rough size — no measuring
→ Takeoff: measured quantities, each with its source, confidence and
  verification status — SF, LF, EA, CY, CF, SY, gal, hr…
→ Scope of Work: group items by trade, each with its own contingency and markup
→ Studio: tap a surface (floor / wall / ceiling) → pick a real material
  → applied to that surface, quantity resolved from the takeoff automatically
→ (optional) 3D: orbit the room, select a surface there instead, confirm one
  measurement to calibrate real-world scale
→ Estimate: Direct Cost → Overhead → Markup → Selling Price → Sales Tax → Total
  — a rounded cost RANGE with a plain-language confidence note, never false
  precision like "$7,348.23"
→ Save different "Looks" / alternates, compare their cost
→ Generate the estimate or proposal PDF, with a version history
```

The technical work — quantities, waste, labor units, tax jurisdiction, what a
mesh/plane/point cloud is in the 3D view — is resolved automatically. Every
number can answer "where did this come from": a source, a confidence level,
and (once linked) a takeoff measurement or 3D entity.

## Routes (all locale-prefixed: `/en-US/...`, `/es-US/...`)

`/` landing · `/login` `/register` · `/onboarding` · `/dashboard` · `/projects`
`/projects/new` (import chooser) · `/projects/[id]` `…/editor` (Studio, 2D + 3D)
`…/images` `…/takeoff` `…/scope` `…/files` `…/estimate` `…/scenarios`
`…/settings` · `/catalog` · `/clients` · `/estimates` `/estimates/[id]` ·
`/settings`

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
                           · room-model-service · takeoff-service · scope-service · assembly-service
                           · company-service (pricing/labor overrides) · file-service
  → lib/market/           country/state · currency · tax · pricing · labor-rate · delivery · catalog · market
  → lib/calculations/     units · conversions · dimensions · quantities · materials · labor · taxes · estimate
                           · money · range (rounded cost ranges) · surfaces (3D entity → quantity bridge)
                           · scopes (Scope of Work rollups) · assemblies (material + accessories expansion)
  → lib/ai/               provider (VisionProvider/SegmentationProvider/ImageGenerationProvider/EstimationProvider)
                           + demo-provider
  → lib/spatial/          provider (SpatialProvider) + demo-provider · room-builder (parametric geometry)
                           · reconstruction (status state machine, confidence thresholds) · calibrate · edit
  → lib/i18n/             config · dictionaries · translate
  → lib/db/ (localStorage, demo)   ·   lib/supabase/ + supabase/migrations (real backend)
```

No business logic in `page.tsx`. Calculations are pure functions with tests.
**One** quantity engine and **one** estimate engine — every input (photo, 3D
model, manual takeoff, and eventually BIM/CAD) feeds the same pipeline; none of
them duplicate it.

### Professional cost model

`EstimateSettings.overheadPercent` / `markupPercent` sit on top of the direct
cost (materials + labor + extras): **Direct Cost → + Overhead → + Markup →
Selling Price → − Discount → + Sales Tax → Total**. With both at 0% the result
is numerically identical to the simple flow. Scope of Work sections can carry
their own contingency/markup on the same underlying item breakdown — see
`lib/calculations/scopes.ts`.

### Takeoff is not the Estimate

`TakeoffMeasurement` (`lib/services/takeoff-service.ts`) records *how much*
work or material exists — quantity, unit, source (manual, 3D room model, AI
photo analysis, and eventually IFC/CAD/PDF), confidence, verification status —
and never a price. A `ProjectItem` optionally links to one
(`takeoffMeasurementId`); `resolveItemQuantity()` then resolves the quantity
with a strict priority: **linked takeoff measurement > linked 3D entity > the
room's own dimensions.** Nothing is computed twice.

### Reproducible estimates

Generating an estimate freezes a `market_snapshot` — country, state, city, ZIP,
sales-tax rate + jurisdiction, product prices, labor rates, delivery rates, FX —
plus a `price_snapshot` per line, and now a `versionNumber`/`supersedesId`
chain (`nextEstimateVersion()`): a regenerated estimate never edits the one
before it. The same holds for the 3D model: an estimate references a specific
`room_model_id` + `version`, so recalibrating a room later creates a new
version without touching past estimates.

### Company pricing & labor overrides

`pricingService.resolve()` / `laborRateService.rate()` accept an optional
`overrides` array, resolved **before** the state/national market default:
state-specific first, then company-wide. `lib/market` stays pure — the service
layer injects the company's own `CompanyProductPrice` / `CompanyLaborRate`
rows (`lib/services/company-service.ts`).

### Changing a project's location

`projectService.changeLocation()` re-resolves the state, sales-tax rate,
per-item prices and labor rates (including company overrides) — after the user
confirms in `ChangeLocationDialog`. Existing estimates keep their snapshot.
Covered by `__tests__/location-change.test.ts`.

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
and `calibrationStatus` (`types/room-model.ts`) — the same traceability
vocabulary the Takeoff layer uses.

- **`SpatialProvider`** (`lib/spatial/provider.ts`) mirrors the existing
  `AIProvider` pattern — a separate interface, not folded into it, switched by
  `SPATIAL_PROVIDER` (default `demo`). `demo-provider.ts` hashes the capture ids
  into a **deterministic** parametric room via `room-builder.ts` (same input →
  same room, no fake randomness), so the whole 3D path — build, view, select,
  apply material, calibrate — works with zero external services and zero GPU.
  `lib/spatial/fixtures.ts` supplies fixed rooms (simple, with a door, with a
  low-confidence window, uncalibrated, calibrated…) for tests. A real
  photogrammetry/depth/segmentation provider — and BIM/IFC and CAD/DWG/DXF
  import — is Phase 2 (see the design doc); the interfaces are ready for it.
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
  uses.
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
   - `supabase/migrations/003_professional.sql` — Takeoff, Scope of Work,
     company pricing/labor overrides, project files, estimate versioning
     columns, same RLS pattern.
3. Apply `supabase/seed.sql` — `npm run seed` regenerates it from the same data
   modules the app uses (51 states, 68 tax jurisdictions, 41 products, per-state
   prices).
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_MODE=false`.
5. Storage buckets: `project-images`, `project-renders`, `avatars`, `pdfs`,
   `product-images` with per-owner policies. (Heavy 3D capture artefacts, and
   BIM/CAD/PDF plan files, are a Phase 2 addition described in
   `docs/3d-room-reconstruction.md`; the demo/parametric path never needs them.)

---

## Scripts

| | |
| --- | --- |
| `npm run dev -- -p 3100` / `build` / `start` | Next.js |
| `npm test` | vitest — 117 tests |
| `npm run seed` | regenerate `supabase/seed.sql` |
| `npm run lint` | ESLint |
