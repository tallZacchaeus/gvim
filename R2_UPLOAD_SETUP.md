# Step 4 — Direct-to-R2 uploads

## Why this exists

Vercel caps function request bodies at **4.5 MB**. On Cloudflare the file was streamed
through the API into the bucket; on Vercel a 9 MB photo is rejected by the platform
before the handler runs, and sermon audio never had a chance.

So the file no longer passes through the API at all:

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

The browser now PUTs directly to R2, so without a CORS rule every upload fails with
an opaque network error. Cloudflare dashboard → each bucket → **Settings** → **CORS Policy**:

```json
[
  {
    "AllowedOrigins": [
      "https://<your-project>.vercel.app",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add your custom domain to `AllowedOrigins` when you set one up. The UI surfaces a
CORS hint on network failure, but the fix is always here.

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
