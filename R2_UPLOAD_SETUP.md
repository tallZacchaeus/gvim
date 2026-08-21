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

```json
{
  "rules": [
    {
      "allowed": {
        "origins": ["https://<your-project>.vercel.app", "http://localhost:5173"],
        "methods": ["PUT"],
        "headers": ["content-type"]
      },
      "exposeHeaders": ["etag"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

```bash
npx wrangler r2 bucket cors set gvim-gallery --file r2-cors.json --force
npx wrangler r2 bucket cors set gvim-sermons --file r2-cors.json --force
```

Check it with `npx wrangler r2 bucket cors list gvim-gallery`.

### Current state

`http://localhost:5173` is already configured on both buckets, so local development
works. **The production origin still has to be added after the first Vercel deploy** —
re-run the two commands above with the real URL in `origins`.

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
