type UploadEnv = {
  BUCKET: R2Bucket;
  ADMIN_KEY?: string;
};

async function getRuntime() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as UploadEnv;
}

export async function POST(request: Request) {
  const runtime = await getRuntime();
  if (!runtime.ADMIN_KEY || request.headers.get("x-admin-key") !== runtime.ADMIN_KEY) {
    return Response.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return Response.json({ error: "Selecione uma imagem válida." }, { status: 400 });
  }
  if (file.size > 6 * 1024 * 1024) {
    return Response.json({ error: "A imagem deve ter no máximo 6 MB." }, { status: 400 });
  }
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
  const key = `catalog/${crypto.randomUUID()}.${extension}`;
  await runtime.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  return Response.json({ url: `/api/upload/${encodeURIComponent(key)}` });
}
