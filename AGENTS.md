# Instrucciones para agentes

Este proyecto usa **td** para tareas y **CHANGELOG.md** para versionado. Sigue estas reglas en cada sesión y en cada commit.

---

## 1. Sesión: inicio y tareas pendientes

- **Al iniciar una conversación** (o después de `/clear`): ejecuta `td usage --new-session` para ver el estado actual y las tareas accionables.
- **Durante la sesión**, para refrescar contexto: `td usage -q` (solo items accionables, sin instrucciones largas).
- **Objetivo**: que siempre se sepa si hay tareas pendientes en td antes de proponer trabajo nuevo.

Si el usuario pide empezar algo que implica varios pasos o entregables:
- Comprueba si ya existe un issue en td para ello (`td list`, `td next`, `td ready`).
- Si no existe y el trabajo es acotable, valora crear un issue con `td create` o `td add` y hacer `td start <id>` al comenzar.

---

## 2. Cierre de sesión o de trabajo

- **Antes de dar por terminada una sesión** en la que se haya trabajado en tareas de td:
  - Si había un issue en foco: `td log` o `td handoff` para dejar estado para la siguiente sesión.
  - Si se completó trabajo asociado a un issue: `td close <id>` o `td review <id>` según el flujo del proyecto.
- **No cerrar la conversación** sin haber comprobado si queda algo pendiente en td (`td status` o `td next`).

### 2.1 Handoff (`td handoff`)

**Cuándo usarlo:** Al terminar una sesión en la que hayas trabajado en un issue que **no** está cerrado, para que la siguiente sesión (o otra persona/agente) pueda retomarlo con contexto. td captura además el estado de git de forma automática.

**Sintaxis:** `td handoff <issue-id> [mensaje]`  
O con contenido estructurado (recomendado):

```bash
td handoff <issue-id> --done "item completado" --remaining "siguiente paso" --decision "decisión tomada" --uncertain "duda pendiente"
```

**Campos estructurados (flags o stdin en formato YAML-like):**

| Campo        | Uso |
|-------------|-----|
| `--done`    | Lo que ya se hizo en esta sesión (repetible). |
| `--remaining` | Lo que falta por hacer (repetible). |
| `--decision`  | Decisiones tomadas que afectan al issue (repetible). |
| `--uncertain` | Dudas o incertidumbres para revisar después (repetible). |
| `--note` / `-m` | Mensaje libre si no usas los campos anteriores. |

**Ejemplo con nota simple:**  
`td handoff 42 -m "Formulario PLCOm2012 listo; falta conectar umbral configurable en UI"`

**Comprobar si hace falta handoff antes de salir:**  
`td check-handoff` — devuelve código de salida 1 si hay trabajo en curso que debería tener handoff (útil en scripts o al cerrar sesión). Si devuelve 1, ejecuta `td handoff <id>` con el issue en foco antes de dar la sesión por cerrada.

---

## 3. Commits y versionado

- **Antes de hacer cualquier commit**: usa el skill **smart-commit-with-versioning** (proyectos con CHANGELOG.md).
- **Flujo obligatorio en cada commit**:
  1. Leer versión actual en `CHANGELOG.md`.
  2. Incrementar versión (patch/minor/major según tipo de cambio).
  3. Añadir sección nueva en `CHANGELOG.md` con la fecha y las entradas (Added/Changed/Fixed).
  4. Actualizar versión en `README.md`, `config/guidelines.ts` (APP_VERSION), `package.json` y `public/manifest.json` si aplica.
  5. Comprobar tareas relacionadas (td o lista de tareas); si hay incompletas, preguntar al usuario antes de commitear.
  6. Hacer el commit con mensaje que incluya la versión y un resumen de cambios.

No hagas commits “rápidos” sin actualizar CHANGELOG y versión; cada commit debe dejar el proyecto con versión consistente.

---

## 4. Resumen rápido

| Momento        | Acción |
|----------------|--------|
| Inicio sesión  | `td usage --new-session` |
| Durante sesión | `td usage -q` si necesitas refrescar tareas |
| Inicio de trabajo acotado | Revisar/crear issue en td y `td start` si aplica |
| Antes de cerrar sesión | `td check-handoff`; si hace falta, `td handoff <id>` (done/remaining/decision/uncertain) o `td close`/`td review` |
| Antes de commit | Usar skill **smart-commit-with-versioning** (CHANGELOG + versión + README + verificación de tareas) |
