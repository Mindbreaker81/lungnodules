# Lung Nodule Follow-Up Decision Support Tool

Aplicación clínica para recomendar seguimiento de nódulos pulmonares según Fleischner 2017 y Lung-RADS v2022.

## Estado
- PRD: `PRD-LungNoduleTracker.md`
- TODO operativo: `TODO.md`
- CHANGELOG: `CHANGELOG.md`
- Algoritmos iniciales en `lib/algorithms/`
- Esquemas de validación en `lib/schemas/`

## Siguientes pasos (alto nivel)
1) Inicializar proyecto Next.js 14+ con TypeScript, Tailwind, shadcn/ui.
2) Conectar wizard UI a algoritmos (Fleischner/Lung-RADS) usando React Hook Form + Zod.
3) Agregar pruebas unitarias y E2E (Jest/Playwright).
4) Configurar PWA y despliegue en Vercel.

## Scripts esperados (cuando se inicialice el proyecto)
- `dev`: arranca Next.js en modo desarrollo.
- `test`: ejecuta pruebas unitarias.
- `lint`: ejecuta ESLint/Prettier.
