#!/usr/bin/env node
/**
 * Validate the runtime environment before deploying.
 *
 *   npm run check:env                       # checks the current shell
 *   node --env-file=.env.local scripts/check-env.mjs
 *
 * Catches the misconfigurations that otherwise surface as opaque 500s in
 * production: missing secrets, wrong URL schemes, trailing slashes, and an
 * ADMIN_PASSWORD_HASH that isn't actually a hash.
 */
const problems = [];
const warnings = [];

const required = [
  'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN',
  'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'JWT_SECRET',
  'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'PUBLIC_GALLERY_BASE', 'PUBLIC_SERMONS_BASE'
];

for (const key of required) {
  if (!process.env[key]) problems.push(`${key} is not set`);
}

/* Optional: the contact form works without these — the enquiry is still saved,
   only the email alert is skipped. Absence is a warning, never a failure. */
if (!process.env.RESEND_API_KEY || !process.env.CONTACT_NOTIFY_TO) {
  warnings.push('contact notifications are off (RESEND_API_KEY / CONTACT_NOTIFY_TO unset) — enquiries are saved but nobody is emailed');
} else {
  if (!/^re_/.test(process.env.RESEND_API_KEY)) {
    problems.push('RESEND_API_KEY does not look like a Resend key (expected it to start with "re_")');
  }
  if (!process.env.CONTACT_NOTIFY_TO.includes('@')) {
    problems.push('CONTACT_NOTIFY_TO must be an email address');
  }
  if (!process.env.CONTACT_NOTIFY_FROM) {
    warnings.push('CONTACT_NOTIFY_FROM unset — falling back to onboarding@resend.dev, which can only deliver to the Resend account owner');
  }
}

const url = process.env.TURSO_DATABASE_URL;
if (url && !/^(libsql|https|file):/.test(url)) {
  problems.push(`TURSO_DATABASE_URL should start with libsql:// (got "${url.slice(0, 20)}…")`);
}
if (url?.startsWith('file:')) {
  warnings.push('TURSO_DATABASE_URL points at a local file — fine for testing, not for production');
}

const hash = process.env.ADMIN_PASSWORD_HASH;
if (hash && !/^(sha256:[a-f0-9]+:[a-f0-9]{64}|[a-f0-9]{64})$/.test(hash)) {
  problems.push('ADMIN_PASSWORD_HASH is not a valid hash — generate it with scripts/hash-password.mjs');
}
if (hash && /^[a-f0-9]{64}$/.test(hash)) {
  warnings.push('ADMIN_PASSWORD_HASH is unsalted (legacy format) — regenerate with scripts/hash-password.mjs');
}

const secret = process.env.JWT_SECRET;
if (secret && secret.length < 32) {
  problems.push(`JWT_SECRET is only ${secret.length} characters — use at least 32`);
}

for (const key of ['PUBLIC_GALLERY_BASE', 'PUBLIC_SERMONS_BASE']) {
  const v = process.env[key];
  if (v && !/^https:\/\//.test(v)) problems.push(`${key} must be an https:// URL`);
  if (v?.endsWith('/')) warnings.push(`${key} has a trailing slash — harmless, it gets stripped`);
  if (v?.includes('.r2.dev')) {
    warnings.push(`${key} uses the r2.dev development endpoint, which Cloudflare rate-limits — set a custom bucket domain before real traffic`);
  }
}

for (const w of warnings) console.log(`  ! ${w}`);
for (const p of problems) console.log(`  ✘ ${p}`);

if (problems.length === 0) {
  console.log(`\n✓ Environment looks good${warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})` : ''}`);
} else {
  console.log(`\n✘ ${problems.length} problem(s) — see .env.example`);
  process.exit(1);
}
