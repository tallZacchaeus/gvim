# Step 4 — Direct-to-R2 uploads

## Why this exists

On Cloudflare the file was streamed through the API into the bucket. Vercel Functions
accept request bodies up to 100 MB, so routing a 50 MB sermon through the API would
technically work — but it is the wrong shape:

- the file crosses the network twice (browser -> function -> R2) instead of once
- a slow 40 MB upload holds a function open for its whole duration, burning
  compute on what is really just a byte pipe
- the function has to buffer the file in memory to hand it to the S3 client
- upload progress is invisible to the browser

So the file does not pass through the API at all:

```
browser ──1── POST /api/uploads/presign      (auth; returns a signed PUT URL + key)
browser ──2── PUT  https://<bucket>…         (file goes straight to R2)
browser ──3── POST /api/gallery|/api/sermons (metadata + key only)
```

Step 3 verifies the object really exists in R2 before writing the row, so a failed
upload can never leave a broken record pointing at nothing.

## 1. Create an R2 API token

Cloudflare dashboard → **R2** → **Manage R2 API Tokens** → *Create API token*.

- Permission: **Object Read & Write**
- Scope it to the `gvim-gallery` and `gvim-sermons` buckets

Set these as Vercel environment variables:

```
R2_ACCOUNT_ID=<your Cloudflare account id>
R2_ACCESS_KEY_ID=<from the token>
R2_SECRET_ACCESS_KEY=<from the token>
R2_GALLERY_BUCKET=gvim-gallery
R2_SERMONS_BUCKET=gvim-sermons
```

Bucket bindings needed no credentials; the S3 API does. Treat the secret like a password.

## 2. Add CORS to both buckets — REQUIRED

The browser PUTs directly to R2, so without a CORS rule every upload fails with an
opaque network error.

### Via wrangler (easiest)

Note the schema: wrangler wants the **R2 API** shape (`rules` / `allowed`), which is
*not* the S3-style JSON the Cloudflare dashboard shows.

The live configuration for both buckets is committed at `infra/r2-cors.json` — edit
that file rather than writing a new one, so the repo stays the source of truth.

```bash
npx wrangler r2 bucket cors set gvim-gallery --file infra/r2-cors.json --force
npx wrangler r2 bucket cors set gvim-sermons --file infra/r2-cors.json --force
```

Check it with `npx wrangler r2 bucket cors list gvim-gallery`.

### Current state — configured and verified (2026-10-09)

Both buckets allow `PUT` from: the apex and `www` production origins,
`https://gvim.vercel.app`, the project-scoped Vercel alias,
`https://gvim-*-zacchaeus-projects-719b8ec1.vercel.app`, and `http://localhost:5173`.

The wildcard entry matters: every Vercel deployment gets its own hash subdomain
(`gvim-3qvl8bqsb-...`), so enumerating preview URLs one at a time is futile. R2 does
match a `*` inside an origin string — verified by preflight, not assumed:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS \
  -H "Origin: https://gvim-3qvl8bqsb-zacchaeus-projects-719b8ec1.vercel.app" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" \
  "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/gvim-gallery/probe.jpg"
```

That returns `204`; an unlisted origin returns `403`, so the wildcard did not widen
the bucket to the whole internet. Re-run the same probe after any CORS change —
`cors list` only proves what was *stored*, not what R2 *matches*.

## 3. Verify

```bash
npm run test:api
```

Runs the whole presign → upload → commit path against an in-memory bucket, including
a simulated 9 MB photo and a 40 MB sermon — both far over the limit that forced this
design. No credentials, no network.

## Notes

- Object keys are always generated server-side. A client-supplied key would let an
  admin write anywhere in the bucket, including over existing files.
- Presigned URLs expire after 10 minutes.
- The commit endpoints reject any key that doesn't match `gallery/<known-category>/<id>.<ext>`
  or `sermons/<id>.<ext>`.
- Limits unchanged: 50 MB per file, images/video for gallery, audio/video for sermons.
- The presigned PUT must carry the exact `Content-Type` it was signed with, or the
  signature check fails. `uploadFiles()` in `src/lib/api.ts` handles this.

## Troubleshooting: "check the R2 bucket's CORS rules allow PUT from this site"

**CORS is usually not the cause.** Verify before changing anything:

```bash
curl -s -o /dev/null -D - -X OPTIONS \
  -H "Origin: https://www.godsvesselinternationalministry.org" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" \
  "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/gvim-gallery/probe.jpg"
```

A `204` with `Access-Control-Allow-Origin` means CORS is working and the message
is misleading.

**Why the message lies.** R2 answers the preflight with CORS headers, but its
*error* responses do not carry `Access-Control-Allow-Origin`. Measured
2026-10-11:

| Request | Status | `Access-Control-Allow-Origin` |
|---|---|---|
| `OPTIONS` preflight | 204 | present |
| `PUT` with a dead signature | 403 | **absent** |

So when the PUT itself fails, the browser withholds the response from
JavaScript, `xhr.onerror` fires with no status, and the client cannot tell a
403 from a dropped connection. The old message guessed "CORS", which is the one
thing already proven to work by the time the PUT runs.

**Actual causes, in order of likelihood**
1. **The signature expired.** URLs for a whole batch are signed up front, so the
   clock starts on all of them before the first byte moves. Expiry is now 3600s
   (was 600s), uploads run four at a time, and a failed file is re-signed and
   retried once.
2. **The connection dropped** — common on mobile with large video files.
3. A genuine CORS change. Check with the command above before assuming this.

**Note:** a file over 50 MB, or an unsupported type, fails earlier at
`/api/uploads/presign` with a specific message — not this one.

