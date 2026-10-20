#!/usr/bin/env node
/**
 * Copy the live data onto disk the VPS owns.
 *
 *   node scripts/migrate-to-local.mjs db     — Turso rows  -> local SQLite file
 *   node scripts/migrate-to-local.mjs media  — R2 objects  -> MEDIA_ROOT
 *   node scripts/migrate-to-local.mjs all
 *
 * Reads only from Turso and R2; it never writes to either. The media step
 * fetches the public bucket URLs over plain HTTPS, so it needs no R2
 * credentials — which matters, because the local R2 key is dead.
 *
 * Idempotent: media already on disk is skipped, and each local table is
 * emptied before reload rather than appended to.
 */
import { createClient } from '@libsql/client';
import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const LOCAL_DB = process.env.LOCAL_DB_PATH || './.local/gvim.db';
const MEDIA_ROOT = process.env.MEDIA_ROOT || './.local/media';

async function loadEnv() {
  const out = { ...process.env };
  let raw = '';
  try { raw = await readFile('.env.local', 'utf8'); } catch { /* process env only */ }
  for (const line of raw.split('\n')) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    if (!out[k]) out[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const exists = p => access(p).then(() => true, () => false);

async function migrateDb(env) {
  if (!env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL is not set');
  const remote = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
  await mkdir(dirname(LOCAL_DB), { recursive: true });
  const local = createClient({ url: `file:${LOCAL_DB}` });

  const schema = await remote.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END"
  );
  console.log(`  schema objects: ${schema.rows.length}`);
  for (const row of schema.rows) {
    await local.execute(String(row.sql));
    console.log(`    + ${row.type} ${row.name}`);
  }

  const tables = schema.rows.filter(r => r.type === 'table').map(r => String(r.name));
  for (const table of tables) {
    const src = await remote.execute(`SELECT * FROM "${table}"`);
    await local.execute(`DELETE FROM "${table}"`);
    if (src.rows.length === 0) { console.log(`    ${table}: 0 rows`); continue; }
    const cols = src.columns;
    const sql = `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    for (const row of src.rows) {
      await local.execute({ sql, args: cols.map(c => row[c] ?? null) });
    }
    console.log(`    ${table}: ${src.rows.length} rows`);
  }

  for (const t of ['gallery', 'sermons', 'gallery_categories', 'contact_submissions']) {
    try {
      const a = await remote.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
      const b = await local.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
      const ok = Number(a.rows[0].n) === Number(b.rows[0].n);
      console.log(`  ${ok ? 'MATCH' : 'MISMATCH'}  ${t}: remote ${a.rows[0].n} / local ${b.rows[0].n}`);
      if (!ok) process.exitCode = 1;
    } catch { /* table may not exist */ }
  }
  console.log(`  database written to ${LOCAL_DB}`);
}

async function migrateMedia(env) {
  const remote = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
  const bases = {
    gallery: (env.PUBLIC_GALLERY_BASE || '').replace(/\/$/, ''),
    sermons: (env.PUBLIC_SERMONS_BASE || '').replace(/\/$/, '')
  };
  if (!bases.gallery) throw new Error('PUBLIC_GALLERY_BASE is not set');

  const rows = [
    ...(await remote.execute('SELECT file_path FROM gallery WHERE file_path IS NOT NULL')).rows,
    ...(await remote.execute("SELECT file_path FROM sermons WHERE file_path IS NOT NULL AND file_path <> ''")).rows
  ];
  const keys = [...new Set(rows.map(r => String(r.file_path)).filter(Boolean))];
  console.log(`  objects referenced by the database: ${keys.length}`);

  let fetched = 0, skipped = 0, bytes = 0;
  const failures = [];
  for (const key of keys) {
    const bucket = key.startsWith('sermons/') ? 'sermons' : 'gallery';
    const dest = join(MEDIA_ROOT, key);
    if (await exists(dest)) { skipped++; continue; }
    try {
      const res = await fetch(`${bases[bucket]}/${key}`);
      if (!res.ok) { failures.push(`${key} (HTTP ${res.status})`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, buf);
      fetched++; bytes += buf.length;
      if (fetched % 10 === 0) console.log(`    ${fetched} fetched…`);
    } catch (err) {
      failures.push(`${key} (${err.message})`);
    }
  }
  console.log(`  fetched ${fetched} (${(bytes / 1048576).toFixed(1)} MB), already present ${skipped}, failed ${failures.length}`);
  for (const f of failures.slice(0, 10)) console.log(`    FAILED ${f}`);
  if (failures.length) process.exitCode = 1;
}

const cmd = process.argv[2] || 'all';
if (!['db', 'media', 'all'].includes(cmd)) {
  console.error('usage: migrate-to-local.mjs [db|media|all]');
  process.exit(2);
}
const env = await loadEnv();
if (cmd === 'db' || cmd === 'all') { console.log('[db]'); await migrateDb(env); }
if (cmd === 'media' || cmd === 'all') { console.log('[media]'); await migrateMedia(env); }
