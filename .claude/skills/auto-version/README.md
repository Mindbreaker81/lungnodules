# Auto-Version Skill

Skill para automatizar el versionado y actualización de documentación del proyecto.

## Uso

Cuando quieras actualizar la versión del proyecto, simplemente pídeme:

- "Actualiza la versión" 
- "Bump version"
- "Prepara release"
- "Update version"

Yo te preguntaré qué tipo de cambio es (major/minor/patch) y ejecutaré el script automáticamente.

## Qué hace

1. **Actualiza versión** en package.json
2. **Actualiza versión** en MEDICAL_DISCLAIMER.md
3. **Genera CHANGELOG.md** con los commits desde la última versión
4. **Copia archivos** a public/ para que sean accesibles desde la web

## Script

El script principal está en `.claude/skills/auto-version/scripts/update_version.py`

```bash
# Uso manual
python3 .claude/skills/auto-version/scripts/update_version.py <major|minor|patch>
```

## Ejemplo

```bash
# Patch release (bug fixes)
python3 .claude/skills/auto-version/scripts/update_version.py patch

# Minor release (nuevas features)
python3 .claude/skills/auto-version/scripts/update_version.py minor

# Major release (breaking changes)
python3 .claude/skills/auto-version/scripts/update_version.py major
```
