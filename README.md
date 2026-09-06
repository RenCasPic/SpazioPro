# SpazioPro

Diseña espacios interiores a partir de una fotografía y genera un
presupuesto orientativo de materiales, mobiliario y mano de obra.

> **Nombre provisional.** Estimación orientativa: los precios y cantidades
> pueden variar según proveedor, mediciones reales, condiciones del espacio y
> mano de obra.

## Qué incluye el MVP

| Flujo | Ruta | Estado |
| --- | --- | --- |
| Landing + onboarding | `/` | ✅ |
| Dashboard "Mis proyectos" | `/dashboard` | ✅ CRUD + estados |
| Crear proyecto (nombre + tipo) | `/projects/new` | ✅ asistente 3 pasos |
| Subir fotografía (archivo / cámara / drag&drop) | `/projects/new` | ✅ con reescalado |
| Análisis con IA ("Analizando tu espacio…") | `/projects/new` | ✅ modo demo |
| Editor visual (catálogo · lienzo · propiedades) | `/projects/[id]/editor` | ✅ |
| Seleccionar zona (suelo / paredes / techo) y aplicar material | editor | ✅ |
| Añadir / mover / rotar / escalar / duplicar / eliminar mobiliario | editor | ✅ |
| Medición (dimensiones → m², ml, desperdicio) | editor | ✅ |
| Escenarios (Económico / Estándar / Premium + personalizados) | editor | ✅ |
| Undo / redo, zoom, ajustar, pantalla completa | editor | ✅ |
| Presupuesto (materiales, mano de obra, IVA/transporte/descuento) | `/projects/[id]/budget` | ✅ |
| Comparación antes / después (slider y lado a lado) | `/projects/[id]/compare` | ✅ |
| Exportación PDF profesional | budget | ✅ jsPDF |

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · componentes propios ligeros (estilo shadcn)
- **Zustand** para el estado del editor (con historial undo/redo)
- **jsPDF** para el presupuesto
- Persistencia: `localStorage` mediante `projectService` — sin backend necesario

## Arquitectura de IA (multi-proveedor)

```
src/services/ai/
├── types.ts          # interfaz AIProvider (analyzeRoom · generateDesign · estimate)
├── demoProvider.ts    # implementación 100% offline (modo DEMO)
└── index.ts           # getAIProvider() — selecciona por NEXT_PUBLIC_AI_PROVIDER
```

Los servicios de dominio (`visionService`, `imageGenerationService`,
`estimationService`) sólo hablan con `getAIProvider()`; ningún componente
importa un SDK de proveedor. Para conectar un proveedor real:

1. crea `src/services/ai/providers/<vendor>Provider.ts` que implemente `AIProvider`
2. regístralo en el `switch` de `src/services/ai/index.ts`
3. `NEXT_PUBLIC_AI_PROVIDER=<vendor>` y `AI_API_KEY=…` en `.env.local`

## Persistencia / Supabase

El MVP usa `localStorage`. `src/services/projectService.ts` define la interfaz
`ProjectRepository`; implementarla contra Supabase (esquema de referencia en
[`supabase/schema.sql`](supabase/schema.sql)) y exportar ese repositorio es todo
lo necesario — cada llamada ya es `async`.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # opcional; el modo demo funciona sin claves
npm run dev
```

Estructura:

```
src/
├── app/           rutas (landing, dashboard, wizard, editor, budget, compare)
├── components/     ui/ · layout/ · brand/ · dashboard/ · upload/ · analyze/ · editor/ · budget/ · compare/
├── lib/           store (zustand) · calc · estimate · format · image · toast · utils
├── services/      projectService · productService · pdfService · visionService · imageGenerationService · estimationService · ai/
├── data/          catalog (demo) · categories · labor
└── types/         modelo de dominio
```
