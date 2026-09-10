# SpazioPro — Semantic 3D Room Reconstruction

**Status:** design proposal (no implementation yet)
**Author:** architecture pass, 2026-09-10
**Scope:** add a photo → semantic 3D room model → quantifiable surfaces pipeline
to the existing SpazioPro app, without forking the architecture.

---

## Reading guide

Every component in this document is tagged:

| Tag | Meaning |
|---|---|
| **Difficulty** | LOW / MEDIUM / HIGH / VERY HIGH — engineering effort + risk to build in SpazioPro |
| **Build** | `own` = we write it · `api` = external hosted service · `client` = runs in the browser · `server` = runs in a Next.js route / worker |

The guiding constraint, repeated once so it frames everything below:

> We are **not** building a pretty 3D model. We are building a **semantic, measurable**
> room model precise enough to pick materials and produce a trustworthy US remodeling
> estimate. Visual fidelity is a nice-to-have; measurability is the product.

---

## 1. Executive summary

### Recommendation

Build a **hybrid pipeline**: use computer vision to *understand* the space, but make
the deliverable **clean parametric architecture**, not a reconstructed mesh.

```
3–8 photos (web upload)
   │
   ├─▶  per-image monocular DEPTH            (external API, server)
   ├─▶  per-image SEMANTIC SEGMENTATION      (external API, server)  → wall/floor/ceiling/window/door/furniture
   └─▶  vanishing points / line detection    (own, server)
   │
   ▼
ARCHITECTURAL INFERENCE  (own, server)
   plane fitting (RANSAC) → floor/ceiling/wall classification
   → wall intersections → floor polygon → openings projected onto walls
   │
   ▼
PARAMETRIC ROOM GEOMETRY  (own, server)
   floor polygon + ceiling height + per-wall openings — a few hundred triangles
   │
   ▼
SCALE CALIBRATION  (own + user, server + client)
   priors (door = 80 in, ceiling ≈ 8–9 ft) → auto scale
   → user confirms ONE wall length or ceiling height → global rescale
   │
   ▼
SEMANTIC ROOM MODEL  (own)  — JSON tree, units in inches, per-entity confidence
   Room → Floor / Ceiling / Wall[] → Window / Door
   │
   ├─▶  3D EDITOR         (own, client)  — three.js, selectable surfaces
   └─▶  QUANTIFICATION    (own, server)  — feeds existing lib/calculations unchanged
        surface.netAreaSqFt → waste → purchase qty → market price → labor → estimate
```

### Why not full photogrammetry / NeRF / Gaussian Splatting

Those produce a **visual artefact** (dense mesh or radiance field): millions of
primitives, no semantics, *relative* scale only, needing 20–100+ photos or video and
minutes of GPU. That is the wrong output. SpazioPro needs ~5 numbers per surface, and
**room-layout estimation + plane fitting** delivers exactly that from a handful of
photos in seconds.

### What ships in the MVP

Photo upload → automatic rectangular / simple-L room → confirm 1–2 measurements →
3D editor with selectable floor / ceiling / walls → apply materials → automatic
quantities → existing US estimate. **Fully working in demo mode with zero external
services.**

### Cost & risk headline

- Infra cost: **MEDIUM**, dominated by per-photo ML inference; linear in project count; controllable with caching + plan limits.
- Top risk: **built-ins misread as walls in kitchens** (our highest-value room). Mitigated by an edit step + confidence gating, not eliminated.
- The pipeline degrades gracefully to a **guided manual model** (3 fields) when CV fails.

---

## 2. Current SpazioPro architecture — impact analysis

### What exists today (verified against the codebase)

| Layer | Relevant pieces | Interaction with 3D |
|---|---|---|
| **Types** | `types/project.ts` → `Room` (`widthIn/lengthIn/heightIn`, `floorAreaSqFt`, `wallAreaSqFt`, `ceilingAreaSqFt`, `perimeterLinFt`, `measurementSource: "manual" \| "ai_estimate" \| "mixed"`, `aiAnalysis`), `types/ai.ts` → `RoomAnalysis`, `SegmentationResult` (2D polygon), `AiJob` | The `Room` row stays the **contract** between geometry and the rest of the app. The 3D model writes its AABB + areas back into it. |
| **AI** | `lib/ai/provider.ts` → `AIProvider` (Vision/Segmentation/ImageGeneration/Estimation), `getAIProvider()` switched by `AI_PROVIDER` env, `demo-provider.ts` deterministic | Add a **sibling** `SpatialProvider` + `getSpatialProvider()` following the exact same pattern. Do **not** overload `AIProvider`. |
| **Calculations** | `lib/calculations/dimensions.ts` → `surfaceAreas()`, `baseSurfaceQuantity(surface, RoomDimensions, unit)`; `materials.ts` → `calculateWaste()`, `calculateMaterialCost()`; `estimate.ts` → `resolveItemQuantity()`, `calculateEstimate()`, `confidenceReport()` | The 3D model **feeds these**. New file `lib/calculations/surfaces.ts` computes areas from a polygon; `resolveItemQuantity()` gets one new branch for entity-linked items. **No second engine.** |
| **Market** | `lib/market/*` — pricing, labor-rate, tax, snapshot | Untouched. A surface still resolves to a `ProductCategory` → price/labor/tax exactly as now. |
| **Services** | `lib/services/room-service.ts` → `setDimensions()`, `applyAnalysis()`; `project-service.ts`, `item-service.ts`, `image-service.ts` | Add `room-model-service.ts` peer. It follows the localStorage/Supabase dual-mode pattern of the others. `item-service.add()` gains an optional `roomEntityId`. |
| **API** | `app/api/ai/{analyze-room,segment-room,generate-design,estimate}`, Zod via `lib/api/http.ts` (`parseBody`, `ok`, `badRequest`, `demoNotice`) | Add routes under `app/api/projects/[id]/room-model/*`. Reuse `http.ts` helpers and the `demoNotice` 501 pattern. |
| **DB** | `supabase/migrations/001_initial_schema.sql` — `rooms`, `project_images`, `ai_jobs`, RLS via `owns_project(pid)` | New migration `002_room_models.sql`: `room_models`, `room_captures`, `room_measurements`. Same `owns_project` RLS pattern. Reuse `ai_jobs` for the reconstruction job. |
| **Storage** | buckets `project-images`, `project-renders`, `avatars`, `pdfs`, `product-images` | New private buckets `room-captures`, `room-depth`, `room-models`. |
| **Demo mode** | `lib/db/local-store.ts` (`spaziopro.db.v4`), `isDemoMode()`, `demo-provider` | `DemoSpatialProvider` returns a deterministic room model. The whole editor + calibration + quantification path works offline. |
| **State** | `hooks/use-editor.ts` (Zustand, undo/redo), `hooks/use-ai.ts` | Extend `use-editor` with `roomModel`, `selectedEntityId`, `viewMode`. **No new store.** |

### Net change footprint

- **New:** `lib/ai/spatial/`, `lib/services/room-model-service.ts`, `lib/calculations/surfaces.ts`, `components/editor/3d/`, `types/room-model.ts`, `lib/validations/room-model.ts`, 4–5 API routes, 1 migration, 3 buckets.
- **Modified (small, surgical):** `types/project.ts` (add `MeasurementSource` value if needed — already has `"mixed"`), `lib/calculations/estimate.ts` (`resolveItemQuantity` branch), `lib/services/item-service.ts` (`roomEntityId` field), `hooks/use-editor.ts`, the editor page (add a 2D/3D toggle).
- **Untouched:** all of `lib/market`, `lib/calculations/{money,taxes,labor,units,conversions}`, estimate/PDF generation, the whole consumer redesign work already merged.

**Difficulty (integration only, excluding ML):** MEDIUM. The seams already exist.

---

## 3. Recommended 3D reconstruction pipeline

Stage by stage. "Room layout estimation" is the academic name for what stages 4–6 do.

| # | Stage | Input | Output | Build | Difficulty |
|---|---|---|---|---|---|
| 1 | **Capture** | user photos/video | normalized image set (EXIF-oriented, ≤ 2048 px, HEIC→JPEG), manifest | `client` upload + `server` normalize | LOW |
| 2 | **Monocular depth** | 1 image | per-pixel *relative* depth map | `api` | MEDIUM (integration) |
| 3 | **Semantic segmentation** | 1 image | per-pixel class map (ADE20K-ish: wall, floor, ceiling, window, door, + furniture/appliance/person/plant) | `api` | MEDIUM |
| 4 | **Geometric cues** | 1 image | vanishing points, dominant line directions, horizon | `own` `server` | MEDIUM |
| 5 | **Plane extraction & classification** | depth + segmentation + cues | set of 3D planes tagged `floor \| ceiling \| wall`, each with support & normal | `own` `server` | HIGH |
| 6 | **Architectural assembly** | planes | floor polygon (ordered), ceiling height, wall list, corner graph | `own` `server` | HIGH |
| 7 | **Opening projection** | window/door masks + wall planes | rectangular openings positioned on their host wall | `own` `server` | MEDIUM |
| 8 | **Geometry cleanup** | raw polygon + openings | snapped angles (90°/45°), merged collinear edges, min-length walls, standardized opening sizes | `own` `server` | MEDIUM |
| 9 | **Scale calibration** | model + priors + user confirmations | absolute `scaleFactor`, model rescaled to inches | `own` `server` + `client` (UX) | HIGH |
| 10 | **Semantic model build** | calibrated geometry | `RoomModel` JSON (§6), areas via `lib/calculations/surfaces.ts` | `own` `server` | LOW |
| 11 | **Quantifiable surfaces** | `RoomModel` | `{ entityId, surfaceKind, netAreaSqFt, perimeterLinFt, … }[]` handed to existing quantity code | `own` `server`/`client` | LOW |
| 12 | **Material assignment → quantity** | surface + product | purchase quantity, price, labor, estimate line — **existing engine** | `own` (glue only) | LOW |

For MVP, stages 2–5 can be **collapsed**: a single hosted *room-layout* model
(HorizonNet / LSUN-room / RoomFormer style) directly emits a floor polygon + wall
planes + openings from one or a few images, skipping explicit depth+plane fitting.
This is the recommended MVP shortcut — see §5.

---

## 4. Technology comparison

Each technology assessed on: **problem solved · input · output · expected accuracy ·
cost · complexity · web/mobile · hardware dependency · utility for SpazioPro · MVP vs
future.**

### 4.1 Photogrammetry / Multi-View Stereo (MVS)

- **Problem solved:** dense 3D surface reconstruction from many overlapping photos.
- **Input:** 30–150 overlapping photos, good texture, consistent lighting.
- **Output:** dense point cloud + textured mesh (10⁵–10⁷ triangles). *Relative* scale.
- **Accuracy:** geometry excellent (sub-cm relative) *if* capture is good; useless if photos are sparse or textureless (blank walls — the SpazioPro common case).
- **Cost:** MEDIUM–HIGH (minutes of CPU/GPU per scene; COLMAP self-host or hosted like RealityCapture/Poly.cam API).
- **Complexity:** HIGH (capture guidance, failure handling, mesh cleanup).
- **Web/mobile:** capture works anywhere; processing is server-only.
- **Hardware:** none special, but needs *many careful* photos.
- **Utility for SpazioPro:** LOW as a primary path — wrong output (visual mesh, no semantics, no scale), demands too much of the user. Useful later only as an optional *visual overlay*.
- **Verdict:** **Future / optional visual layer only.**

### 4.2 Structure from Motion (SfM)

- **Problem solved:** recover camera poses + a sparse 3D point cloud from an unordered photo set. It's the front half of photogrammetry.
- **Input:** 8–100 photos with overlap.
- **Output:** camera intrinsics/extrinsics + sparse points. *Relative* scale.
- **Accuracy:** poses good with enough baseline; sparse points only.
- **Cost:** MEDIUM (COLMAP/GLOMAP, seconds–minutes).
- **Complexity:** MEDIUM–HIGH.
- **Web/mobile:** processing server-only; there are wasm builds but too slow for production.
- **Hardware:** none.
- **Utility:** MEDIUM — camera poses make multi-image plane fitting far more robust and give a metric baseline if any pose is scaled. Good **Phase 2** robustness upgrade; not required for a 1–3 photo MVP.
- **Verdict:** **Phase 2** (multi-image fusion, better scale).

### 4.3 SLAM (visual / visual-inertial)

- **Problem solved:** real-time incremental pose + map while a device moves.
- **Input:** live video stream, ideally + IMU.
- **Output:** trajectory + sparse/semi-dense map; VIO gives *metric* scale.
- **Accuracy:** good drift-corrected trajectories; metric with IMU.
- **Cost:** LOW compute per frame but needs a live capture app.
- **Complexity:** HIGH to build; trivial to *consume* via ARKit/ARCore.
- **Web/mobile:** essentially mobile-only (WebXR support is thin). Not a web-app technology.
- **Hardware:** camera + IMU (any modern phone).
- **Utility:** MEDIUM — only relevant once there's a mobile capture client (**Phase 4**). Then it removes the calibration step entirely (metric out of the box).
- **Verdict:** **Phase 4**, via ARKit/ARCore, not hand-rolled.

### 4.4 Monocular depth estimation

- **Problem solved:** predict per-pixel depth from a single image.
- **Input:** 1 RGB image.
- **Output:** dense depth map. **Relative** (affine-invariant) for most models; **metric** for Metric3D / UniDepth / Depth Pro (with error).
- **Accuracy:** relative structure very good on indoor scenes; *absolute* metric ±10–20% without calibration.
- **Cost:** LOW–MEDIUM per image (hosted GPU, ~1–3 s; models: Depth Anything V2, Metric3D v2, Apple Depth Pro, ZoeDepth).
- **Complexity:** LOW to integrate (single HTTP call).
- **Web/mobile:** inference server-side; small variants can run client-side via ONNX/TF.js but slowly — not recommended.
- **Hardware:** none.
- **Utility:** **HIGH** — gives the 3D structure needed for plane fitting from very few photos; the scale ambiguity is handled by §9 calibration.
- **Verdict:** **MVP core** (external API).

### 4.5 Multi-view stereo depth (as opposed to MVS mesh)

- Covered by 4.1/4.2 pipeline. As a *depth* source: more accurate than monocular where you have overlap + poses.
- **Utility:** MEDIUM — **Phase 2** upgrade to monocular depth once SfM poses exist.
- **Verdict:** **Phase 2.**

### 4.6 NeRF (Neural Radiance Fields)

- **Problem solved:** photorealistic novel-view synthesis of a captured scene.
- **Input:** 20–100+ posed images.
- **Output:** an implicit radiance field; meshes extractable but noisy. *Relative* scale.
- **Accuracy:** visual excellent; geometry mediocre for measurement; no semantics.
- **Cost:** HIGH (minutes–hours GPU training per scene, though Instant-NGP is faster).
- **Complexity:** HIGH.
- **Web/mobile:** viewers exist; training server-only + heavy.
- **Hardware:** none for capture; GPU for training.
- **Utility:** VERY LOW for quantification. It's a rendering technique.
- **Verdict:** **Out of scope.**

### 4.7 3D Gaussian Splatting (3DGS)

- **Problem solved:** fast, high-quality novel-view synthesis; faster than NeRF.
- **Input:** posed images (SfM first).
- **Output:** a set of 3D Gaussians; real-time render. *Relative* scale, no semantics.
- **Accuracy:** visual great; not a measurement tool.
- **Cost:** MEDIUM–HIGH (SfM + minutes of GPU optimization).
- **Complexity:** HIGH.
- **Web/mobile:** web viewers are good; still a large payload.
- **Utility:** VERY LOW for SpazioPro's actual need. Possible *far-future* "walk through your remodel" showcase.
- **Verdict:** **Out of scope** (maybe Phase 5 marketing feature).

### 4.8 Depth from dedicated sensors (ToF / structured light / stereo cameras)

- **Problem solved:** direct metric depth without inference.
- **Input:** device with a depth sensor.
- **Output:** metric depth map / point cloud.
- **Accuracy:** cm-level within a few metres.
- **Cost:** LOW compute.
- **Web/mobile:** mobile-only; not exposed to browsers reliably.
- **Hardware:** **dependent** (recent iPhone Pro / iPad Pro LiDAR, some Android ToF).
- **Utility:** HIGH *when available* — removes calibration. But can't be the MVP baseline (most users lack it).
- **Verdict:** **Phase 4** enhancement, opportunistic.

### 4.9 ARKit (iOS)

- **Problem solved:** on-device SLAM + plane detection + scene mesh + (LiDAR) depth; `RoomPlan` API literally outputs parametric rooms with walls/windows/doors.
- **Input:** live capture in a native/Capacitor app.
- **Output:** **metric** parametric room (RoomPlan) or scene mesh + anchors.
- **Accuracy:** RoomPlan ~cm-to-few-cm on walls; excellent for our purpose.
- **Cost:** LOW (on device).
- **Web/mobile:** **iOS app only** (WebXR on iOS Safari is limited; no RoomPlan on web).
- **Hardware:** iPhone/iPad; RoomPlan best with LiDAR.
- **Utility:** **VERY HIGH** for a future mobile capture companion — it basically *is* our pipeline, done by Apple, metric.
- **Verdict:** **Phase 4** (mobile companion / PWA-plus-native). Design the `SpatialProvider` interface now so an `ARKitSpatialProvider` drops in later.

### 4.10 ARCore (Android)

- Analogous: Depth API, plane detection, no first-party RoomPlan equivalent (3rd-party libs exist).
- **Accuracy:** planes good; depth ±10–15%; no turnkey parametric room.
- **Utility:** HIGH for Android capture in **Phase 4**; more assembly work than ARKit.
- **Verdict:** **Phase 4.**

### 4.11 LiDAR (as a capability, mobile)

- Covered by 4.8/4.9. It is the single biggest accuracy unlock and removes calibration, but it's a minority of devices and mobile-only.
- **Verdict:** **Phase 4**, opportunistic path that skips §9.

### 4.12 Room-layout estimation (HorizonNet / LSUN-Room / RoomFormer / monocular-360)

- **Problem solved:** directly predict the room's floor/ceiling/wall layout (and sometimes openings) from 1 image (perspective or panorama).
- **Input:** 1 wide-angle photo (or a stitched pano), or a few perspective photos.
- **Output:** floor polygon + wall boundaries + ceiling height (relative), openings in some models. **Semantic by construction.**
- **Accuracy:** ~80–90% corner IoU on benchmarks for "Manhattan" rooms; degrades with clutter/occlusion and non-box shapes.
- **Cost:** LOW–MEDIUM (single hosted inference).
- **Complexity:** LOW to integrate; it *is* the assembly step.
- **Web/mobile:** server-side inference.
- **Utility:** **VERY HIGH** — this is the most direct route to a parametric room from few photos. Pair it with monocular depth for scale hints + non-box refinement.
- **Verdict:** **MVP core** (external API or self-hosted model). If a good hosted endpoint isn't available, fall back to the explicit depth+segmentation+plane-fitting path (§3 stages 2–8), which is more work but fully in our control.

### 4.13 Semantic / instance segmentation (SegFormer, OneFormer, Mask2Former, SAM 2)

- **Problem solved:** label every pixel by class (semantic) and/or object instance (instance); SAM gives promptable masks.
- **Input:** 1 image (+ a point/box prompt for SAM).
- **Output:** class map / instance masks.
- **Accuracy:** indoor-scene wall/floor/ceiling ~85–92% mIoU; window/door lower (~70–80%); furniture good.
- **Cost:** LOW–MEDIUM per image.
- **Complexity:** LOW to integrate.
- **Utility:** **HIGH** — needed to (a) find openings, (b) subtract furniture/people/plants/appliances so they don't corrupt planes, (c) let the user click a surface in a photo. SAM 2 also enables the "tap a surface in the photo" UX already present in the 2D editor.
- **Verdict:** **MVP core** (external API).

### 4.14 Plane detection networks (PlaneRCNN / PlaneFormer / PlaneAE)

- **Problem solved:** detect piecewise-planar regions + their 3D parameters from 1 image.
- **Input:** 1 image.
- **Output:** plane segments + normals + offsets (relative scale).
- **Accuracy:** good for dominant planes indoors.
- **Cost:** MEDIUM.
- **Utility:** MEDIUM–HIGH — an alternative/supplement to depth+RANSAC for stage 5; can shortcut plane fitting.
- **Verdict:** **MVP alternative** to explicit RANSAC; pick whichever hosted option is cleaner.

### 4.15 Vision-LLM (Claude with vision) for spatial understanding

- **Problem solved:** high-level room understanding — room type, which surfaces are remodelable, sanity-checking layout, labelling ("window over the sink"), listing fixtures.
- **Input:** 1–8 images + a structured prompt.
- **Output:** JSON: room type, surface inventory, object list, notes, confidence, obvious-error flags.
- **Accuracy:** excellent at classification/description; **not** a source of measurements or precise geometry.
- **Cost:** LOW–MEDIUM per call.
- **Complexity:** LOW (SpazioPro already has an `AIProvider` seam; the API reference is in this repo's tooling).
- **Utility:** **HIGH** as the *semantic glue*: it does what the current `demoProvider.analyzeRoom` pretends to do, and it validates/annotates the geometric model. It must **never** be the geometry source.
- **Verdict:** **MVP core** for the semantic layer (`VisionProvider` upgrade), strictly separated from geometry.

### 4.16 Comparison summary

| Technology | MVP? | Role | Difficulty | Build |
|---|---|---|---|---|
| Room-layout estimation | ✅ core | parametric room from few photos | MEDIUM | api |
| Monocular depth | ✅ core | 3D structure + scale hints | MEDIUM | api |
| Semantic segmentation (+ SAM 2) | ✅ core | openings, clutter removal, click-to-select | MEDIUM | api |
| Vision-LLM (Claude) | ✅ core | room type, surface inventory, validation | LOW–MEDIUM | api |
| Plane detection net | ✅ alt | shortcut for plane fitting | MEDIUM | api |
| Vanishing points / lines | ✅ core | Manhattan alignment, cleanup | MEDIUM | own/server |
| SfM | Phase 2 | multi-image robustness + scale | HIGH | own/api |
| MVS / photogrammetry | Phase 2+ | optional visual mesh overlay | HIGH | api |
| ARKit RoomPlan | Phase 4 | metric parametric room on iOS | MEDIUM | api (Apple) |
| ARCore depth/planes | Phase 4 | Android capture | HIGH | own+api |
| LiDAR/ToF depth | Phase 4 | metric, skips calibration | MEDIUM | api (device) |
| SLAM/VIO | Phase 4 | live capture | HIGH | api (device) |
| NeRF | ✗ | — | HIGH | — |
| 3D Gaussian Splatting | Phase 5 (showcase) | "walk your remodel" | HIGH | api |

---

## 5. Recommended MVP stack

### The pick

**Hybrid CV → parametric geometry, web-only capture, server-side reconstruction,
demo-first.**

| Concern | MVP choice | Rationale |
|---|---|---|
| Capture | Web multi-photo upload (3–8), guided prompts ("stand in a corner", "get the floor–wall line") | No app to ship; covers the 80% case |
| Geometry source | Hosted **room-layout** model as primary; **monocular depth + semantic segmentation + vanishing points → RANSAC plane fitting** as the controllable fallback | One vendor call gets us 90%; the fallback means no single point of failure |
| Semantic layer | **Vision-LLM (Claude)** for room type / surface inventory / validation | Reuses the `AIProvider` seam; the API is well understood |
| Scale | Priors (door 80 in, ceiling ≈ 102 in) → auto; **1–2 user confirmations** → exact | AI does 90–95%, user does the last mile — matches the brief |
| Model store | **Postgres JSONB** (semantic model, source of truth) + **GLB in Storage** (render) | Queryable + editable model; tiny render payload |
| Editor | **three.js + react-three-fiber**, parametric extruded geometry | A few hundred triangles; instant load; selectable entities |
| Job model | **Reuse `ai_jobs`**, synchronous-with-polling for MVP | No queue infra yet; states live in `output.stage` |
| Demo | `DemoSpatialProvider` — deterministic rectangular room | Whole path testable offline |
| Quantification | **Existing `lib/calculations`** via a thin `surfaces.ts` adapter | Zero duplication — hard requirement |

### Concrete dependencies to add

- `three`, `@react-three/fiber`, `@react-three/drei` (client, ~600 KB gzipped, lazy-loaded only in 3D view).
- `three/examples` `OrbitControls`, `PointerLockControls` (bundled with `drei`).
- Server-side geometry math: small, hand-written (shoelace, plane–plane intersection, RANSAC). Optionally `ml-matrix` for least-squares plane fits. **No** heavy CV lib in the Node runtime.
- Image normalization: `sharp` (server) for resize / EXIF orient / HEIC decode.
- External inference: 1–2 hosted vendors behind the `SpatialProvider` interface (candidates: Replicate, fal.ai, Roboflow, a dedicated room-layout API, or Anthropic vision for the semantic layer). **Pick two** so one can fail.

### Explicitly rejected for MVP

Self-hosted GPU · COLMAP/SfM · NeRF/3DGS · native mobile app · on-device ML ·
a second units system · a second calculations engine · storing dense meshes.

---

## 6. Semantic 3D data model

Design only. Units are **always inches** for lengths, **sq ft** for areas, **linear ft**
for runs — identical to the existing `RoomDimensions` / `surfaceAreas` contract. There
is no second unit system, ever.

### Coordinate frame

Room-local, right-handed, **Y up**, floor plane at `y = 0`, origin at the first floor
polygon vertex. All entity geometry is expressed in this frame after calibration.

### `types/room-model.ts` (proposed)

```ts
// ---- primitives ----
export interface Vec2 { x: number; z: number }          // floor-plane point, inches
export interface Vec3 { x: number; y: number; z: number } // inches

export type RoomEntityType =
  | "room" | "floor" | "ceiling" | "wall"
  | "door" | "window" | "opening"
  | "column" | "stair" | "niche"
  | "furniture" | "appliance" | "object";

export type ReconstructionSource = "demo" | "photo_cv" | "layout_model" | "manual" | "hybrid";
export type CalibrationStatus = "uncalibrated" | "auto" | "user_confirmed";

// ---- an entity ----
export interface RoomEntity {
  id: string;                       // "wall_01", "window_01"
  type: RoomEntityType;
  label: string;                    // "Left wall", "Window over sink"
  parentId: string | null;          // "room_01"
  childIds: string[];               // openings belong to a wall

  /** the existing surface enum — only set for quantifiable architectural faces */
  surfaceKind?: "floor" | "wall" | "ceiling";
  quantifiable: boolean;            // false for furniture/objects/columns (MVP)

  geometry: {
    /** supporting plane (walls/floor/ceiling) */
    plane?: { normal: Vec3; originOffsetIn: number };
    /** outline in the plane's local 2D frame, inches, ordered CCW */
    polygon2d?: Array<{ u: number; v: number }>;
    /** placement for openings / objects */
    transform?: { position: Vec3; rotationDeg: number };
  };

  /** cached, recomputed by lib/calculations/surfaces.ts on every edit */
  dimensions: {
    lengthIn?: number;
    heightIn?: number;
    widthIn?: number;
    grossAreaSqFt?: number;
    netAreaSqFt?: number;           // gross − openings
    perimeterLinFt?: number;        // for baseboards / crown
  };

  openings?: string[];              // child ids subtracted from netArea (walls only)

  provenance: {
    source: ReconstructionSource;
    confidence: number;             // 0..1
    calibrationStatus: CalibrationStatus;
    needsReview: boolean;           // confidence < threshold OR flagged by validation
    detectedFrom?: string[];        // capture ids that contributed
  };
}

// ---- the model ----
export interface RoomModel {
  id: string;
  projectId: string;                // denormalized for RLS via owns_project
  roomId: string;                   // FK → rooms.id (the app-wide contract)
  version: number;                  // bumped on every persisted edit
  schemaVersion: 1;

  source: ReconstructionSource;
  status: RoomModelStatus;          // see §10
  calibrationStatus: CalibrationStatus;
  scaleFactor: number;              // multiplier applied to the raw reconstruction
  units: "in";                      // literal — asserted in tests

  /** axis-aligned bounds — mirrors RoomDimensions, written back to rooms row */
  bounds: { widthIn: number; lengthIn: number; heightIn: number };
  floorPolygon: Vec2[];             // ordered CCW, inches, room-local
  ceilingHeightIn: number;

  entities: RoomEntity[];           // room + floor + ceiling + walls + openings + detected objects

  confidence: number;               // aggregate
  capture: { count: number; kind: "photo" | "video"; captureIds: string[] };

  createdAt: string;
  updatedAt: string;
}

export type RoomModelStatus =
  | "uploaded" | "processing" | "reconstructing" | "segmenting"
  | "building_model" | "awaiting_validation" | "ready" | "failed";
```

### Example — a wall matching the brief

```json
{
  "id": "wall_02",
  "type": "wall",
  "label": "Sink wall",
  "parentId": "room_01",
  "surfaceKind": "wall",
  "quantifiable": true,
  "geometry": {
    "plane": { "normal": { "x": 0, "y": 0, "z": 1 }, "originOffsetIn": 0 },
    "polygon2d": [
      { "u": 0, "v": 0 }, { "u": 165.4, "v": 0 },
      { "u": 165.4, "v": 106.3 }, { "u": 0, "v": 106.3 }
    ]
  },
  "dimensions": {
    "lengthIn": 165.4,
    "heightIn": 106.3,
    "grossAreaSqFt": 122.02,
    "netAreaSqFt": 106.02,
    "perimeterLinFt": 13.78
  },
  "openings": ["window_01"],
  "provenance": {
    "source": "layout_model",
    "confidence": 0.94,
    "calibrationStatus": "user_confirmed",
    "needsReview": false,
    "detectedFrom": ["cap_1", "cap_2"]
  }
}
```

Openings carry their own entity:

```json
{
  "id": "window_01", "type": "window", "label": "Window over sink",
  "parentId": "wall_02", "quantifiable": false,
  "geometry": { "transform": { "position": { "x": 60, "y": 40, "z": 0 }, "rotationDeg": 0 } },
  "dimensions": { "widthIn": 48, "heightIn": 48, "grossAreaSqFt": 16 },
  "provenance": { "source": "photo_cv", "confidence": 0.71, "calibrationStatus": "user_confirmed", "needsReview": true }
}
```

### Relationships

```
RoomModel (1) ──── (1) rooms.id                     ← app-wide contract
     │
     └── entities[]
          room_01 (type: room)
           ├── floor_01   (surfaceKind: floor)   quantifiable
           ├── ceiling_01 (surfaceKind: ceiling) quantifiable
           ├── wall_01..N (surfaceKind: wall)    quantifiable
           │     └── window_* / door_*           NOT quantifiable, subtracted from wall.netArea
           └── furniture_* / appliance_* / column_*   detected, shown, NOT quantifiable (MVP)

project_items.roomEntityId ──▶ RoomEntity.id      ← material assignment link (new optional FK)
```

**Difficulty (design + types + validation): LOW. Build: `own`.**

---

## 7. Geometry pipeline — raw sensing → clean architecture

The core intellectual work. Assumes we have (per image or fused): a depth map, a
semantic mask, and camera intrinsics (from EXIF focal length or estimated).

### 7.1 Back-project to a point cloud

For each pixel `(px,py)` with depth `d` and intrinsics `K`:
`P = d · K⁻¹ · [px, py, 1]ᵀ`. Filter out pixels whose semantic class is
furniture/person/plant/appliance/decoration — they must not pollute plane fits.
`server`, LOW.

### 7.2 Plane extraction — RANSAC

Repeatedly:
1. sample 3 points, fit a plane;
2. count inliers within `τ = 1–2 in` orthogonal distance;
3. keep the plane if inliers > `minSupport` (e.g. 3% of cloud);
4. remove inliers, repeat until support drops.
Refine each kept plane by total-least-squares (SVD of the centered inlier matrix).
`server`, MEDIUM. (`ml-matrix` for the SVD, or hand-rolled 3×3.)

### 7.3 Orientation classification

- `|n · up| > 0.95` → horizontal plane. Lowest = **floor**, highest = **ceiling**.
- `|n · up| < 0.15` → vertical plane → **wall candidate**.
- Everything else (0.15–0.95) → sloped surface → MVP: ignore or flag `niche/soffit`, do not quantify.
`server`, LOW.

### 7.4 Manhattan alignment

Compute vanishing points from detected line segments (LSD / EDLines). The two
horizontal VPs define the room's principal axes. Snap each wall normal to the nearest
principal axis (MVP assumption: walls are axis-aligned → 90° corners). Non-orthogonal
walls are **Phase 2** (keep the measured angle, don't snap).
`server`, MEDIUM.

### 7.5 Wall candidates → room boundary

1. Intersect each wall plane with the floor plane → a 2D line in the floor plane.
2. These lines bound the room. Order them by angle around the room centroid.
3. Intersect consecutive lines → corner vertices → **floor polygon**.
4. **Occlusion / missing walls:** if only 2–3 walls were seen, close the polygon with
   inferred right-angle segments to the bounding rectangle; mark inferred edges
   `confidence ≈ 0.4`, `needsReview: true`.
5. L-shape: allow up to 6 edges, all 90°; reject anything more complex (MVP) → manual fallback.
`server`, HIGH.

### 7.6 Ceiling height

Median vertical distance between the floor plane and the ceiling plane over their
overlap. If no ceiling was captured, use the prior (102 in) and flag.
`server`, LOW.

### 7.7 Openings

1. Take window/door masks; back-project mask pixels; assign each to the nearest wall plane.
2. Project onto that wall's local `(u,v)` frame; take the axis-aligned bounding rect.
3. Snap to plausible sizes (doors: 30/32/36 in × 80 in; windows: round to 2 in).
4. Clip so the opening stays inside the wall rect.
5. Confidence = segmentation confidence × geometric fit quality.
`server`, MEDIUM.

### 7.8 Cleanup → parametric surfaces

- Merge edges within 3° of collinear.
- Snap corner angles to 90° / 45°.
- Drop wall segments < 12 in (measurement noise).
- Enforce polygon simplicity (no self-intersection) — else → manual fallback.
- Build entities:
  - **floor** = polygon at `y=0`;
  - **ceiling** = same polygon at `y=h`;
  - **wall_i** = vertical quad from floor edge `i` extruded to `h`;
  - subtract each opening rect from its wall to get `netAreaSqFt`.
- Areas computed by `lib/calculations/surfaces.ts` (§16), **not** re-implemented here.
`server`, MEDIUM.

### 7.9 Output

A `RoomModel` with `calibrationStatus: "uncalibrated"` and a `scaleFactor` derived
from priors (§9). Status → `awaiting_validation`.

---

## 8. Scale / calibration strategy

**The single most important correctness lever.** Monocular reconstruction has
*relative* scale; remodeling estimates need *absolute* scale within a few percent.

### 8.1 Automatic pass (server, `own`, MEDIUM)

Ordered priors, best available wins:

| Signal | Prior | Reliability |
|---|---|---|
| Detected interior **door** leaf height | 80 in (6′8″) — near-universal in US residential | HIGH |
| Detected **door** width | 32 in typical (28–36) | MEDIUM |
| **Ceiling height** | 96–108 in; use 102 in as the point prior | MEDIUM |
| Standard **outlet** height to center | 12–16 in | LOW–MEDIUM |
| Kitchen **counter** height | 36 in | MEDIUM (if visible) |
| Metric depth model output (Metric3D etc.) | direct, ±10–20% | MEDIUM |

`scaleFactor = knownRealLength / modelMeasuredLength`. Apply to all geometry.
`calibrationStatus = "auto"`, aggregate confidence capped at ~0.75.

### 8.2 User confirmation pass (client UX + server recompute, HIGH)

Show the 3D model. Ask for **one** measurement — pick the highest-leverage:

> "Roughly how long is this wall?" *(the longest detected wall, highlighted)*
> `[ 14 ] ft  [ 2 ] in`

On submit: `s_new = s_current · (userValueIn / modelValueIn)`, rescale everything,
recompute all `dimensions`, `bounds` → write back to `rooms`.
`calibrationStatus = "user_confirmed"`, confidence unlocked to model's geometric confidence.

**Optionally a second confirmation** on a perpendicular wall corrects aspect-ratio
error (monocular models often get one axis better than the other). Offer it, don't
require it. If the two implied scales disagree > 15%, force it and warn.

### 8.3 Interaction with the estimate

`confidenceReport()` in `lib/calculations/estimate.ts` already emits reason codes.
Add:
- `"uncalibrated_model"` → estimate blocked from "final".
- `"auto_calibrated"` → estimate confidence `medium` at best.
- `"user_confirmed"` → geometry no longer a limiting factor.

### 8.4 Metric fast-path (Phase 4)

If capture came from ARKit RoomPlan / LiDAR / ARCore depth, the model is already
metric → skip §8 entirely, `calibrationStatus = "user_confirmed"` (device-measured),
still let the user nudge.

---

## 9. AI architecture

### 9.1 Provider seam — mirror the existing pattern

Do **not** overload `AIProvider`. Add a sibling:

```
lib/ai/
  provider.ts            (existing — Vision/Segmentation/ImageGeneration/Estimation)
  demo-provider.ts        (existing)
  spatial/
    provider.ts           SpatialProvider interface + getSpatialProvider()
    demo-spatial.ts        DemoSpatialProvider  (deterministic, offline)
    photo-spatial.ts       PhotoSpatialProvider (hosted models; Phase 1 real impl)
    arkit-spatial.ts       (Phase 4)
    steps/                 pure functions: planes.ts, layout.ts, openings.ts, calibrate.ts, assemble.ts
```

```ts
export interface SpatialProvider {
  readonly id: string;
  readonly isDemo: boolean;

  /** photos → raw (uncalibrated) semantic room model + a stage callback */
  reconstruct(input: ReconstructInput): Promise<RoomModel>;

  /** optional: promptable mask for "tap a surface in this photo" */
  segmentSurface?(imageUrl: string, point: { x: number; y: number }): Promise<SegmentationResult>;
}

export interface ReconstructInput {
  projectId: string;
  roomId: string;
  captures: Array<{ id: string; url: string; width: number; height: number; focalLength35?: number }>;
  roomTypeHint?: ProjectType;
  onStage?: (stage: RoomModelStatus) => void;
}
```

Registered by `SPATIAL_PROVIDER` env (default `demo`), same as `AI_PROVIDER`.

### 9.2 Division of labour

| Task | Who | Where | Notes |
|---|---|---|---|
| Room type, surface inventory, "what's remodelable", validation, labels | **Vision-LLM (Claude)** — upgrade the existing `VisionProvider.analyzeRoom` | `api` `server` | Never produces geometry. Cross-checks the geometric model ("model says 3 walls, I see 4"). |
| Monocular depth | hosted model | `api` `server` | 1 call per capture, cached by content hash |
| Semantic segmentation | hosted model | `api` `server` | 1 call per capture |
| Room-layout (primary geometry) | hosted model | `api` `server` | 1 call; if unavailable → plane-fitting fallback |
| Vanishing points / lines | **us** | `own` `server` | classical CV, cheap |
| Plane RANSAC + classification | **us** | `own` `server` | the fallback geometry path |
| Assembly, cleanup, openings, calibration math | **us** | `own` `server` | the core IP |
| Semantic model build + area math | **us** | `own` `server` | via `lib/calculations` |
| 3D render + editing | **us** | `own` `client` | three.js |
| Demo everything | **us** | `own` | deterministic |

### 9.3 Caching

Key every external inference by `sha256(imageBytes) + modelId + params`. Store results
in `room-depth` / a `inference_cache` table. Re-running reconstruction on the same
photos costs ~nothing.

### 9.4 Prompt contract for the Vision-LLM

Structured JSON out, Zod-validated, with an explicit `"cannot_determine"` allowed for
every field. It annotates and validates; it never invents a number the geometry
didn't produce.

**Difficulty: HIGH overall (integration + orchestration). Build: mixed — seam `own`, models `api`.**

---

## 10. API design

All routes: authenticated session, `owns_project(projectId)` check, Zod bodies via
`lib/api/http.ts`, `demoNotice()` 501 where a real backend is required but demo mode
substitutes locally. **No client supplies `user_id`.**

### 10.1 Routes

| Method | Route | Body / params | Response | Notes |
|---|---|---|---|---|
| `POST` | `/api/projects/[id]/room-model/captures` | `{ files: [{ name, contentType, bytes }] }` *(or)* returns signed upload URLs | `{ captureIds: string[], uploadUrls?: [] }` | Client uploads directly to `room-captures/{projectId}/…`; server records rows. |
| `POST` | `/api/projects/[id]/room-model/reconstruct` | `{ captureIds: string[], roomTypeHint? }` | `{ jobId, status: "processing" }` | Creates an `ai_jobs` row (`type: "reconstruct"`). Demo mode: runs `DemoSpatialProvider` synchronously, returns `status: "ready"`. |
| `GET` | `/api/projects/[id]/room-model` | — | `{ model: RoomModel \| null, job: { status, stage, error } }` | Polled by the client while processing. |
| `POST` | `/api/projects/[id]/room-model/calibrate` | `{ measurements: [{ entityId, kind, valueIn }] }` | `{ model: RoomModel }` | Recomputes `scaleFactor`, rescales, writes back to `rooms`, bumps `version`. |
| `PATCH` | `/api/projects/[id]/room-model` | discriminated union of edit ops (below) | `{ model: RoomModel }` | Each op recomputes affected `dimensions`, bumps `version`. |
| `POST` | `/api/projects/[id]/room-model/apply-to-room` | `{ }` | `{ room: Room }` | Writes `bounds` + areas into the `rooms` row, sets `measurement_source`. Idempotent. |
| `DELETE` | `/api/projects/[id]/room-model` | — | `204` | Also removes captures/derivatives per retention rules. |

Reuse existing `/api/ai/segment-room` for ad-hoc 2D masks; the room-model routes
supersede room-level analysis.

### 10.2 PATCH edit ops (Zod discriminated union — deliberately small)

```ts
type RoomModelEdit =
  | { op: "move_wall"; wallId: string; offsetIn: number }          // slide a wall along its normal
  | { op: "set_ceiling_height"; heightIn: number }
  | { op: "add_opening"; wallId: string; kind: "window" | "door"; rect: { uIn; vIn; widthIn; heightIn } }
  | { op: "update_opening"; openingId: string; rect: Partial<Rect> }
  | { op: "remove_opening"; openingId: string }
  | { op: "override_dimension"; entityId: string; field: "lengthIn" | "heightIn" | "widthIn"; valueIn: number }
  | { op: "mark_reviewed"; entityId: string }
  | { op: "set_room_shape"; shape: "rectangle" | "l_shape"; params: {...} };  // manual fallback
```

No free polygon editing in MVP — that's the CAD trap.

### 10.3 Processing states (`ai_jobs.status` + `output.stage`)

```
uploaded → processing → reconstructing → segmenting → building_model
        → awaiting_validation → ready
                              ↘ failed  (error string + partial model if any)
```

`awaiting_validation` = model exists but `calibrationStatus !== "user_confirmed"` or
entities have `needsReview`. The client renders the editor in "verify" mode.

### 10.4 Errors

| Code | When |
|---|---|
| `400` | bad body / unknown edit op / measurement out of sane range (< 12 in or > 100 ft) |
| `401` | no session |
| `403` | not project owner |
| `404` | no room model / capture not found |
| `409` | edit against a stale `version` (optimistic concurrency) |
| `422` | reconstruction produced a non-simple polygon → client offered manual fallback |
| `501` | `demoNotice` — real backend needed, demo substitutes |
| `502` | upstream inference vendor failed (after retry) → fallback path |

**Difficulty: MEDIUM. Build: `own` `server`.**

---

## 11. Database design

New migration `supabase/migrations/002_room_models.sql`. Same conventions as `001`
(`owns_project` RLS, `touch_updated_at` trigger, denormalized `project_id` for RLS).

### 11.1 Tables

```sql
-- one current model per room (history via version + optional room_model_versions later)
create table public.room_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  room_id    uuid not null references public.rooms (id)   on delete cascade,
  version    int  not null default 1,
  schema_version int not null default 1,
  source     text not null default 'demo',            -- demo | photo_cv | layout_model | manual | hybrid
  status     text not null default 'uploaded',
  calibration_status text not null default 'uncalibrated',
  scale_factor numeric not null default 1,
  bounds     jsonb not null default '{}',             -- { widthIn, lengthIn, heightIn }
  floor_polygon jsonb not null default '[]',
  ceiling_height_in numeric not null default 0,
  model      jsonb not null default '{}',             -- the full RoomModel.entities tree (§6) — SOURCE OF TRUTH
  confidence numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id)
);
create index room_models_project_idx on public.room_models (project_id);

create table public.room_captures (
  id uuid primary key default gen_random_uuid(),
  room_model_id uuid not null references public.room_models (id) on delete cascade,
  project_id    uuid not null references public.projects (id)    on delete cascade,  -- RLS
  storage_path text not null,                         -- room-captures/{projectId}/{id}.jpg
  kind text not null default 'photo',                 -- photo | frame
  width int, height int,
  ordinal int not null default 0,
  exif jsonb not null default '{}',                   -- focal length, orientation — GPS stripped
  created_at timestamptz not null default now()
);
create index room_captures_model_idx on public.room_captures (room_model_id);

create table public.room_measurements (
  id uuid primary key default gen_random_uuid(),
  room_model_id uuid not null references public.room_models (id) on delete cascade,
  project_id    uuid not null references public.projects (id)    on delete cascade,  -- RLS
  entity_id text not null,                            -- the RoomEntity.id inside model jsonb
  kind text not null,                                 -- wall_length | ceiling_height | opening_width | ...
  value_in numeric not null,
  source text not null default 'user',               -- user | auto | device
  created_at timestamptz not null default now()
);
create index room_measurements_model_idx on public.room_measurements (room_model_id);
```

### 11.2 Where geometry lives — Postgres vs Storage vs both

| Data | Home | Why |
|---|---|---|
| **Semantic model** (`entities` tree, polygons, dimensions, confidence) | **Postgres JSONB** (`room_models.model`) | Small (< 50 KB), always loaded together, needs to be *edited* transactionally and versioned. This is the source of truth. |
| Capture photos | **Storage** (`room-captures`) + metadata row | Binary, large-ish, kept for re-runs |
| Depth maps, segmentation masks | **Storage** (`room-depth`), regenerable | Debug + Phase-2 refinement; can expire |
| Raw point cloud / dense mesh (fallback path) | **Storage**, regenerable, **delete after model built** | Large, not needed once parametric model exists |
| Derived **GLB** + preview PNG | **Storage** (`room-models`), regenerable from `model` jsonb | Fast render / AR; cheap to regenerate so cheap to evict |

**MVP: do not normalize `room_surfaces` / `room_openings`.** The whole model is one
JSONB blob. Normalize only in Phase 2/3 when you need per-surface analytics, partial
updates at scale, or SQL joins from `project_items` to surfaces.

### 11.3 Relationships to existing entities

```
projects ─1─┬─< rooms ─1─1─ room_models ─1─<┬─ room_captures
            │                                └─ room_measurements
            └─< project_items.room_entity_id  ─→  (RoomEntity.id inside room_models.model)
                project_items.room_id           ─→  rooms.id   (existing)
```

`project_items` gets a nullable `room_entity_id text`. When set, quantity comes from
that entity's `netAreaSqFt`; when null, the current room-AABB behaviour is unchanged →
**fully backward compatible**.

### 11.4 RLS

```sql
alter table public.room_models        enable row level security;
alter table public.room_captures      enable row level security;
alter table public.room_measurements  enable row level security;

create policy "own room models" on public.room_models
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own room captures" on public.room_captures
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own room measurements" on public.room_measurements
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
```

**Difficulty: LOW–MEDIUM. Build: `own`.**

---

## 12. Storage design

New **private** buckets (Supabase Storage), path prefix always `{projectId}/`:

| Bucket | Contents | Retention | Regenerable? |
|---|---|---|---|
| `room-captures` | original photos / extracted video frames (JPEG, EXIF-oriented, GPS stripped, ≤ 2048 px) | **keep** while project exists | no — the raw input |
| `room-depth` | depth maps + segmentation masks (PNG/EXR) | 30 days then purge | yes (re-infer) |
| `room-reconstruction` | raw point cloud / dense mesh (fallback path only) | **delete once `status = ready`** | yes |
| `room-models` | derived `model.glb`, `preview.png`, later `model.usdz` | keep (cheap) | yes (from `model` jsonb) |

Reuse `project-renders` for material-applied 2D/3D render outputs.

### Upload flow (avoid proxying big files through the API route)

1. Client calls `POST …/room-model/captures` with file names + sizes.
2. Server validates count/size/type, creates `room_captures` rows, returns **signed
   upload URLs** scoped to `room-captures/{projectId}/{captureId}.jpg`.
3. Client `PUT`s each file directly to Storage.
4. Client calls `POST …/room-model/reconstruct` with the capture ids.
5. Server normalizes (sharp: orient, resize, HEIC→JPEG, strip GPS) into the same path,
   then runs the pipeline.

Storage RLS: path-based policy `bucket_id = 'room-captures' AND (storage.foldername(name))[1] = <projectId owned by auth.uid()>`.

**Difficulty: LOW–MEDIUM. Build: `own` + Supabase.**

---

## 13. 3D format strategy

Two artefacts, two jobs. **Never** use a visual mesh as the measurement source.

| Need | Format | Notes |
|---|---|---|
| **Semantic model** (measurement, editing, versioning) | **Custom JSON** (`RoomModel`, `schemaVersion`), stored in Postgres JSONB | No standard format carries `netAreaSqFt`, `quantifiable`, `confidence`, `surfaceKind`, `needsReview`. This is non-negotiable. |
| **Web rendering** | **GLB** (glTF 2.0 binary), generated from the parametric model | Parametric extrusion → a few hundred triangles → instant load in three.js. One material slot per surface entity, named by `entityId` so picking maps back to the model. |
| **Future AR (iOS Quick Look)** | **USDZ**, converted from GLB on demand | Phase 4. `<model-viewer>` handles GLB→AR on Android already. |
| **Future BIM handoff** | **IFC** (IFC4), one-way *export* from the semantic model | Phase 5. Maps cleanly: `IfcSpace` ← room, `IfcWallStandardCase` ← wall, `IfcWindow`/`IfcDoor` ← openings, `IfcSlab` ← floor/ceiling. |

Rejected: **OBJ** (no scene graph, clumsy materials), **glTF-JSON** (bigger than GLB
for no benefit), a **custom binary** (reinventing GLB), **FBX** (proprietary,
heavy), **point clouds as delivery** (not measurable, huge).

**Recommendation: GLB for rendering + JSON/JSONB for the semantic model**, with USDZ
and IFC as later derived exports. The GLB is always regenerable from the JSON, so the
JSON is the only thing that must be backed up carefully.

**Difficulty: LOW (GLB generation from parametric geometry via three.js `GLTFExporter` server-side, or build it client-side and skip storage). Build: `own`.**

---

## 14. Editor integration

### 14.1 Placement

The current editor lives at `app/[locale]/(app)/projects/[projectId]/editor` with
`components/editor/*` (canvas, sidebar = material library, properties panel,
toolbar, `SurfaceHotspots` for tap-a-surface). Add a **view mode toggle**, not a new
page:

```
components/editor/
  editor.tsx              → add <ViewModeToggle> (Photo | 3D)
  editor-canvas.tsx       → existing 2D photo canvas (unchanged)
  3d/
    room-scene.tsx        → <Canvas> (react-three-fiber), lazy-loaded
    surface-mesh.tsx      → one selectable mesh per quantifiable RoomEntity
    opening-mesh.tsx      → cut-outs / frames for windows & doors
    camera-rig.tsx        → OrbitControls  ↔  PointerLockControls ("walk")
    calibration-overlay.tsx → "confirm this wall length" prompt
    confidence-markers.tsx  → amber pins on needsReview entities
    room-scene-loader.tsx   → suspense boundary, skeleton
```

### 14.2 State — extend `hooks/use-editor.ts` (Zustand), no new store

```ts
interface EditorState {
  // ...existing (bundle, selectedItemId, activeSurface, undo/redo)...
  roomModel: RoomModel | null;
  viewMode: "photo" | "3d";
  selectedEntityId: string | null;          // a RoomEntity
  reconstructionJob: { status; stage; error } | null;

  loadRoomModel(projectId): Promise<void>;
  selectEntity(id: string | null): void;    // also sets activeSurface from entity.surfaceKind
  applyModelEdit(edit: RoomModelEdit): Promise<void>;   // → PATCH, optimistic + undo
  confirmMeasurement(entityId, valueIn): Promise<void>; // → calibrate
}
```

### 14.3 Interaction model (deliberately shallow — not a CAD)

| User action | Result |
|---|---|
| orbit / pan / zoom | `OrbitControls` |
| "Walk through" toggle | `PointerLockControls` at eye height (64 in), collision-free |
| click a surface | `selectEntity(id)` → highlight the mesh, set `activeSurface`, open the material sidebar filtered to that surface (reuses the existing sidebar behaviour) |
| pick a material | existing `itemService.add({ productId, surface, roomEntityId })` → quantity from `entity.netAreaSqFt` |
| "Compare" | render 2–3 saved *looks* on the same geometry, swap materials (reuses the existing scenario/"looks" mechanism) |
| amber pin → "Verify this window" | opens `update_opening` mini-form |
| "Adjust room" | slide a wall (`move_wall`), set ceiling height, add/remove an opening — that's it |

The user never sees: mesh, polygon, plane, RANSAC, point cloud, segmentation,
vanishing point. Those words do not appear in the UI.

### 14.4 Rendering the parametric model

- Floor / ceiling: `THREE.Shape` from `floorPolygon` → `ShapeGeometry`.
- Walls: `ExtrudeGeometry` per floor edge, or a simple quad; boolean-subtract openings
  with `three-bvh-csg` **or** (simpler, MVP) just render an opening frame + a
  darker inset quad — no real CSG needed for a plausible look.
- Materials: `MeshStandardMaterial` with the product's texture (`product.textureUrl`,
  new optional field) or its swatch colour. Purely visual.
- One hemisphere light + one directional; no baked GI. This stays fast.
- LOD: none needed — the whole room is < 1000 triangles.

**Difficulty: HIGH (it's a 3D editor). Build: `own` `client`.**

---

## 15. Material integration

The wall of separation the brief demands, made concrete:

| Concept | Where it lives | Feeds |
|---|---|---|
| **Product** — id, sku, brand, `unit`, `wastePercent`, `laborCategory`, price (per state), supplier, availability, lead time | `data/catalog.ts`, `lib/market/pricing-service`, `labor-rate-service` — **unchanged** | quantification + estimate |
| **Visual texture** — a tiling image for the 3D shader | **new optional** `Product.textureUrl` (+ `textureScaleIn`) | rendering only — **never** quantification |
| **Assignment** — "this product goes on this surface" | `project_items` row with `surface` + **new** `roomEntityId` | links the two |

When a product is applied to a 3D surface:

```
selectEntity("wall_02")
  → itemService.add({ productId, surface: "wall", roomEntityId: "wall_02" })
      → item.quantityAuto = true
      → quantity resolved from RoomEntity("wall_02").dimensions.netAreaSqFt
      → price / labor / tax  = existing market services, unchanged
```

A product with no `textureUrl` still works — it renders as its `swatch` colour. A
surface with no product renders as a neutral clay. No coupling.

**Difficulty: LOW. Build: `own` (1 field + 1 code branch).**

---

## 16. Quantification integration

**Zero new engine.** One new pure module + one new branch.

### 16.1 `lib/calculations/surfaces.ts` (new, pure, tested)

```ts
import { round } from "./money";

/** shoelace area of a closed polygon, inches² → sq ft */
export function polygonAreaSqFt(poly: Vec2[]): number { … }

/** polygon perimeter, inches → linear ft */
export function polygonPerimeterLinFt(poly: Vec2[]): number { … }

/** wall face area minus its openings */
export function wallNetAreaSqFt(lengthIn: number, heightIn: number, openings: Rect[]): number { … }

/** the one function the estimate calls */
export function entitySurfaceQuantity(entity: RoomEntity, unit: Unit): number {
  // sq_ft   → entity.dimensions.netAreaSqFt ?? grossAreaSqFt
  // linear_ft → entity.dimensions.perimeterLinFt   (baseboards, crown)
  // gallon  → netArea / 350   (reuses the existing paint assumption)
  // cu_ft / cu_yd → volume (rare; ceilings/soffits)
}
```

These call the **same** `round()` / unit helpers as `dimensions.ts`. No divergence.

### 16.2 One branch in `lib/calculations/estimate.ts`

```ts
export function resolveItemQuantity(
  item: ProjectItem,
  dimensions: RoomDimensions,
  entity?: RoomEntity,          // NEW optional arg
): number {
  if (item.kind === "object" || !item.quantityAuto) return item.quantity;
  const base = entity
    ? entitySurfaceQuantity(entity, item.unit)                 // ← 3D model path
    : baseSurfaceQuantity(item.surface, dimensions, item.unit); // ← existing path
  return calculateWaste(base, item.wastePercent);
}
```

Everything downstream — `calculateMaterialCost`, `calculateItemLabor`,
`calculateEstimate`, `calculateTaxes`, the market snapshot, the PDF — is **untouched**.

### 16.3 The brief's example, end to end

```
RoomEntity("floor_01").dimensions.netAreaSqFt = 250
  → entitySurfaceQuantity(floor_01, "sq_ft")            = 250
  → calculateWaste(250, 10)                             = 275      // purchase quantity
  → calculateMaterialCost(275, price("porcelain", "TX")) = $…      // existing pricing
  → calculateItemLabor(275, laborRate("tile_installation","TX"))   // existing labor
  → planTeardown() auto-adds demolition + haul-away      // already shipped in P3
  → calculateEstimate(...)                               // existing engine → range (already shipped)
```

The user picked a material. The system did everything else. Nothing was duplicated.

**Difficulty: LOW. Build: `own`.**

---

## 17. Demo mode strategy

Non-negotiable: `SPATIAL_PROVIDER=demo` (the default) works with **no external
services, no GPU, no network**.

### `DemoSpatialProvider` (`lib/ai/spatial/demo-spatial.ts`)

```ts
export const demoSpatialProvider: SpatialProvider = {
  id: "demo",
  isDemo: true,
  async reconstruct({ roomTypeHint, captures, onStage }) {
    // emit the real stage sequence with small delays so the UI is exercised
    for (const s of ["processing","reconstructing","segmenting","building_model","awaiting_validation"] as const) {
      onStage?.(s); await wait(500);
    }
    const seed = hashString(captures.map(c => c.id).join());
    const preset = ROOM_PRESETS[roomTypeHint ?? GUESSES[seed % GUESSES.length]];  // reuse existing presets
    return buildRectangularRoomModel({
      widthIn: preset.w, lengthIn: preset.l, heightIn: preset.h,
      openings: [
        { wall: 0, kind: "door",   widthIn: 32, heightIn: 80, offsetIn: 12 },
        { wall: 2, kind: "window", widthIn: 48, heightIn: 48, offsetIn: preset.w/2 - 24 },
      ],
      source: "demo",
      confidence: 0.8,
      calibrationStatus: "auto",
    });
  },
};
```

- `buildRectangularRoomModel()` is a **shared** helper also used by the *manual
  fallback* (§21) and by tests — one code path for "make a box room".
- Output passes the exact same `RoomModel` Zod schema as the real provider.
- The demo model still routes through §8 calibration UX (with `calibrationStatus:
  "auto"`), so the "confirm a measurement" flow is developed and demoed offline.
- Deterministic: same captures → same model. Tests assert this.

The entire editor, calibration, material assignment, quantification, estimate, and
PDF path is built and demoed **before any ML vendor is wired in**.

**Difficulty: LOW. Build: `own`.**

---

## 18. Testing strategy

`vitest`, `npm test`, **no external services** for unit tests. Mirrors the existing
`__tests__/{quantities,estimate,market,location-change,i18n}.test.ts` style.

| File | Asserts |
|---|---|
| `__tests__/surfaces.test.ts` | shoelace: a 12 ft × 15 ft rectangle → 180 sq ft; perimeter → 54 linear ft; L-shape area = sum of rectangles; `wallNetAreaSqFt(165.4, 106.3, [48×48]) ≈ 106.02` (the brief's wall). |
| `__tests__/room-geometry.test.ts` | plane classification (normal·up thresholds); wall–floor intersection → correct polygon edge; Manhattan snap to 90°; collinear-edge merge; rejects self-intersecting polygon. |
| `__tests__/calibration.test.ts` | raw model scale 1.0, wall reads 84 in, user confirms 168 in → `scaleFactor 2.0`, all `lengthIn` ×2, all `areaSqFt` ×4, `bounds` updated, `calibrationStatus: "user_confirmed"`; two conflicting scales > 15% → forces second confirmation. |
| `__tests__/surface-quantity.test.ts` | `entitySurfaceQuantity(floor{netArea:250}, "sq_ft")` → 250; `+ calculateWaste(_, 10)` → 275 (the brief's example); baseboards → `perimeterLinFt`; paint → `/350`. |
| `__tests__/room-model-serialization.test.ts` | `RoomModel` round-trips JSON; Zod schema accepts a valid model, rejects `units: "cm"`, rejects negative dimensions; `version` bumps on edit. |
| `__tests__/room-model-state.test.ts` | valid status transitions only; `failed` is terminal; `awaiting_validation` requires a model present. |
| `__tests__/demo-spatial-provider.test.ts` | deterministic output for fixed capture ids; always ≥ 4 walls + floor + ceiling + ≥ 1 opening; every entity `source: "demo"`; passes the `RoomModel` schema. |
| `__tests__/item-quantity-entity.test.ts` | `resolveItemQuantity` with an entity vs without → entity path used only when `roomEntityId` set; backward compatible when null. |
| `__tests__/imperial-invariant.test.ts` | scan a built model — `units === "in"`, no field name contains `cm`/`meter`/`metre`, all lengths finite & positive. |

Integration / e2e (Playwright, demo mode, optional in CI): upload 3 fixture images →
job reaches `ready` → editor renders 4 walls → select floor → apply tile → estimate
shows a non-zero range.

External-model tests: contract tests against **recorded fixtures** (VCR-style), run
in a separate `test:integration` script, never gating `npm test`.

**Difficulty: LOW–MEDIUM. Build: `own`.**

---

## 19. Performance strategy

| Concern | Approach | Notes |
|---|---|---|
| **Render payload** | parametric GLB, < 1000 triangles, no textures baked | The entire reason we don't ship a photogrammetry mesh. |
| **three.js bundle** | `next/dynamic` import of `room-scene.tsx`, only in 3D view | ~600 KB gzip stays off the 2D path and the estimate/PDF path. |
| **Textures** | product textures ≤ 1024², KTX2/Basis compressed, lazy per applied material, shared across identical products | |
| **Semantic model to client** | ships inside the project bundle (< 50 KB JSONB) | one fetch |
| **Depth maps / point clouds** | **never** sent to the browser | server-only artefacts |
| **If a visual mesh is added (Phase 2)** | Draco + meshopt compression, 2 LOD levels, load on explicit "show photo detail" toggle, decimate to ≤ 150k tris server-side | opt-in only |
| **Reconstruction latency** | 3 captures × (depth + seg + layout) ≈ 10–30 s wall-clock; run inferences in parallel; cache by image hash | show staged progress, not a spinner |
| **Editor interactions** | optimistic `applyModelEdit`, recompute areas locally (`surfaces.ts` runs client-side too), PATCH in the background | undo/redo already in `use-editor` |
| **Mobile/tablet** | parametric model runs at 60 fps on a tablet; disable shadows below a device-memory threshold | |

**Difficulty: LOW (because the geometry is deliberately tiny). Build: `own` `client` + `server`.**

---

## 20. Security strategy

Inherits every principle from the current app; nothing relaxed.

| Control | Applied to 3D |
|---|---|
| Authenticated session | every `/api/projects/[id]/room-model/*` route |
| Ownership | `owns_project(projectId)` on every route **and** re-checked in the reconstruction worker from the job row |
| No client `user_id` | job rows, model rows, measurement rows all derive owner from `projects` via the authenticated session |
| RLS | `room_models`, `room_captures`, `room_measurements` — `owns_project(project_id)` policy (§11.4) |
| Zod validation | every body; PATCH ops are a closed discriminated union; measurements range-checked (12 in – 100 ft); capture count/size/type limited |
| Storage policies | private buckets; signed upload URLs scoped to `room-captures/{projectId}/…`; path-prefix RLS tying the first folder segment to an owned project |
| Service-role usage | only the reconstruction worker; it never trusts input `project_id` — reads it from the `ai_jobs` row it was handed |
| PII | strip EXIF **GPS** on ingest; photos of interiors may contain people → never sent to a vendor without the room being an owned project; document vendor data-retention |
| Rate limiting | `reconstruct` (expensive) throttled per user/day; `calibrate`/`PATCH` normal |
| Abuse | max captures per model (10), max models per project (matches rooms), max file 15 MB (reuse `MAX_IMAGE_BYTES`) |

The room model **belongs to the project**; deleting a project cascades captures,
models, measurements, and Storage objects (a cleanup routine for Storage, since RLS
delete doesn't cascade blobs).

**Difficulty: LOW–MEDIUM. Build: `own` + Supabase policies.**

---

## 21. Failure / fallback strategy

Automatic reconstruction **will** fail on cluttered kitchens, mirrored rooms, tiny
bathrooms, and bad photos. The fallback must be *first-class*, not an error page.

```
photos ──▶ reconstruct
              │
   confidence ≥ 0.75  &  polygon simple  &  ≥ 3 walls
              │ yes                              │ no
              ▼                                  ▼
   awaiting_validation                  "We couldn't build this automatically."
   (verify 1–2 measurements)            GUIDED MANUAL MODEL
              │                          ┌─────────────────────────────┐
              ▼                          │ 1. Room shape?  ▢ Rectangle  │
        3D editor (verify mode)          │                 ▢ L-shaped   │
              │                          │ 2. Wall lengths (2–3 fields) │
   per-entity needsReview                │ 3. Ceiling height            │
   → amber pin, "Verify this"            │ 4. Windows/doors (optional)  │
              │                          └─────────────┬───────────────┘
              ▼                                        ▼
   estimate blocked from "final"         buildRectangularRoomModel()  ← SAME builder as demo
   until reviewed / accepted                          │
                                                      ▼
                                          identical RoomModel → identical downstream
```

- **Partial success:** 2 walls detected → infer a rectangle, mark 2 walls
  `confidence 0.4 / needsReview`, drop the user straight into verify mode with those
  two pre-highlighted.
- **Per-entity low confidence:** editor highlights amber; `confidenceReport()` gains
  `"unreviewed_geometry"`; the "Download estimate" button shows "Verify 2 items first"
  until cleared or the user taps "Use anyway".
- **Vendor outage:** retry once, then → guided manual model (never silently fall back
  to the *demo* provider for a real user — that would fabricate a room).
- **Manual mode is not a CAD:** shape + a handful of lengths + optional openings.
  Produces the same `RoomModel`, so materials/quantities/estimate are identical.

**Difficulty: LOW–MEDIUM. Build: `own` `client` + `server`.**

---

## 22. MVP scope

### Supported

- **1 room per project** (the app already models one primary room).
- **Rectangular** and **simple L-shaped** floor plans; all corners 90°.
- **Flat, single-height ceiling.**
- **4–6 walls.**
- Up to **~6 rectangular openings** (windows + doors), axis-aligned on their wall.
- **3–8 photos**, JPEG/PNG/HEIC, web upload with capture guidance.
- **Automatic scale** from priors + **1–2 user measurement confirmations**.
- Quantifiable surfaces: **floor, ceiling, each wall** — gross area, net area
  (minus openings), perimeter (baseboards/crown).
- **Material assignment per surface** → existing waste → purchase quantity → US
  market price → labor → tax → **estimate range** (all already built).
- **3D editor:** orbit / pan / zoom / walk-through; select surface; apply / swap /
  compare materials; slide a wall; set ceiling height; add/remove an opening.
- **Full demo mode** — the whole path offline.
- **Guided manual fallback** producing the same model.

### Not supported (MVP)

| Excluded | Phase |
|---|---|
| Curved / non-orthogonal walls | 2 |
| Sloped, vaulted, tray, coffered ceilings | 2 |
| Multi-room / whole-home stitching | 3 |
| Stairs, columns, niches, soffits as **quantifiable** entities (detected & shown only) | 2–3 |
| Video capture | 3 |
| Cabinetry / built-in millwork **geometry** (stays object-based line items) | 3+ |
| Structural / code / survey-grade output — **never** (disclaimer stays) | — |
| Real-time / on-device scanning | 4 |
| Metric units — **never** | — |
| Free-form polygon editing in the UI | — (deliberate) |
| Photorealistic render of the remodel | uses the existing composite stand-in; real inpainting is a separate seam |

### MVP definition of done

A homeowner uploads 4 phone photos of their bathroom, confirms one wall length,
sees a 3D bathroom with selectable floor/walls/ceiling, taps the floor, picks
"Porcelain Tile 24×24", and gets "$6,500 – $8,200 · Medium confidence" — with the
tile quantity (area + 10% waste), demolition, haul-away, labor, and sales tax all
computed automatically. Works in demo mode in CI.

---

## 23. Roadmap

| Phase | Theme | Ships | Reconstruction | Difficulty |
|---|---|---|---|---|
| **1 — MVP** | photo → parametric room → estimate | everything in §22; `DemoSpatialProvider` + one real `PhotoSpatialProvider` (hosted layout + depth + segmentation + Claude semantic layer); manual fallback | hosted models, 3–8 photos, 1–2 confirmations | **HIGH** |
| **2 — Better reconstruction** | fewer confirmations, harder rooms | non-orthogonal walls, sloped ceilings, more openings, SfM poses for multi-image fusion + robust scale, optional textured-mesh photo overlay, kitchen built-in handling | + SfM, + plane nets, multi-view depth | MEDIUM–HIGH |
| **3 — Video** | walk-and-capture | video upload → frame extraction/selection → same pipeline; real job **queue**; multi-room within one video | + COLMAP/hosted video-to-3D | HIGH |
| **4 — Mobile depth / AR** | metric capture, no calibration | PWA capture (WebXR depth where available) + optional native companion → ARKit RoomPlan / ARCore depth / LiDAR → metric point cloud; `ARKitSpatialProvider` drops into the existing seam | device SLAM/depth | HIGH (platform) |
| **5 — BIM / pro** | contractor & designer workflows | IFC export, measured-drawing PDF, multi-room floor plans, model revisions & sharing, 3DGS "walk your finished remodel" showcase | — | MEDIUM (mostly product) |

Each phase is shippable on its own; Phase 1 delivers the full user value.

---

## 24. Technical risks

| # | Risk | Likelihood | Impact | Mitigation | Residual |
|---|---|---|---|---|---|
| 1 | **Monocular scale error** (±5–8% after auto + 1 confirmation) | HIGH | MEDIUM | priors + user confirm + optional 2nd perpendicular measurement; waste factor absorbs small error; review gate before "final" estimate | MEDIUM |
| 2 | **Built-ins read as walls** — kitchen cabinets, tall wardrobes, fridges become "walls"; kitchens are our highest-value room | HIGH | HIGH | instance segmentation removes appliances/furniture before plane fitting; occlusion-aware wall completion; the user edit step; Claude cross-check ("model: 3 walls; photo: 4") | HIGH — invest most QA here |
| 3 | **Occlusion of the wall–floor line** (furniture against walls) | HIGH | MEDIUM | capture guidance ("shoot from the corners"), infer edge from visible portion + Manhattan prior, manual nudge | MEDIUM |
| 4 | **Non-box rooms** break assembly | MEDIUM | MEDIUM | MVP scope limits to rectangle/L; anything else → guided manual model | LOW (scoped out) |
| 5 | **Hosted-model dependency** — cost spikes, latency, deprecation, outage | MEDIUM | HIGH | `SpatialProvider` abstraction; **two** vendors; recorded-fixture contract tests; manual fallback on outage; cache by image hash | MEDIUM |
| 6 | **Editor scope creep toward CAD** | MEDIUM | MEDIUM | hard product rule: ≤ ~6 edit operations, no free polygon editing; every request to "just add one more tool" reviewed against the "homeowner, no know-how" principle | MEDIUM (organizational) |
| 7 | **Estimate liability** if areas are wrong and a contractor relies on them | LOW–MEDIUM | HIGH | mandatory review gate; confidence surfaced in the estimate (already built); existing "planning purposes only" disclaimer; never present as a survey | LOW–MEDIUM |
| 8 | **HEIC / EXIF orientation / huge phone photos** | MEDIUM | LOW | `sharp` normalization on ingest; size/type limits | LOW |
| 9 | **three.js perf on low-end tablets** | LOW | LOW | parametric geometry is tiny; shadow/AA toggles by device memory | LOW |
| 10 | **Reconstruction job reliability** (synchronous MVP, no queue) | MEDIUM | MEDIUM | job row + polling + timeout + resumable from cached inferences; move to a real queue in Phase 3 before video | LOW |
| 11 | **Vendor privacy** — interior photos, possibly with people, sent to a third party | MEDIUM | MEDIUM | strip GPS; choose vendors with no-training / short-retention terms; disclose in privacy policy; allow demo-only accounts | LOW–MEDIUM |

---

## 25. Implementation order

Ordered so that **steps 1–9 and 11–13 are fully buildable and shippable in demo
mode** — the entire UX, data model, and quantification land before any external ML.

| # | Step | Difficulty | Build | Blocks |
|---|---|---|---|---|
| 1 | `types/room-model.ts` + `lib/validations/room-model.ts` (Zod) — shapes only, no logic | LOW | own | everything |
| 2 | `lib/calculations/surfaces.ts` — shoelace area, perimeter, wall-net-area, `entitySurfaceQuantity` + `__tests__/surfaces.test.ts` | LOW–MEDIUM | own / server+client | 8 |
| 3 | `lib/ai/spatial/provider.ts` (`SpatialProvider`, `getSpatialProvider`) + `demo-spatial.ts` + shared `buildRectangularRoomModel()` + tests | LOW | own | 5, 6 |
| 4 | `lib/services/room-model-service.ts` — persist/load/version, localStorage + Supabase parity (follow `room-service.ts`) | MEDIUM | own / server | 5 |
| 5 | API: `POST reconstruct` (demo path, synchronous), `GET room-model`, job state machine on `ai_jobs` | MEDIUM | own / server | 6, 7 |
| 6 | `components/editor/3d/` — react-three-fiber scene, render the demo parametric model, `selectEntity`, wire to existing `activeSurface` + material sidebar; `use-editor` extension | HIGH | own / client | 7, 8 |
| 7 | Calibration UX (`calibration-overlay.tsx`) + `POST calibrate` + rescale math + `__tests__/calibration.test.ts` | MEDIUM | own / client+server | 8 |
| 8 | `resolveItemQuantity` entity branch + `item-service` `roomEntityId` + `POST apply-to-room` writeback + `__tests__/surface-quantity.test.ts` | LOW | own | — (estimate now works from 3D) |
| 9 | Fallback **guided manual model** flow (shape + lengths → `buildRectangularRoomModel`) | LOW–MEDIUM | own / client+server | — |
| 10 | **Real `PhotoSpatialProvider`**: signed-URL capture upload → `sharp` normalize → hosted depth + segmentation + layout + Claude semantic layer → `lib/ai/spatial/steps/*` (planes, assemble, openings) → `RoomModel`. Everything above is testable without this. | HIGH–VERY HIGH | own seam + api models / server | — |
| 11 | `PATCH` edit ops (`move_wall`, `set_ceiling_height`, opening CRUD, `override_dimension`, `mark_reviewed`) + optimistic apply + undo integration | MEDIUM | own / client+server | — |
| 12 | Review gate: `confidenceReport()` new reason codes; "Verify N items" on the estimate button | LOW | own | — |
| 13 | Migration `002_room_models.sql` + RLS + Storage buckets `room-captures` / `room-depth` / `room-models` + policies + project-delete cleanup routine | LOW–MEDIUM | own / Supabase | prod backend |
| 14 | GLB generation (`GLTFExporter`) + preview PNG → `room-models` bucket (optional; can render client-side only for MVP) | LOW | own / server | AR later |
| 15 | Playwright demo-mode e2e; recorded-fixture contract tests for the real provider (separate CI job) | LOW–MEDIUM | own | — |
| 16 | Phase 2+ per §23 | — | — | — |

### Suggested milestones

- **M1 (demo end-to-end):** steps 1–9. A user can go photo-upload → *demo* room →
  confirm a measurement → 3D editor → apply tile → estimate range. Shippable behind a
  flag. ~the bulk of the front-end + data work.
- **M2 (real reconstruction):** step 10 + 15. Swap `SPATIAL_PROVIDER=photo`.
- **M3 (production backend):** steps 11–14. Supabase tables, Storage, edit ops, review gate.
- **M4:** Phase 2 (§23).

---

## Appendix A — build/run split at a glance

| Runs **client-side** | Runs **server-side** | **External API** | **We build** |
|---|---|---|---|
| three.js editor, camera controls | reconstruction orchestration, job state | monocular depth | provider seam + demo provider |
| capture guidance UI | plane fitting / RANSAC / assembly | semantic segmentation (+ SAM 2) | architectural assembly + cleanup |
| calibration prompt UX | opening projection, cleanup | room-layout model | opening projection |
| optimistic model edits + local area recompute | scale calibration math | Vision-LLM (Claude) semantic layer | calibration math + rescale |
| GLB render (or client-only GLB build) | image normalization (`sharp`) | *(Phase 4)* ARKit/ARCore/LiDAR | semantic model + Zod schema |
| — | Storage signed URLs, RLS | *(Phase 2)* SfM / MVS | `surfaces.ts` + estimate branch |
| — | writeback to `rooms` | — | 3D editor, manual fallback, tests |

## Appendix B — what explicitly does NOT change

`lib/market/*` · `lib/calculations/{money,taxes,labor,units,conversions,estimate*}`
(only a one-arg addition to `resolveItemQuantity`) · estimate generation · market
snapshots · PDF · the consumer redesign (photo-first entry, cost ranges, "Looks",
material library, auto teardown) · `AI_PROVIDER` / the existing `AIProvider` ·
Supabase as the backend · the localStorage demo store · imperial units · one room per
project · `rooms` as the geometry↔app contract.
