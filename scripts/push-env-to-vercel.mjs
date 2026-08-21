#!/usr/bin/env node
/**
 * Push every value from .env.local into the linked Vercel project.
 *
 *   node scripts/push-env-to-vercel.mjs            # preview (shows what would happen)
 *   node scripts/push-env-to-vercel.mjs --apply    # actually set them
 *
 * Saves entering a dozen secrets by hand in the dashboard. Values are piped to
 * the CLI over stdin, so they never appear in a command line or in shell history.
 * Requires `vercel login` and `vercel link` first.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const TARGETS = ['production', 'preview', 'development'];

if (!existsSync(join(ROOT, '.vercel', 'project.json'))) {
  console.error('✘ Project is not linked. Run `vercel link` first.');
  process.exit(1);
}

const vars = [];
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  const key = line.slice(0, eq).trim();
  const value = line.slice(eq + 1).trim();
  if (!value || /^<.*>$/.test(value)) { console.log(`  skip ${key} (empty or placeholder)`); continue; }
  vars.push({ key, value });
}

console.log(`\n${APPLY ? 'Setting' : 'Would set'} ${vars.length} variables on ${TARGETS.join(', ')}:\n`);
for (const { key } of vars) console.log(`  ${key}`);

if (!APPLY) { console.log('\nRe-run with --apply to set them.'); process.exit(0); }

console.log('');
for (const { key, value } of vars) {
  for (const target of TARGETS) {
    // Remove first so re-runs update rather than erroring on an existing key.
    try {
      execFileSync('npx', ['vercel', 'env', 'rm', key, target, '--yes'],
        { cwd: ROOT, stdio: 'pipe' });
    } catch { /* not set yet — fine */ }
    execFileSync('npx', ['vercel', 'env', 'add', key, target],
      { cwd: ROOT, input: value, stdio: ['pipe', 'pipe', 'pipe'] });
  }
  console.log(`  ✓ ${key}`);
}
console.log(`\n✓ ${vars.length} variables set. Redeploy for them to take effect.`);
