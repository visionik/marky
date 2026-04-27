#!/usr/bin/env node
/**
 * release.mjs — crackdown release script
 *
 * Usage:  node scripts/release.mjs <major|minor|patch>
 *
 * What it does:
 *   1. Validates the bump type and working tree is clean.
 *   2. Reads the current version from packages/core/package.json.
 *   3. Computes the next version.
 *   4. Updates version in all publishable packages/*/package.json.
 *   5. Stamps [Unreleased] → [x.y.z] — YYYY-MM-DD in CHANGELOG.md.
 *   6. Commits, tags v<version>, and pushes both commit and tag.
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')

// ── 1. Parse args ───────────────────────────────────────────────────────────

const bump = process.argv[2]
if (!['major', 'minor', 'patch'].includes(bump ?? '')) {
  console.error('Usage: node scripts/release.mjs <major|minor|patch>')
  process.exit(1)
}

// ── 2. Ensure working tree is clean ────────────────────────────────────────

const dirty = execSync('git status --porcelain', { cwd: ROOT }).toString().trim()
if (dirty) {
  console.error('Working tree is dirty. Commit or stash changes before releasing.')
  process.exit(1)
}

// ── 3. Read current version ─────────────────────────────────────────────────

const corePkg = JSON.parse(readFileSync(join(ROOT, 'packages/core/package.json'), 'utf8'))
const [major, minor, patch] = corePkg.version.split('.').map(Number)
let nextVersion
if (bump === 'major') nextVersion = `${major + 1}.0.0`
else if (bump === 'minor') nextVersion = `${major}.${minor + 1}.0`
else nextVersion = `${major}.${minor}.${patch + 1}`

console.log(`Bumping ${corePkg.version} → ${nextVersion}`)

// ── 4. Update package.json versions ─────────────────────────────────────────

const PACKAGES = ['cli', 'compat-markdownlint', 'core', 'lsp', 'plugin-mermaid']

for (const name of PACKAGES) {
  const pkgPath = join(ROOT, 'packages', name, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.version = nextVersion
  // Also bump any workspace:* peer deps that reference our own packages
  for (const dep of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (!pkg[dep]) continue
    for (const [k, v] of Object.entries(pkg[dep])) {
      if (k.startsWith('@crackdown/') && v === 'workspace:*') {
        pkg[dep][k] = `^${nextVersion}`
      }
    }
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`  updated packages/${name}/package.json`)
}

// ── 5. Stamp CHANGELOG ───────────────────────────────────────────────────────

const changelogPath = join(ROOT, 'CHANGELOG.md')
const changelog = readFileSync(changelogPath, 'utf8')
const today = new Date().toISOString().slice(0, 10)
const stamped = changelog.replace(
  /^## \[Unreleased\]/m,
  `## [Unreleased]\n\n## [${nextVersion}] — ${today}`,
)
if (stamped === changelog) {
  console.warn('Warning: no [Unreleased] section found in CHANGELOG.md — skipping stamp')
} else {
  writeFileSync(changelogPath, stamped)
  console.log(`  stamped CHANGELOG.md with [${nextVersion}] — ${today}`)
}

// ── 6. Commit, tag, push ─────────────────────────────────────────────────────

const tag = `v${nextVersion}`
execSync('git add packages/*/package.json CHANGELOG.md', { cwd: ROOT, stdio: 'inherit' })
execSync(
  `git -c user.email="release@crackdown.dev" -c user.name="crackdown-release" commit -m "chore(release): v${nextVersion}"`,
  { cwd: ROOT, stdio: 'inherit' },
)
execSync(`git tag ${tag}`, { cwd: ROOT, stdio: 'inherit' })
execSync('git push origin main', { cwd: ROOT, stdio: 'inherit' })
execSync(`git push origin ${tag}`, { cwd: ROOT, stdio: 'inherit' })

console.log(`\n✓ Released ${tag} — npm publish will start automatically via CI.`)
console.log(`  Watch: https://github.com/visionik/crackdown/actions`)
