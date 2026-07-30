import { ensureCatalog } from "../catalog/route";

type AdminEnv = {
  DB: D1Database;
  ADMIN_KEY?: string;
};

async function getRuntime() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as AdminEnv;
}

function isAuthorized(request: Request, runtime: AdminEnv) {
  const configured = runtime.ADMIN_KEY;
  const supplied = request.headers.get("x-admin-key");
  return Boolean(configured && supplied && configured === supplied);
}

export async function GET(request: Request) {
  const runtime = await getRuntime();
  if (!isAuthorized(request, runtime)) {
    return Response.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  await ensureCatalog(runtime.DB);
  const [services, addons] = await Promise.all([
    runtime.DB.prepare("SELECT * FROM services ORDER BY sort_order, id").all(),
    runtime.DB.prepare(
      "SELECT id, name, description, price, type, group_name AS groupName, active, sort_order AS sortOrder FROM addons ORDER BY sort_order, id",
    ).all(),
  ]);
  return Response.json({ services: services.results, addons: addons.results });
}

export async function POST(request: Request) {
  const runtime = await getRuntime();
  if (!isAuthorized(request, runtime)) {
    return Response.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  await ensureCatalog(runtime.DB);
  const body = (await request.json()) as Record<string, unknown>;
  const kind = body.kind === "addon" ? "addon" : "service";

  if (kind === "service") {
    const result = await runtime.DB.prepare(
      `INSERT INTO services
      (name, category, description, price, duration, image, featured, active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        String(body.name ?? "").trim(),
        String(body.category ?? "Outros").trim(),
        String(body.description ?? "").trim(),
        Number(body.price ?? 0),
        String(body.duration ?? "A combinar").trim(),
        String(body.image ?? "").trim(),
        body.featured ? 1 : 0,
        body.active === false ? 0 : 1,
        Number(body.sortOrder ?? 0),
      )
      .run();
    return Response.json({ id: result.meta.last_row_id }, { status: 201 });
  }

  const result = await runtime.DB.prepare(
    `INSERT INTO addons
    (name, description, price, type, group_name, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      String(body.name ?? "").trim(),
      String(body.description ?? "").trim(),
      Number(body.price ?? 0),
      body.type === "choice" ? "choice" : "toggle",
      String(body.groupName ?? "Extras").trim(),
      body.active === false ? 0 : 1,
      Number(body.sortOrder ?? 0),
    )
    .run();
  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
}

export async function PUT(request: Request) {
  const runtime = await getRuntime();
  if (!isAuthorized(request, runtime)) {
    return Response.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const id = Number(body.id);
  if (!id) return Response.json({ error: "Cadastro inválido." }, { status: 400 });

  if (body.kind === "addon") {
    await runtime.DB.prepare(
      `UPDATE addons SET name=?, description=?, price=?, type=?, group_name=?,
      active=?, sort_order=? WHERE id=?`,
    )
      .bind(
        String(body.name ?? "").trim(),
        String(body.description ?? "").trim(),
        Number(body.price ?? 0),
        body.type === "choice" ? "choice" : "toggle",
        String(body.groupName ?? "Extras").trim(),
        body.active === false ? 0 : 1,
        Number(body.sortOrder ?? 0),
        id,
      )
      .run();
  } else {
    await runtime.DB.prepare(
      `UPDATE services SET name=?, category=?, description=?, price=?, duration=?,
      image=?, featured=?, active=?, sort_order=? WHERE id=?`,
    )
      .bind(
        String(body.name ?? "").trim(),
        String(body.category ?? "Outros").trim(),
        String(body.description ?? "").trim(),
        Number(body.price ?? 0),
        String(body.duration ?? "A combinar").trim(),
        String(body.image ?? "").trim(),
        body.featured ? 1 : 0,
        body.active === false ? 0 : 1,
        Number(body.sortOrder ?? 0),
        id,
      )
      .run();
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const runtime = await getRuntime();
  if (!isAuthorized(request, runtime)) {
    return Response.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const kind = url.searchParams.get("kind");
  if (!id) return Response.json({ error: "Cadastro inválido." }, { status: 400 });
  await runtime.DB.prepare(`DELETE FROM ${kind === "addon" ? "addons" : "services"} WHERE id=?`)
    .bind(id)
    .run();
  return Response.json({ ok: true });
}
