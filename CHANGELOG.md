# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Inicialización de TODO general basado en PRD v1.0 (Jan 2026).
- Estructura de dominio y algoritmos completos (Fleischner 2017, Lung-RADS v2022).
- Wizard UI completo (Context, Risk/Scan, Nodule, Results) con validaciones Zod y React Hook Form.
- PWA (manifest, SW cache-first + banner offline, icono SVG) y vercel.json con headers de seguridad.
- Pruebas: unit (algoritmos), integración wizard, smoke E2E Playwright (desktop/móvil).
### Changed
- UI resultados: muestra crecimiento >1.5mm/12m y nota de nódulo dominante/múltiples.
- Tests de flujo wizard envueltos en `act` para evitar warnings y mejorar estabilidad.

