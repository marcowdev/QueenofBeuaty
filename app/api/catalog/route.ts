type CatalogEnv = {
  DB: D1Database;
};

async function getRuntime() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as CatalogEnv;
}

const serviceSeed = [
  ["Box Braids Clássicas", "Box braids", "Leves, versáteis e finalizadas com cuidado em cada divisão.", 220, "4h a 6h", "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85", 1, 1, 1],
  ["Nagô Desenhada", "Nagô", "Traçado personalizado para valorizar seu rosto e seu estilo.", 130, "2h a 3h", "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85", 1, 1, 2],
  ["Goddess Braids", "Goddess", "Tranças com cachos soltos para um acabamento delicado e marcante.", 280, "5h a 7h", "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85", 1, 1, 3],
  ["Twist", "Twist", "Visual leve, moderno e confortável para a rotina.", 240, "4h a 6h", "https://images.unsplash.com/photo-1618375531912-867984bdfd87?auto=format&fit=crop&w=900&q=85", 0, 1, 4],
  ["Tranças Infantis", "Infantil", "Atendimento paciente, delicado e pensado para as pequenas.", 95, "1h30 a 3h", "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=85", 0, 1, 5],
  ["Manutenção", "Manutenção", "Renove a raiz e prolongue a beleza das suas tranças.", 100, "1h30 a 2h30", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85", 0, 1, 6],
] as const;

const addonSeed = [
  ["Vou levar meu jumbo", "Você leva o material indicado para o modelo escolhido.", 0, "choice", "Material", 1, 1],
  ["Jumbo do studio", "Escolhemos juntas a cor disponível no studio.", 45, "choice", "Material", 1, 2],
  ["Aplicação de miçangas", "Detalhes escolhidos para combinar com o seu estilo.", 20, "toggle", "Extras", 1, 3],
  ["Cachos nas pontas", "Finalização ondulada para um efeito mais delicado.", 30, "toggle", "Extras", 1, 4],
] as const;

async function ensureCatalog(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      duration TEXT NOT NULL DEFAULT 'A combinar',
      image TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'toggle',
      group_name TEXT NOT NULL DEFAULT 'Extras',
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);

  const serviceCount = await db.prepare("SELECT COUNT(*) AS count FROM services").first<{ count: number }>();
  if (!serviceCount?.count) {
    await db.batch(
      serviceSeed.map((row) =>
        db.prepare(
          "INSERT INTO services (name, category, description, price, duration, image, featured, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(...row),
      ),
    );
  }

  const addonCount = await db.prepare("SELECT COUNT(*) AS count FROM addons").first<{ count: number }>();
  if (!addonCount?.count) {
    await db.batch(
      addonSeed.map((row) =>
        db.prepare(
          "INSERT INTO addons (name, description, price, type, group_name, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ).bind(...row),
      ),
    );
  }
}

export async function GET() {
  try {
    const db = (await getRuntime()).DB;
    await ensureCatalog(db);
    const [servicesResult, addonsResult] = await Promise.all([
      db.prepare(`SELECT id, name, category, description, price, duration, image,
        featured, active FROM services ORDER BY sort_order, id`).all(),
      db.prepare(`SELECT id, name, description, price, type, group_name AS groupName,
        active FROM addons ORDER BY sort_order, id`).all(),
    ]);

    return Response.json({
      services: servicesResult.results.map((row) => ({
        ...row,
        featured: Boolean(row.featured),
        active: Boolean(row.active),
      })),
      addons: addonsResult.results.map((row) => ({
        ...row,
        active: Boolean(row.active),
      })),
    });
  } catch {
    return Response.json(
      { error: "Catálogo temporariamente indisponível." },
      { status: 503 },
    );
  }
}

export { ensureCatalog };
