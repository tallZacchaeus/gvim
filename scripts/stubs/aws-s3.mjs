/**
 * In-memory stand-in for @aws-sdk/client-s3, used only by scripts/smoke-api.mjs.
 * The bucket lives on globalThis so it is shared across separately-bundled handlers.
 */
globalThis.__R2_STORE ??= new Set();

export class S3Client {
  constructor(cfg) { this.cfg = cfg; }
  async send(cmd) { return cmd.__handle(); }
}
export class PutObjectCommand {
  constructor(input) { this.input = input; }
  __handle() { globalThis.__R2_STORE.add(this.input.Key); return {}; }
}
export class DeleteObjectCommand {
  constructor(input) { this.input = input; }
  __handle() { globalThis.__R2_STORE.delete(this.input.Key); return {}; }
}
export class HeadObjectCommand {
  constructor(input) { this.input = input; }
  __handle() {
    if (!globalThis.__R2_STORE.has(this.input.Key)) {
      const err = new Error('NotFound'); err.name = 'NotFound'; throw err;
    }
    return {};
  }
}
