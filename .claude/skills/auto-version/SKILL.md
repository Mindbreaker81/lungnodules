---
name: auto-version
description: Automates version bumping and documentation updates for software projects. Use when user needs to update project version (semantic versioning), generate CHANGELOG entries from git commits, and synchronize version numbers across multiple files (package.json, README, documentation). Triggered by requests like "update version", "bump version", "release new version", "prepare release", or similar version management tasks.
---

# Auto-Version

Automates semantic versioning and changelog generation for software projects.

## When to Use This Skill

Use this skill when:
- User requests to update/bump the project version
- Preparing for a new release
- Need to synchronize version across multiple files
- Want to generate changelog from git commit history
- After completing features/fixes that should be versioned

## Quick Start

The skill uses a Python script that handles all version updates. Basic workflow:

1. **Ask user for version increment type** (major/minor/patch)
2. **Run the script**: `python3 .claude/skills/auto-version/scripts/update_version.py <type>`
3. **Script automatically**:
   - Increments version in package.json
   - Updates APP_VERSION in config/guidelines.ts (central constant)
   - Updates version in public/manifest.json (PWA metadata)
   - Updates version badge in README.md
   - Updates version in MEDICAL_DISCLAIMER.md
   - Generates CHANGELOG from git commits
   - Copies updated files to public/ directory
4. **Commit and push** the changes

## Version Increment Types

The script follows semantic versioning (MAJOR.MINOR.PATCH):

- **major**: Breaking changes, incompatible API changes
  - Example: 1.0.0 → 2.0.0
- **minor**: New features, backwards compatible
  - Example: 1.0.0 → 1.1.0
- **patch**: Bug fixes, minor improvements
  - Example: 1.0.0 → 1.0.1

Ask the user which type applies to their changes.

## Script Details

### Location
`.claude/skills/auto-version/scripts/update_version.py`

### Usage

```bash
# Basic usage (from project root)
python3 .claude/skills/auto-version/scripts/update_version.py <major|minor|patch>

# With explicit project path
python3 .claude/skills/auto-version/scripts/update_version.py patch /path/to/project
```

### What Gets Updated

1. **package.json**
   - Updates `version` field

2. **config/guidelines.ts**
   - Updates `APP_VERSION` constant
   - This is the central version constant used throughout the app

3. **public/manifest.json**
   - Updates or creates `version` field for PWA metadata

4. **README.md**
   - Updates version badge: `[![Version: X.Y.Z](...)](CHANGELOG.md)`
   - Creates badge if it doesn't exist

5. **MEDICAL_DISCLAIMER.md** (if exists)
   - Updates `**Current Version:** X.Y.Z` line

6. **CHANGELOG.md**
   - Creates if doesn't exist
   - Adds new version entry with:
     - Version number and date
     - Commit messages categorized by type
     - Short commit hashes in parentheses

7. **public/** directory
   - Copies updated MEDICAL_DISCLAIMER.md
   - Copies updated CHANGELOG.md

### Commit Categorization

The script categorizes commits using conventional commit patterns:

| Commit Prefix | Category |
|--------------|----------|
| feat, feature | Features |
| fix, bugfix | Bug Fixes |
| break, ! | Breaking Changes |
| docs, doc | Documentation |
| refactor | Refactoring |
| test, spec | Tests |
| chore, build | Chore |

## Workflow

### Step 1: Determine Increment Type

Ask the user what type of change this is:

```
"¿Qué tipo de cambio es este?"
- Major: Cambios breaking/incompatibles
- Minor: Nuevas features backwards compatible
- Patch: Bug fixes y mejoras menores
```

### Step 2: Run the Script

Execute the script with the appropriate increment type:

```bash
python3 .claude/skills/auto-version/scripts/update_version.py patch
```

### Step 3: Review Changes

The script will output what was updated:

```
🔄 Auto-version: Updating project version...
   Project: /path/to/project
   Increment: patch

Current version: 1.0.0
New version: 1.0.1

✓ Updated package.json: 1.0.0 → 1.0.1
✓ Updated config/guidelines.ts: 1.0.1
✓ Updated public/manifest.json: 1.0.0 → 1.0.1
✓ Updated README.md badge: 1.0.1
✓ Updated MEDICAL_DISCLAIMER.md: 1.0.1
✓ Updated CHANGELOG.md with version 1.0.1
✓ Copied MEDICAL_DISCLAIMER.md to public/
✓ Copied CHANGELOG.md to public/

✅ Version updated successfully to 1.0.1!
```

### Step 4: Commit and Push

Stage and commit the changes:

```bash
git add package.json config/guidelines.ts README.md MEDICAL_DISCLAIMER.md CHANGELOG.md public/
git commit -m "chore: bump version to X.Y.Z"
git push
```

## Customization

### Adding New Files to Update

To update version in additional files, edit `update_version.py` and add new functions following this pattern:

```python
def update_custom_file(project_root: Path, new_version: str) -> bool:
    """Update version in custom_file.ext."""
    custom_file = project_root / "custom_file.ext"
    if not custom_file.exists():
        return False

    with open(custom_file, 'r') as f:
        content = f.read()

    # Add your replacement logic here
    pattern = r'Version: [\d.]+'
    replacement = f'Version: {new_version}'
    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        with open(custom_file, 'w') as f:
            f.write(new_content)
        print(f"✓ Updated custom_file.ext: {new_version}")
        return True

    return False
```

Then call the function in `main()` after the other updates.

### Modifying Commit Categories

To change how commits are categorized, edit the `categorize_commit()` function in the script.

## Troubleshooting

### Script Not Found

Ensure the script is executable and at the correct path:

```bash
chmod +x .claude/skills/auto-version/scripts/update_version.py
```

### No Commits Found

If no commits are found, the script will still update version files but skip CHANGELOG generation. This happens when:
- No git history exists
- No new commits since last version tag

### Version Already Exists

The script will warn and exit if the target version already exists in CHANGELOG.md.

## Examples

### Example 1: Patch Release

User: "Actualiza la versión, hice un bug fix"

```
1. Ask: "¿Qué tipo de cambio?" → "patch"
2. Run: python3 .claude/skills/auto-version/scripts/update_version.py patch
3. Review outputs
4. Commit changes
```

### Example 2: Minor Release

User: "Nueva feature lista, prepara release"

```
1. Ask: "¿Qué tipo de cambio?" → "minor"
2. Run: python3 .claude/skills/auto-version/scripts/update_version.py minor
3. Review CHANGELOG entry
4. Commit and tag release
```

### Example 3: Major Release

User: "Hice cambios breaking, nueva versión major"

```
1. Ask: "¿Qué tipo de cambio?" → "major"
2. Run: python3 .claude/skills/auto-version/scripts/update_version.py major
3. Review all updated files
4. Commit with breaking changes notes
```

## Resources

### scripts/

- **update_version.py**: Main script that handles version bumping, changelog generation, and file synchronization

Script features:
- Semantic versioning (major.minor.patch)
- Automatic commit categorization
- CHANGELOG generation from git history
- Multi-file version synchronization (package.json, config/guidelines.ts, manifest.json, README.md, MEDICAL_DISCLAIMER.md)
- Public directory updates for Next.js/static sites
- Centralized APP_VERSION constant management
