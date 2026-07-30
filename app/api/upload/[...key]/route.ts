type UploadEnv = {
  BUCKET: R2Bucket;
};

async function getRuntime() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as UploadEnv;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const object = await (await getRuntime()).BUCKET.get(key.join("/"));
  if (!object) return new Response("Imagem não encontrada", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
