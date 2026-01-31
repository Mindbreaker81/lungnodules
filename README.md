# Lung Nodule Follow-Up Decision Support Tool

Aplicación clínica para recomendar seguimiento de nódulos pulmonares según Fleischner 2017 y Lung-RADS v2022.

[![Security: Status](https://img.shields.io/badge/Security-Active-brightgreen.svg)](SECURITY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![Version: 1.0.1](https://img.shields.io/badge/Version-1.0.1-blue.svg)](CHANGELOG.md)
## :rotating_light: Seguridad y Disclaimer Médico

**⚠️ Importante:** Esta herramienta es solo para soporte de decisiones clínicas. Ver [MEDICAL_DISCLAIMER.md](MEDICAL_DISCLAIMER.md) para información importante sobre su uso.

**🔒 Seguridad:** ¿Encontraste una vulnerabilidad? Por favor repórtala de forma privada:
- Revisa nuestra [Política de Seguridad](SECURITY.md)
- Usa el [GitHub Security Advisory](../../security/advisories) para reportes confidenciales

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
