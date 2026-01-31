#!/usr/bin/env python3
"""
Auto-version script: Updates project version and documentation.
Updates version in package.json, config/guidelines.ts, README.md, MEDICAL_DISCLAIMER.md,
public/manifest.json, and CHANGELOG.md.
"""

import re
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Tuple, List


def get_current_version(project_root: Path) -> str:
    """Get current version from package.json."""
    package_json = project_root / "package.json"
    with open(package_json, 'r') as f:
        data = json.load(f)
    return data.get("version", "1.0.0")


def increment_version(version: str, increment_type: str) -> str:
    """Increment version based on type (major, minor, patch)."""
    major, minor, patch = map(int, version.split('.'))
    
    if increment_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif increment_type == "minor":
        minor += 1
        patch = 0
    elif increment_type == "patch":
        patch += 1
    else:
        raise ValueError(f"Invalid increment type: {increment_type}")
    
    return f"{major}.{minor}.{patch}"


def update_package_json(project_root: Path, new_version: str) -> bool:
    """Update version in package.json."""
    package_json = project_root / "package.json"
    with open(package_json, 'r') as f:
        data = json.load(f)
    
    old_version = data.get("version", "")
    data["version"] = new_version
    
    with open(package_json, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    
    print(f"✓ Updated package.json: {old_version} → {new_version}")
    return True


def update_disclaimer_md(project_root: Path, new_version: str) -> bool:
    """Update version in MEDICAL_DISCLAIMER.md."""
    disclaimer_md = project_root / "MEDICAL_DISCLAIMER.md"
    if not disclaimer_md.exists():
        print("⚠ MEDICAL_DISCLAIMER.md not found, skipping...")
        return False
    
    with open(disclaimer_md, 'r') as f:
        content = f.read()
    
    # Update version line: **Current Version:** X.Y.Z
    pattern = r'\*\*Current Version:\*\* [\d.]+'
    replacement = f'**Current Version:** {new_version}'
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(disclaimer_md, 'w') as f:
            f.write(new_content)
        print(f"✓ Updated MEDICAL_DISCLAIMER.md: {new_version}")
        return True
    
    print("⚠ No version line found in MEDICAL_DISCLAIMER.md")
    return False


def update_guidelines_ts(project_root: Path, new_version: str) -> bool:
    """Update APP_VERSION constant in config/guidelines.ts."""
    guidelines_file = project_root / "config" / "guidelines.ts"
    if not guidelines_file.exists():
        print("⚠ config/guidelines.ts not found, skipping...")
        return False

    with open(guidelines_file, 'r') as f:
        content = f.read()

    # Update APP_VERSION line: export const APP_VERSION = 'X.Y.Z';
    pattern = r"export const APP_VERSION = '[\d.]+';"
    replacement = f"export const APP_VERSION = '{new_version}';"
    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        with open(guidelines_file, 'w') as f:
            f.write(new_content)
        print(f"✓ Updated config/guidelines.ts: {new_version}")
        return True

    print("⚠ No APP_VERSION line found in config/guidelines.ts")
    return False


def update_manifest_json(project_root: Path, new_version: str) -> bool:
    """Update version field in public/manifest.json."""
    manifest_file = project_root / "public" / "manifest.json"
    if not manifest_file.exists():
        print("⚠ public/manifest.json not found, skipping...")
        return False

    with open(manifest_file, 'r') as f:
        data = json.load(f)

    old_version = data.get("version", "")
    data["version"] = new_version

    with open(manifest_file, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')

    if old_version:
        print(f"✓ Updated public/manifest.json: {old_version} → {new_version}")
    else:
        print(f"✓ Added version to public/manifest.json: {new_version}")
    return True


def update_readme_badge(project_root: Path, new_version: str) -> bool:
    """Update version badge in README.md."""
    readme_file = project_root / "README.md"
    if not readme_file.exists():
        print("⚠ README.md not found, skipping...")
        return False

    with open(readme_file, 'r') as f:
        content = f.read()

    # Update version badge: [![Version: X.Y.Z](...)](CHANGELOG.md)
    pattern = r'\[!\[Version: [\d.]+\]\(https://img\.shields\.io/badge/Version-[\d.]+-blue\.svg\)\]\(CHANGELOG\.md\)'
    replacement = f'[![Version: {new_version}](https://img.shields.io/badge/Version-{new_version}-blue.svg)](CHANGELOG.md)'
    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        with open(readme_file, 'w') as f:
            f.write(new_content)
        print(f"✓ Updated README.md badge: {new_version}")
        return True

    # If no badge found, try to add it after License badge
    license_pattern = r'(\[!\[License: [^\]]+\]\([^\)]+\)\]\([^\)]+\))\n'
    match = re.search(license_pattern, content)

    if match:
        # Insert version badge after License badge
        position = match.end()
        new_badge = f'\n[![Version: {new_version}](https://img.shields.io/badge/Version-{new_version}-blue.svg)](CHANGELOG.md)'
        new_content = content[:position] + new_badge + content[position:]

        with open(readme_file, 'w') as f:
            f.write(new_content)
        print(f"✓ Added version badge to README.md: {new_version}")
        return True

    print("⚠ Could not find location to add version badge in README.md")
    return False


def get_recent_commits(project_root: Path, since_version: str) -> List[Tuple[str, str]]:
    """Get commits since last version tag."""
    import subprocess
    
    try:
        # Get commits since last tag
        result = subprocess.run(
            ['git', 'log', f'v{since_version}..HEAD', '--pretty=format:%H|%s'],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # Try getting last 10 commits if no tag found
            result = subprocess.run(
                ['git', 'log', '-10', '--pretty=format:%H|%s'],
                cwd=project_root,
                capture_output=True,
                text=True
            )
        
        commits = []
        for line in result.stdout.strip().split('\n'):
            if line:
                hash, msg = line.split('|', 1)
                commits.append((hash, msg))
        
        return commits
    except Exception as e:
        print(f"⚠ Error getting commits: {e}")
        return []


def categorize_commit(message: str) -> str:
    """Categorize commit message based on conventional commits."""
    msg_lower = message.lower()
    
    if msg_lower.startswith('feat') or msg_lower.startswith('feature'):
        return 'Features'
    elif msg_lower.startswith('fix') or msg_lower.startswith('bugfix'):
        return 'Bug Fixes'
    elif msg_lower.startswith('break') or '!' in message.split(':')[0]:
        return 'Breaking Changes'
    elif msg_lower.startswith('docs') or msg_lower.startswith('doc'):
        return 'Documentation'
    elif msg_lower.startswith('refactor'):
        return 'Refactoring'
    elif msg_lower.startswith('test') or msg_lower.startswith('spec'):
        return 'Tests'
    elif msg_lower.startswith('chore') or msg_lower.startswith('build'):
        return 'Chore'
    else:
        return 'Other'


def update_changelog(project_root: Path, new_version: str, commits: List[Tuple[str, str]], current_version: str) -> bool:
    """Update or create CHANGELOG.md with new version entry."""
    changelog_md = project_root / "CHANGELOG.md"
    
    # Group commits by category
    categories = {}
    for commit_hash, message in commits:
        category = categorize_commit(message)
        if category not in categories:
            categories[category] = []
        
        # Clean up conventional commit prefix
        clean_message = message
        for prefix in ['feat:', 'fix:', 'docs:', 'refactor:', 'test:', 'chore:', 'build:', 'feature:', 'bugfix:', 'doc:', 'spec:']:
            if clean_message.lower().startswith(prefix):
                clean_message = clean_message[len(prefix):].strip()
                break
        
        # Get short hash
        short_hash = commit_hash[:7]
        categories[category].append(f"- {clean_message} ({short_hash})")
    
    # Create new version entry
    today = datetime.now().strftime("%Y-%m-%d")
    new_entry = f"## [{new_version}] - {today}\n\n"
    
    # Add categories (in priority order)
    priority_order = ['Breaking Changes', 'Features', 'Bug Fixes', 'Documentation', 'Tests', 'Refactoring', 'Chore', 'Other']
    for category in priority_order:
        if category in categories and categories[category]:
            new_entry += f"### {category}\n\n"
            for item in categories[category]:
                new_entry += f"{item}\n"
            new_entry += "\n"
    
    # Update or create changelog
    if changelog_md.exists():
        with open(changelog_md, 'r') as f:
            content = f.read()
        
        # Check if version already exists
        if f"## [{new_version}]" in content:
            print(f"⚠ Version {new_version} already exists in CHANGELOG.md")
            return False
        
        # Insert new entry at the top
        new_content = new_entry + content
        with open(changelog_md, 'w') as f:
            f.write(new_content)
        
        print(f"✓ Updated CHANGELOG.md with version {new_version}")
    else:
        # Create new changelog with header
        header = "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n"
        with open(changelog_md, 'w') as f:
            f.write(header + new_entry)
        
        print(f"✓ Created CHANGELOG.md with version {new_version}")
    
    return True


def copy_to_public(project_root: Path) -> None:
    """Copy updated files to public directory."""
    files_to_copy = [
        "MEDICAL_DISCLAIMER.md",
        "CHANGELOG.md"
    ]
    
    public_dir = project_root / "public"
    if not public_dir.exists():
        return
    
    for filename in files_to_copy:
        src = project_root / filename
        dst = public_dir / filename
        
        if src.exists():
            import shutil
            shutil.copy2(src, dst)
            print(f"✓ Copied {filename} to public/")


def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: update_version.py <major|minor|patch> [project_root]")
        sys.exit(1)
    
    increment_type = sys.argv[1].lower()
    if increment_type not in ['major', 'minor', 'patch']:
        print(f"Error: increment_type must be major, minor, or patch, got: {increment_type}")
        sys.exit(1)
    
    project_root = Path(sys.argv[2]) if len(sys.argv) > 2 else Path.cwd()
    
    print(f"\n🔄 Auto-version: Updating project version...")
    print(f"   Project: {project_root}")
    print(f"   Increment: {increment_type}\n")
    
    # Get current version
    current_version = get_current_version(project_root)
    print(f"Current version: {current_version}")
    
    # Calculate new version
    new_version = increment_version(current_version, increment_type)
    print(f"New version: {new_version}\n")
    
    # Update files
    update_package_json(project_root, new_version)
    update_guidelines_ts(project_root, new_version)
    update_manifest_json(project_root, new_version)
    update_readme_badge(project_root, new_version)
    update_disclaimer_md(project_root, new_version)
    
    # Get commits and update changelog
    commits = get_recent_commits(project_root, current_version)
    if commits:
        print(f"\n📝 Found {len(commits)} commits since last version")
        update_changelog(project_root, new_version, commits, current_version)
    else:
        print("\n⚠ No commits found, skipping CHANGELOG update")
    
    # Copy to public directory
    copy_to_public(project_root)
    
    print(f"\n✅ Version updated successfully to {new_version}!")
    print(f"\nNext steps:")
    print(f"   git add package.json config/guidelines.ts README.md MEDICAL_DISCLAIMER.md CHANGELOG.md public/")
    print(f"   git commit -m 'chore: bump version to {new_version}'")
    print(f"   git push")


if __name__ == "__main__":
    main()
