# Informe de auditoría clínica y técnica: Lung Nodule Decision Support

**Fecha:** 2026-04-10  
**Rama:** `main`  
**Estado auditado:** base `1.1.5`, documentado en `1.1.6`  
**Metodología:** revisión estática de código, ejecución de validadores, pruebas manuales en navegador y revisión de configuración/CI.

---

## 1. Resumen ejecutivo

### Veredicto
La aplicación es un prototipo bien estructurado y funcional, pero **todavía no debería aprobarse para uso clínico/producción**. La principal razón no es la estabilidad técnica básica, sino la existencia de **desviaciones confirmadas respecto a Lung-RADS v2022 y Fleischner 2017**, junto con contradicciones de privacidad, riesgo de servir contenido clínico obsoleto desde caché y brechas de accesibilidad/gobernanza.

### Fortalezas observadas
- Separación razonable entre UI, esquemas, algoritmos clínicos y modelos predictivos.
- Cobertura automatizada útil sobre algoritmos y flujos principales.
- Flujos manuales principales operativos: landing, wizard incidental, wizard screening y calculadora de elegibilidad.
- Validadores de calidad ejecutables localmente tras corregir pequeños bloqueos de lint/typecheck.

### Decisión de auditoría
- **Aprobación clínica:** No
- **Aprobación técnica para prototipo interno supervisado:** Sí, con reservas
- **Aprobación para producción clínica:** No

---

## 2. Alcance y metodología

### Superficies revisadas
- Algoritmos clínicos: `lib/algorithms/fleischner.ts`, `lib/algorithms/lungRads.ts`
- Modelos predictivos: `lib/predictive/index.ts`
- Elegibilidad PLCOm2012: `lib/eligibility/plcom2012.ts`, `lib/eligibility/plcom2012Schema.ts`
- Validación de inputs: `lib/schemas/noduleInput.ts`
- Wizard/UI: `components/wizard/*`, `components/LegalFooter.tsx`, `app/page.tsx`, `app/layout.tsx`
- Persistencia/caché: `lib/analytics/index.ts`, `public/sw.js`
- CI/CD y despliegue: `.github/workflows/*`
- Documentación/legal: `MEDICAL_DISCLAIMER.md`, `public/MEDICAL_DISCLAIMER.md`, `config/guidelines.ts`

### Métodos aplicados
1. Revisión dirigida de código y configuración.
2. Ejecución de validadores locales (`lint`, `tsc`, `jest`, `build`, `playwright`).
3. Pruebas manuales en navegador de los flujos principales.
4. Comparación de la lógica con el comportamiento esperado de Fleischner 2017 y Lung-RADS v2022.

---

## 3. Hallazgos confirmados prioritarios

| Área | Severidad | Hallazgo | Evidencia | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| Clínica | Alta | `S` de Lung-RADS está modelado como categoría independiente y no como modificador | `lib/algorithms/lungRads.ts` | Puede deformar la clasificación final y la recomendación de manejo |
| Clínica | Alta | La regla de crecimiento de Lung-RADS es demasiado permisiva | `calculateGrowth()` en `lib/algorithms/lungRads.ts` | Riesgo de sobreelevar categorías en seguimientos largos |
| Clínica | Alta | La clasificación de nódulos parte-sólidos en seguimiento no contempla correctamente umbrales de nuevo/en crecimiento | `classifyPartSolid()` en `lib/algorithms/lungRads.ts` | Puede infra/sobreclasificar riesgo |
| Clínica | Alta | Los GGN estables o de crecimiento lento `>=30 mm` se sobredimensionan | `classifyGroundGlass()` en `lib/algorithms/lungRads.ts` | Riesgo de seguimiento o intervención innecesaria |
| Clínica | Alta | La categoría `0` de Lung-RADS queda incompleta para hallazgos que requieren estudio adicional | `getSpecialCategory()` y flujo general de `lungRads.ts` | Gestión insuficiente de casos incompletos/inflamatorios |
| Clínica | Alta | Fleischner para parte-sólidos con componente sólido `>=6 mm` omite la TC de confirmación a 3-6 meses | `assessPartSolid()` en `lib/algorithms/fleischner.ts` | Puede acelerar PET/biopsia antes de confirmar persistencia |
| Privacidad | Alta | La app persiste analytics en `localStorage` pero el footer y los disclaimers afirman que no se almacena nada | `lib/analytics/index.ts`, `components/LegalFooter.tsx`, `MEDICAL_DISCLAIMER.md` | Riesgo de incumplimiento de expectativas de privacidad y claims engañosos |
| Seguridad/Operación | Alta | El service worker usa estrategia cache-first amplia con nombre de caché fijo | `public/sw.js` | Puede servir recomendaciones clínicas obsoletas tras cambios de lógica o contenido |
| UX clínica | Media-Alta | El wizard arranca con datos clínicos precargados (`edad 50`, `5 mm`, `low risk`) | `components/wizard/WizardContainer.tsx` | Favorece errores por omisión o confirmación insuficiente |
| Accesibilidad | Media | El documento HTML sigue marcado con `lang="en"` aunque la UI está en español | `app/layout.tsx` | Peor experiencia con lectores de pantalla y herramientas de traducción/SEO |
| Accesibilidad | Media | El toggle del disclaimer no expone `aria-expanded` | `components/LegalFooter.tsx` | Reduce usabilidad asistiva |
| Gobernanza | Media | Preview/staging no imponen todas las puertas de calidad antes de desplegar | `.github/workflows/deploy-preview.yml`, `.github/workflows/deploy-staging.yml` | Riesgo de publicar previews con defectos clínicos o de interfaz |

---

## 4. Hallazgos posibles o pendientes de confirmación

1. **Brock (Pan-Can):** la fórmula implementada requiere contraste final con la publicación original para confirmar que el tratamiento del tamaño coincide exactamente con el modelo validado.
2. **Mayo Clinic:** el modelo se expone sin una restricción explícita de nódulo solitario, aunque ese era el contexto clásico de derivación.
3. **Herder sobre Brock:** ya existe una advertencia, pero el encadenamiento Brock -> Herder sigue teniendo evidencia más limitada que Mayo -> Herder.
4. **Perifissural/yuxtapleural:** los atajos morfológicos merecen revisión clínica adicional para asegurar que no se apliquen fuera del patrón benigno típico.
5. **Validación de formularios:** la mezcla de validación Zod + lógica manual del wizard crea riesgo de divergencia futura.

---

## 5. Estado de validación en esta auditoría

| Comando | Resultado | Notas |
| :--- | :--- | :--- |
| `npm run lint` | Pasa | Se corrigió un bloqueo previo por constante sin uso |
| `npx tsc --noEmit` | Pasa | Se corrigieron tests con `patient.id` no tipado |
| `npm test --runInBand` | Pasa | `90/90` tests en verde |
| `npm run build` | Pasa | Build de producción correcta con Next.js 16.1.6 |
| `npm run test:e2e` | Pasa | `4/4` smoke tests verdes tras instalar Chromium de Playwright |
| `npm audit` | Falla | `11` vulnerabilidades (`1` crítica, `3` altas, `3` moderadas, `4` bajas) |

### Pruebas manuales ejecutadas
- Landing y navegación principal
- Flujo incidental (Fleischner)
- Flujo screening (Lung-RADS)
- Calculadora de elegibilidad PLCOm2012
- Vista móvil aproximada (`390x844`)
- Comportamiento con coma/punto decimal
- Manejo de follow-up sin datos previos completos

---

## 6. Mapa arquitectónico observado

- `app/`: rutas Next.js (`/`, `/assessment`, `/eligibility`)
- `components/wizard/`: orquestación del formulario clínico y presentación de resultados
- `lib/schemas/`: contratos Zod para entradas clínicas
- `lib/algorithms/`: motores de recomendación Fleischner / Lung-RADS
- `lib/predictive/`: Mayo, Brock, Herder
- `lib/eligibility/`: PLCOm2012 y registro de elegibilidad
- `lib/analytics/`: eventos locales y agregación simple
- `public/sw.js`: soporte offline/caché
- `.github/workflows/`: CI, previews y staging

La arquitectura favorece mantenimiento y testeo, pero la **seguridad clínica depende de que la lógica normativa y la copia legal permanezcan sincronizadas**, algo que hoy no se cumple de forma consistente.

---

## 7. Recomendaciones priorizadas

### P0 — Antes de cualquier uso clínico real
1. Corregir las desviaciones confirmadas de `Lung-RADS` y `Fleischner`.
2. Convertir `S` en modificador aditivo y revisar por completo el árbol de decisión de seguimiento.
3. Reconciliar privacidad real vs claims legales/UI.
4. Eliminar defaults clínicamente significativos del wizard o forzar confirmación explícita.

### P1 — Antes de un despliegue más amplio
1. Sustituir el service worker cache-first por estrategia versionada y más conservadora.
2. Añadir tests de regresión para cada hallazgo clínico confirmado.
3. Corregir `lang`, estados ARIA y asociaciones de labels.
4. Endurecer gates de preview/staging para exigir al menos `lint`, `tsc`, `test` y `build`.

### P2 — Fortalecimiento de producto
1. Revisar dependencias vulnerables y actualizar `next` y transitive deps afectadas.
2. Separar con mayor claridad validación de dominio vs validación de UI.
3. Añadir tests de analytics, service worker y accesibilidad.
4. Revisar con especialista radiológico la implementación final de Brock/Herder y shortcuts morfológicos.

---

## 8. Conclusión

La base técnica es buena y el proyecto ya demuestra valor como **prototipo clínico supervisado**, pero todavía no alcanza el listón de una herramienta de soporte a decisiones lista para producción. La prioridad no es rehacer la arquitectura, sino **alinear la lógica clínica con las guías, corregir las contradicciones legales/técnicas y endurecer las garantías de calidad antes de liberar**.
