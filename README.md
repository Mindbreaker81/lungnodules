# Lung Nodule Follow-Up Decision Support Tool

Aplicación clínica para recomendar seguimiento de nódulos pulmonares según Fleischner 2017 y Lung-RADS v2022.

## Estado
- PRD: `PRD-LungNoduleTracker.md`
- TODO operativo: `TODO.md`
- CHANGELOG: `CHANGELOG.md`
- Algoritmos iniciales en `lib/algorithms/`
- Esquemas de validación en `lib/schemas/`

## Características
- **Wizard interactivo** con validación paso a paso
- **Guías clínicas**: Fleischner 2017 (incidental) y Lung-RADS v2022 (screening)
- **Modelos predictivos**: Mayo Clinic, Brock (Pan-Can), Herder (post-PET)
- **UI responsiva** con PWA (offline-first)
- **Exportación** de resultados en texto/JSON
- **Analytics** de uso y errores

## Scripts
- `dev`: arranca Next.js en modo desarrollo
- `test`: ejecuta pruebas unitarias
- `lint`: ejecuta ESLint/Prettier
