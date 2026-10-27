# Instrucciones para agentes

Este proyecto usa **YouTrack** (proyecto **LUN** — «Lung Nodules», https://youtrack.int.mindbreaker81.eu) para tareas y **CHANGELOG.md** para versionado. Sigue estas reglas en cada sesión y en cada commit.

---

## 1. Sesión: inicio y tareas pendientes

- **Al iniciar una conversación** (o después de `/clear`): consulta las issues abiertas de LUN (`project: LUN #Unresolved`) para ver el estado actual y las tareas accionables.
- **Objetivo**: que siempre se sepa si hay tareas pendientes en YouTrack antes de proponer trabajo nuevo.

Si el usuario pide empezar algo que implica varios pasos o entregables:
- Comprueba si ya existe una issue en LUN para ello (búsqueda por texto o por la issue padre relacionada).
- Si no existe y el trabajo es acotable, crea una issue en LUN (como subtarea de la issue padre si procede) y pásala a **In Progress** al comenzar.

**Campos del proyecto:**

| Campo | Valores |
|-------|---------|
| State | `To do` → `In Progress` → `Done` |
| Priority | `Show-stopper`, `Critical`, `Major`, `Normal`, `Minor` |

---

## 2. Cierre de sesión o de trabajo

- **Antes de dar por terminada una sesión** en la que se haya trabajado en issues de LUN:
  - Si una issue queda **sin terminar**: añade un comentario de handoff (ver 2.1) y déjala en `In Progress`.
  - Si se completó el trabajo: pasa la issue a `Done` y comenta qué se hizo, con versión y commit.
- **No cerrar la conversación** sin haber comprobado si queda algo pendiente en LUN.

### 2.1 Comentario de handoff

Al dejar una issue abierta, añade un comentario con esta estructura para que la siguiente sesión (u otra persona/agente) pueda retomarla:

```markdown
**Handoff (YYYY-MM-DD)** — rama `<rama>` @ `<commit corto>`
- **Hecho:** …
- **Pendiente:** …
- **Decisiones:** …
- **Dudas:** …
```

---

## 3. Commits y versionado

- **Antes de hacer cualquier commit**: usa el skill **smart-commit-with-versioning** (proyectos con CHANGELOG.md).
- **Flujo obligatorio en cada commit**:
  1. Leer versión actual en `CHANGELOG.md`.
  2. Incrementar versión (patch/minor/major según tipo de cambio).
  3. Añadir sección nueva en `CHANGELOG.md` con la fecha y las entradas (Added/Changed/Fixed).
  4. Actualizar versión en `README.md`, `config/guidelines.ts` (APP_VERSION), `package.json` y `public/manifest.json` si aplica.
  5. Comprobar las issues relacionadas en LUN; si hay incompletas, preguntar al usuario antes de commitear.
  6. Hacer el commit con mensaje que incluya la versión, un resumen de cambios y los IDs de LUN afectados (p. ej. `LUN-16`).

No hagas commits “rápidos” sin actualizar CHANGELOG y versión; cada commit debe dejar el proyecto con versión consistente.

---

## 4. Resumen rápido

| Momento        | Acción |
|----------------|--------|
| Inicio sesión  | Revisar issues abiertas: `project: LUN #Unresolved` |
| Inicio de trabajo acotado | Buscar/crear issue en LUN y pasarla a `In Progress` |
| Antes de cerrar sesión | Comentario de handoff en issues abiertas o pasar a `Done` |
| Antes de commit | Usar skill **smart-commit-with-versioning** (CHANGELOG + versión + README + issues LUN) |
