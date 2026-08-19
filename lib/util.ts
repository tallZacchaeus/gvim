/**
 * Shared helpers for the Vercel Functions in ../api.
 *
 * Ported from the Cloudflare Pages version: the `Env` bindings object is gone
 * (secrets now come from process.env) but the JWT/password/cookie logic is
 * unchanged, so existing admin sessions and password hashes stay valid.
 */

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) }
  });
}

export function bad(msg: string, status = 400) {
  return json({ error: msg }, { status });
}

export function genId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Read a required secret, failing loudly rather than silently misbehaving. */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

/**
 * Vercel exposes dynamic path segments ([id].ts) as query parameters, but fall
 * back to the trailing path segment so the handlers also work when called directly.
 */
export function pathParam(request: Request, name: string): string {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get(name);
  if (fromQuery) return fromQuery;
  const segments = url.pathname.split('/').filter(Boolean);
  return decodeURIComponent(segments[segments.length - 1] || '');
}

function b64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') bytes = new TextEncoder().encode(input);
  else if (input instanceof ArrayBuffer) bytes = new Uint8Array(input);
  else bytes = input;
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
}

export async function signJwt(payload: Record<string, unknown>, secret: string, ttlSec = 60 * 60 * 8): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSec };
  const h = b64url(JSON.stringify(header));
  const b = b64url(JSON.stringify(body));
  const sig = b64url(await hmac(secret, `${h}.${b}`));
  return `${h}.${b}.${sig}`;
}

/** Constant-time comparison so signature checks don't leak timing information. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, any> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const expected = b64url(await hmac(secret, `${h}.${b}`));
  if (!timingSafeEqual(expected, s)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(b)));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch { return null; }
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('sha256:')) {
    const [, salt, expected] = hash.split(':');
    const got = await sha256Hex(salt + password);
    return timingSafeEqual(got, expected);
  }
  const got = await sha256Hex(password);
  return timingSafeEqual(got, hash);
}

export function getCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function requireAdmin(req: Request): Promise<Record<string, any> | null> {
  const token = getCookie(req, 'gvim_admin');
  if (!token) return null;
  return verifyJwt(token, env('JWT_SECRET'));
}

/**
 * Guard for admin-only handlers. The Cloudflare build enforced this centrally in
 * functions/api/_middleware.ts; Vercel middleware cannot pass the decoded user
 * down to a Node function, so each protected handler calls this explicitly.
 */
export async function guard(req: Request): Promise<Response | null> {
  const user = await requireAdmin(req);
  return user ? null : bad('Unauthorized', 401);
}

/** Client IP — Cloudflare's CF-Connecting-IP has no equivalent on Vercel. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || '';
}
