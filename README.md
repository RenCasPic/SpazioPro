# SpazioPro — Visualiza. Presupuesta. Construye.

Plataforma para arquitectos, interioristas y empresas de reforma: convierte la
**fotografía de un espacio** en una **propuesta de diseño** y en un
**presupuesto profesional** con precios, impuestos, mano de obra y transporte
del **mercado del proyecto**.

> Estimación orientativa. Los precios y cantidades pueden variar en función de
> las mediciones reales, condiciones del espacio, disponibilidad de materiales,
> proveedor, ubicación y mano de obra.

---

## Arranque rápido (modo demo, sin servicios externos)

```bash
npm install
cp .env.example .env.local     # opcional — el modo demo funciona sin nada
npm run dev                     # http://localhost:3000
npm test                        # tests de cálculos, mercado y permisos
```

Cuenta demo prellenada: `demo@spaziopro.app` / `demo`. Los datos se guardan en
el navegador (localStorage) y las respuestas de IA se simulan localmente.

---

## Flujo del producto

```
Fotografía → Análisis IA → Diseño → Materiales → Mediciones → Cantidades
→ Precios locales → Mano de obra → Transporte → Impuestos → Presupuesto → PDF
```

| Área | Ruta |
| --- | --- |
| Landing | `/` |
| Auth (demo o Supabase) | `/login`, `/register` |
| Onboarding (país obligatorio) | `/onboarding` |
| Dashboard | `/dashboard` |
| Clientes (CRUD) | `/clients` |
| Catálogo (precios por mercado) | `/catalog` |
| Presupuestos + snapshots | `/estimates`, `/estimates/[id]` |
| Proyecto | `/projects/[id]` · `editor` · `images` · `budget` · `scenarios` · `settings` |
| Nuevo proyecto (asistente) | `/projects/new` |
| Perfil profesional | `/settings` |

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind v4 ·
shadcn-style components propios · Zustand (estado del editor + undo/redo) ·
React Hook Form + Zod · TanStack Query · jsPDF · Recharts · Lucide.

---

## Arquitectura

```
UI (app/, components/)
  ↓
hooks/                 use-editor · use-project · use-estimate · use-products · use-market · use-ai
  ↓
lib/services/          project · room · item · image · client · estimate · config · profile · pdf
  ↓
lib/market/            country · currency · tax · pricing · labor-rate · transport · catalog · market
lib/calculations/      quantities · materials · labor · transport · taxes · estimate · money
lib/ai/                provider (abstracción) + demo-provider (offline)
  ↓
lib/db/ (localStorage, modo demo)   ·   lib/supabase/ + supabase/migrations (backend)
```

Nada de lógica de negocio en `page.tsx`. Los cálculos son funciones puras y
testeadas en `__tests__/`.

### Multi-país

15 mercados (`lib/market/data/`). Añadir un país = añadir sus filas de
country / tax / labor / transport / fx. **La lógica nunca ramifica por código de
país.** El país del proyecto determina moneda, locale, impuestos, catálogo,
precios, mano de obra, transporte y sistema de medida.

### Precios

Prioridad de resolución (`lib/market/pricing-service.ts`):

```
1. Precio local de mercado del país
2. Precio de proveedor local
3. Precio de mercado almacenado
4. Conversión de divisa — SOLO referencia, siempre marcada `source: "converted"`
```

Un precio convertido **nunca** sustituye silenciosamente a un precio local.

### Presupuestos reproducibles

Al generar un presupuesto se congela un `market_snapshot` (precios, impuestos,
tarifas de mano de obra, transporte y tipos de cambio) y un `price_snapshot` por
línea. Un presupuesto histórico **no cambia** aunque después cambie un precio,
un impuesto, una tarifa o un tipo de cambio. La recalculación es explícita.

### Cambio de país de un proyecto

`projectService.changeCountry()` recalcula moneda, impuestos, precios de cada
elemento y tarifas de mano de obra — tras confirmación del usuario
(`ChangeCountryDialog`). Nunca en silencio. Los presupuestos ya generados
conservan su snapshot.

### IA

`lib/ai/provider.ts` define `VisionProvider`, `SegmentationProvider`,
`ImageGenerationProvider`, `EstimationProvider`. `AI_PROVIDER=demo` (por
defecto) usa `demo-provider.ts`, sin red ni claves, respetando exactamente las
mismas interfaces que un proveedor real. Endpoints: `/api/ai/{analyze-room,
segment-room,generate-design,estimate}`.

---

## Backend Supabase (opcional)

1. Crea un proyecto Supabase.
2. Aplica `supabase/migrations/001_initial_schema.sql` (tablas, índices,
   **RLS**, trigger de alta de perfil).
3. Aplica `supabase/seed.sql` (`npm run seed` lo regenera desde los mismos
   módulos de datos que usa la app: 15 países, 30 productos, 150 precios de
   mercado).
4. Rellena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` y pon `DEMO_MODE=false`.
5. Storage: crea los buckets `project-images`, `project-renders`, `avatars`,
   `pdfs`, `product-images` con políticas por propietario.

Con Supabase configurado, las rutas `/api/projects` y `/api/estimates` operan
contra la base de datos con autorización *server-side* + RLS; en modo demo
responden `501` y la persistencia es del navegador (`lib/services/*`).

### RLS

Cada usuario solo accede a sus proyectos, clientes, habitaciones, imágenes,
escenarios, items y presupuestos (`public.owns_project()`). El catálogo y los
datos de mercado son de lectura pública; escritura solo con service role.

---

## API

```
GET  /api/countries            GET /api/countries/[code]
GET  /api/markets/[countryCode]
GET  /api/products             GET /api/products/[id]   GET /api/products/[id]/price?country=PY
GET  /api/labor-rates?country=PY   GET /api/tax-rates?country=PY
POST /api/currency/convert
GET/POST        /api/projects        GET/PATCH/DELETE /api/projects/[id]
GET/POST        /api/estimates       GET             /api/estimates/[id]
POST /api/ai/analyze-room | segment-room | generate-design | estimate
POST /api/pdf/estimate
```

Todas las entradas se validan con Zod (`lib/validations/`). Las rutas que
modifican datos comprueban sesión + propiedad; el `userId` nunca se toma del
cliente.

---

## Tests

```bash
npm test
```

Cubren: superficies y desperdicio (`21,42 × 1,10 = 23,56 m²`), motor de
presupuesto (descuento antes de impuestos, transporte configurable, moneda
preservada), niveles de confianza, mercado multi-país (moneda / impuesto /
mano de obra por país, prioridad de precio local sobre conversión, snapshot
congelado) y aislamiento entre usuarios.

---

## Scripts

| Script | Acción |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run build` / `npm start` | build de producción |
| `npm test` | vitest |
| `npm run seed` | regenera `supabase/seed.sql` desde los datos de la app |
| `npm run lint` | ESLint |

---

## Roadmap (arquitectura preparada, no implementado)

Integración con proveedores y catálogos oficiales, costes por ciudad, inflación
y tipos de cambio en vivo, equipos multiusuario y roles, facturación y firma
digital, seguimiento de obra, API pública, medición avanzada / BIM.
