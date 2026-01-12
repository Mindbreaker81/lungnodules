# Kickoff para nuevo desarrollador

## Contexto
- Proyecto: Lung Nodule Decision Support Tool (Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui).
- Guías implementadas: Fleischner 2017 y Lung-RADS v2022 en `lib/algorithms`.
- Validaciones: Zod + React Hook Form (`lib/schemas` y wizard).
- PWA: manifest, service worker cache-first, icono SVG, banner offline.
- Deploy target: Vercel (`vercel.json` con headers de seguridad).

## Estado actual
- Wizard completo en `/assessment` (Context → Risk/Scan → Nodule → Results) con bloqueo por validación y mensajes de growth/edge cases.
- Resultados muestran crecimiento >1.5mm/12m y nota para nódulos múltiples (dominante); aviso si solid component > diámetro en NoduleStep.
- Tests: unit (algoritmos), integración del wizard (flujos incidental/screening), smoke E2E Playwright (desktop/móvil) pasando.
- Lint/format: ESLint + Prettier; .gitignore actualizado para no versionar `node_modules`, `.next`, reportes.

## Pendientes clave (prioridad)
1) Regresión de stepped management/growth (tests adicionales).
2) Completar tablas/constantes en `config/guidelines.ts`.
3) Analytics/métricas: eventos `assessment_started/completed/result_copied/error_displayed`, time-to-result, NPS in-app.
4) Pipeline CI/CD: previews PR, staging (develop), producción (main) + performance (FCP/TTI, Lighthouse).
5) Validación clínica: versionado visible en resultados/export, paquete 50 casos para panel experto, disclaimer exportable.
6) UX copiar/exportar resultados y mejorar indicador offline si aplica.

## Cómo correr
```bash
npm install
npm run dev        # puerto 3000
npm test           # unit + integración
npm run test:e2e   # requiere dev server; navegadores Playwright ya instalados
```

## Ramas y convenciones
- Rama principal: `main`.
- Commits pequeños y descriptivos. No versionar artefactos (`node_modules`, `.next`, reportes).

## Contactos rápidos
- PRD principal: `PRD-LungNoduleTracker.md` en raíz.
- TODO y estado: `TODO.md`.
- Changelog: `CHANGELOG.md`.
