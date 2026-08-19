#!/usr/bin/env node
/**
 * Migrate the GVIM database from Cloudflare D1 to Turso (libSQL).
 *
 *   node scripts/migrate-d1-to-turso.mjs export   # D1 -> ./d1-export/*.json (needs wrangler login)
 *   node scripts/migrate-d1-to-turso.mjs schema   # apply migrations/0001_init.sql to Turso
 *                                                 # (add --seed to also insert default categories)
 *   node scripts/migrate-d1-to-turso.mjs import   # ./d1-export/*.json -> Turso
 *   node scripts/migrate-d1-to-turso.mjs verify   # compare row counts
 *   node scripts/migrate-d1-to-turso.mjs all      # schema + import + verify
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for everything except `export`.
 * Import is idempotent (INSERT OR REPLACE), so it is safe to re-run.
 */
import { createClient } from '@libsql/client';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DUMP_DIR = join(ROOT, 'd1-export');
const D1_NAME = 'gvim-db';

// Parents before children: `gallery.category` is an FK onto `gallery_categories.slug`.
const TABLES = ['gallery_categories', 'gallery', 'sermons', 'contact_submissions'];

function turso() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    console.error('✘ TURSO_DATABASE_URL is not set. See TURSO_SETUP.md.');
    process.exit(1);
  }
  return createClient({ url, authToken });
}

function exportFromD1() {
  mkdirSync(DUMP_DIR, { recursive: true });
  for (const table of TABLES) {
    process.stdout.write(`  exporting ${table} ... `);
    const raw = execFileSync('npx', [
      'wrangler', 'd1', 'execute', D1_NAME, '--remote', '--json',
      '--command', `SELECT * FROM ${table}`
    ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

    // wrangler prints a banner before the JSON payload.
    const start = raw.indexOf('[');
    if (start === -1) throw new Error(`no JSON in wrangler output for ${table}`);
    const parsed = JSON.parse(raw.slice(start));
    const rows = parsed[0]?.results ?? [];

    writeFileSync(join(DUMP_DIR, `${table}.json`), JSON.stringify(rows, null, 2));
    console.log(`${rows.length} rows`);
  }
  console.log(`\n✓ Exported to ${DUMP_DIR}`);
}

async function applySchema({ seed = false } = {}) {
  const client = turso();
  const sql = readFileSync(join(ROOT, 'migrations', '0001_init.sql'), 'utf8');
  // Split on `;` at end of statement — the schema has no semicolons inside literals.
  let statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(Boolean);

  // The schema seeds six default categories. When we are importing a dump, that
  // dump is authoritative: seeding would resurrect any category deleted in D1 and
  // make the verify row counts meaningless. Pass --seed for a fresh empty database.
  if (!seed) {
    const before = statements.length;
    statements = statements.filter(s => !/^INSERT\b/i.test(s));
    const skipped = before - statements.length;
    if (skipped) console.log(`  (skipped ${skipped} seed statement(s); pass --seed to include)`);
  }

  for (const stmt of statements) {
    await client.execute(stmt);
  }
  console.log(`✓ Applied ${statements.length} schema statements to Turso`);
}

async function importToTurso() {
  const client = turso();
  for (const table of TABLES) {
    const file = join(DUMP_DIR, `${table}.json`);
    if (!existsSync(file)) {
      console.log(`  ${table}: no dump file, skipping`);
      continue;
    }
    const rows = JSON.parse(readFileSync(file, 'utf8'));
    if (rows.length === 0) {
      console.log(`  ${table}: 0 rows, skipping`);
      continue;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    await client.batch(
      rows.map(row => ({ sql, args: columns.map(c => row[c] ?? null) })),
      'write'
    );
    console.log(`  ${table}: imported ${rows.length} rows`);
  }
  console.log('\n✓ Import complete');
}

async function verify() {
  const client = turso();
  console.log('\n  table                    dump   turso');
  console.log('  ─────────────────────────────────────');
  let ok = true;
  for (const table of TABLES) {
    const file = join(DUMP_DIR, `${table}.json`);
    const expected = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).length : '—';
    const rs = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    const actual = Number(rs.rows[0].n);
    const match = expected === '—' || expected === actual;
    if (!match) ok = false;
    console.log(`  ${table.padEnd(22)} ${String(expected).padStart(5)}   ${String(actual).padStart(5)} ${match ? '✓' : '✘ MISMATCH'}`);
  }
  console.log(ok ? '\n✓ Row counts match' : '\n✘ Row counts differ — investigate before cutting over');
  if (!ok) process.exitCode = 1;
}

const cmd = process.argv[2];
const seed = process.argv.includes('--seed');
switch (cmd) {
  case 'export': exportFromD1(); break;
  case 'schema': await applySchema({ seed }); break;
  case 'import': await importToTurso(); break;
  case 'verify': await verify(); break;
  case 'all': await applySchema({ seed }); await importToTurso(); await verify(); break;
  default:
    console.log('Usage: node scripts/migrate-d1-to-turso.mjs <export|schema|import|verify|all>');
    process.exit(1);
}
