#!/usr/bin/env node
/**
 * Generate an ADMIN_PASSWORD_HASH for the Vercel environment.
 *
 *   node scripts/hash-password.mjs 'your-password'
 *
 * Emits `sha256:<salt>:<hash>` where hash = sha256(salt + password). The salted
 * form is what lib/util.ts:verifyPassword expects; the unsalted legacy form is
 * still accepted for existing deployments but should not be used for new ones.
 */
const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs 'your-password'");
  process.exit(1);
}
if (password.length < 12) {
  console.error(`✘ Password is ${password.length} characters. Use at least 12.`);
  process.exit(1);
}

const saltBytes = new Uint8Array(16);
crypto.getRandomValues(saltBytes);
const salt = Array.from(saltBytes, b => b.toString(16).padStart(2, '0')).join('');

const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password));
const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');

console.log('\nSet this as the ADMIN_PASSWORD_HASH environment variable in Vercel:\n');
console.log(`sha256:${salt}:${hash}\n`);
console.log('The password itself is never stored. Keep it in a password manager.\n');
