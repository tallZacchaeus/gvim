/** Stand-in for @aws-sdk/s3-request-presigner (see scripts/smoke-api.mjs). */
export async function getSignedUrl(_client, cmd, _opts) {
  return `https://r2.test/${cmd.input.Key}?X-Amz-Signature=stub`;
}
