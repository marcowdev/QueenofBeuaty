"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import "./admin.css";

type Service = {
  id?: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  featured: boolean | number;
  active: boolean | number;
  sortOrder?: number;
  sort_order?: number;
};

type Addon = {
  id?: number;
  name: string;
  description: string;
  price: number;
  type: "choice" | "toggle";
  groupName: string;
  active: boolean | number;
  sortOrder?: number;
};

const emptyService: Service = {
  name: "",
  category: "",
  description: "",
  price: 0,
  duration: "",
  image: "",
  featured: false,
  active: true,
  sortOrder: 0,
};

const emptyAddon: Addon = {
  name: "",
  description: "",
  price: 0,
  type: "toggle",
  groupName: "Extras",
  active: true,
  sortOrder: 0,
};

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function AdminPanel() {
  const [key, setKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [tab, setTab] = useState<"services" | "addons">("services");
  const [serviceForm, setServiceForm] = useState<Service>(emptyService);
  const [addonForm, setAddonForm] = useState<Addon>(emptyAddon);
  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async (adminKey: string) => {
    const response = await fetch("/api/admin", {
      headers: { "x-admin-key": adminKey },
    });
    if (!response.ok) throw new Error("Senha incorreta ou painel ainda não configurado.");
    const data = await response.json();
    setServices(
      data.services.map((service: Service) => ({
        ...service,
        featured: Boolean(service.featured),
        active: Boolean(service.active),
        sortOrder: service.sort_order ?? service.sortOrder ?? 0,
      })),
    );
    setAddons(
      data.addons.map((addon: Addon) => ({
        ...addon,
        active: Boolean(addon.active),
      })),
    );
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("queen-admin-key");
    if (!saved) return;
    // Restoring a session is intentionally performed once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(saved)
      .then(() => {
        setKey(saved);
        setAuthenticated(true);
      })
      .catch(() => sessionStorage.removeItem("queen-admin-key"));
  }, [loadData]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await loadData(draftKey);
      setKey(draftKey);
      setAuthenticated(true);
      sessionStorage.setItem("queen-admin-key", draftKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  function openNew() {
    setEditing(false);
    if (tab === "services") setServiceForm({ ...emptyService });
    else setAddonForm({ ...emptyAddon });
    setDrawerOpen(true);
  }

  function openService(service: Service) {
    setTab("services");
    setServiceForm({ ...service });
    setEditing(true);
    setDrawerOpen(true);
  }

  function openAddon(addon: Addon) {
    setTab("addons");
    setAddonForm({ ...addon });
    setEditing(true);
    setDrawerOpen(true);
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const item = tab === "services" ? serviceForm : addonForm;
    try {
      const response = await fetch("/api/admin", {
        method: editing ? "PUT" : "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-key": key,
        },
        body: JSON.stringify({
          ...item,
          kind: tab === "services" ? "service" : "addon",
        }),
      });
      if (!response.ok) throw new Error("Não foi possível salvar. Revise os dados.");
      await loadData(key);
      setDrawerOpen(false);
      setMessage("Alteração salva e publicada no catálogo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(kind: "service" | "addon", id?: number) {
    if (!id || !window.confirm("Tem certeza que deseja excluir este cadastro?")) return;
    const response = await fetch(`/api/admin?kind=${kind}&id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": key },
    });
    if (response.ok) {
      await loadData(key);
      setMessage("Cadastro removido.");
    }
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("Enviando imagem...");
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-key": key },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha no envio.");
      setServiceForm((current) => ({ ...current, image: data.url }));
      setMessage("Imagem pronta. Agora salve o serviço.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="admin-login">
        <Link className="admin-brand" href="/">
          <img
            className="admin-logo"
            src="/logo-queen-of-beauty.png"
            alt="Queen of Beauty"
          />
          <strong>Queen of Beauty</strong>
        </Link>
        <form onSubmit={login}>
          <p>Painel da proprietária</p>
          <h1>Cuide do seu catálogo</h1>
          <span className="login-copy">
            Entre com sua senha para editar serviços, preços, fotos e adicionais.
          </span>
          <label>
            Senha de acesso
            <input
              type="password"
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </label>
          {message && <div className="admin-alert error">{message}</div>}
          <button type="submit" disabled={busy}>
            {busy ? "Entrando..." : "Entrar no painel"}
          </button>
          <Link href="/">← Voltar para o site</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          <img
            className="admin-logo"
            src="/logo-queen-of-beauty.png"
            alt="Queen of Beauty"
          />
          <strong>Queen of Beauty</strong>
        </Link>
        <nav>
          <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>
            <span>✦</span> Serviços
            <b>{services.length}</b>
          </button>
          <button className={tab === "addons" ? "active" : ""} onClick={() => setTab("addons")}>
            <span>＋</span> Adicionais
            <b>{addons.length}</b>
          </button>
          <Link href="/" target="_blank">
            <span>↗</span> Ver site
          </Link>
        </nav>
        <div className="owner-card">
          <img
            className="owner-logo"
          src="/logo-queen-of-beauty.png"
            alt="Queen of Beauty"
          />
          <p><strong>Proprietária</strong><small>Acesso administrativo</small></p>
          <button
            onClick={() => {
              sessionStorage.removeItem("queen-admin-key");
              setAuthenticated(false);
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <section className="admin-content">
        <header>
          <div>
            <p>Catálogo</p>
            <h1>{tab === "services" ? "Serviços" : "Adicionais"}</h1>
          </div>
          <button className="admin-primary" onClick={openNew}>
            <span>＋</span>
            {tab === "services" ? "Novo serviço" : "Novo adicional"}
          </button>
        </header>

        {message && <div className="admin-alert">{message}</div>}

        <div className="admin-summary">
          <article>
            <span>Itens publicados</span>
            <strong>
              {tab === "services"
                ? services.filter((item) => item.active).length
                : addons.filter((item) => item.active).length}
            </strong>
            <small>visíveis no site</small>
          </article>
          <article>
            <span>{tab === "services" ? "Serviços em destaque" : "Grupos ativos"}</span>
            <strong>
              {tab === "services"
                ? services.filter((item) => item.featured).length
                : new Set(addons.map((item) => item.groupName)).size}
            </strong>
            <small>organização do catálogo</small>
          </article>
          <article>
            <span>Status do site</span>
            <strong className="status-live">Online</strong>
            <small>recebendo solicitações</small>
          </article>
        </div>

        <div className="admin-table-wrap">
          <div className="table-title">
            <h2>{tab === "services" ? "Todos os serviços" : "Todos os adicionais"}</h2>
            <span>As alterações aparecem no site assim que forem salvas.</span>
          </div>
          {tab === "services" ? (
            <div className="admin-table">
              {services.map((service) => (
                <article key={service.id}>
                  <div
                    className="admin-thumb"
                    style={{ backgroundImage: `url(${service.image})` }}
                  />
                  <div className="item-main">
                    <strong>{service.name}</strong>
                    <span>{service.category} · {service.duration}</span>
                  </div>
                  <b>{money(service.price)}</b>
                  <span className={service.active ? "pill active" : "pill"}>
                    {service.active ? "Publicado" : "Oculto"}
                  </span>
                  <div className="row-actions">
                    <button onClick={() => openService(service)}>Editar</button>
                    <button className="danger" onClick={() => removeItem("service", service.id)}>Excluir</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-table">
              {addons.map((addon) => (
                <article key={addon.id}>
                  <div className="addon-icon">＋</div>
                  <div className="item-main">
                    <strong>{addon.name}</strong>
                    <span>{addon.groupName} · {addon.type === "choice" ? "Escolha única" : "Opcional"}</span>
                  </div>
                  <b>{addon.price ? money(addon.price) : "Incluso"}</b>
                  <span className={addon.active ? "pill active" : "pill"}>
                    {addon.active ? "Publicado" : "Oculto"}
                  </span>
                  <div className="row-actions">
                    <button onClick={() => openAddon(addon)}>Editar</button>
                    <button className="danger" onClick={() => removeItem("addon", addon.id)}>Excluir</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {drawerOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setDrawerOpen(false)}>
          <form
            className="admin-drawer"
            onSubmit={saveItem}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p>{editing ? "Editar cadastro" : "Novo cadastro"}</p>
                <h2>{tab === "services" ? "Serviço" : "Adicional"}</h2>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)}>×</button>
            </header>

            {tab === "services" ? (
              <div className="drawer-fields">
                <label>Nome do serviço<input required value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder="Ex.: Box Braids Clássicas" /></label>
                <div className="field-row">
                  <label>Categoria<input required value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} placeholder="Ex.: Box braids" /></label>
                  <label>Preço inicial<input required type="number" min="0" step="0.01" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} /></label>
                </div>
                <label>Descrição<textarea required value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} placeholder="Explique brevemente o resultado e os diferenciais." /></label>
                <label>Tempo estimado<input required value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} placeholder="Ex.: 4h a 6h" /></label>
                <label>
                  Foto do serviço
                  <div className="upload-box">
                    {/* A blob URL or uploaded R2 URL is intentionally rendered directly. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {serviceForm.image ? <img src={serviceForm.image} alt="Prévia" /> : <span>Sem imagem</span>}
                    <label className="upload-button">
                      {busy ? "Enviando..." : "Escolher foto"}
                      <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0])} />
                    </label>
                  </div>
                </label>
                <label>Ou cole o link da foto<input value={serviceForm.image} onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })} placeholder="https://..." /></label>
                <div className="switch-row">
                  <label><input type="checkbox" checked={Boolean(serviceForm.active)} onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })} /><span /> Visível no site</label>
                  <label><input type="checkbox" checked={Boolean(serviceForm.featured)} onChange={(e) => setServiceForm({ ...serviceForm, featured: e.target.checked })} /><span /> Marcar como mais escolhido</label>
                </div>
              </div>
            ) : (
              <div className="drawer-fields">
                <label>Nome do adicional<input required value={addonForm.name} onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })} placeholder="Ex.: Aplicação de miçangas" /></label>
                <label>Descrição<textarea value={addonForm.description} onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })} placeholder="Explique o que está incluso." /></label>
                <div className="field-row">
                  <label>Preço<input type="number" min="0" step="0.01" value={addonForm.price} onChange={(e) => setAddonForm({ ...addonForm, price: Number(e.target.value) })} /></label>
                  <label>Grupo<input required value={addonForm.groupName} onChange={(e) => setAddonForm({ ...addonForm, groupName: e.target.value })} placeholder="Ex.: Extras" /></label>
                </div>
                <label>Como o cliente escolhe
                  <select value={addonForm.type} onChange={(e) => setAddonForm({ ...addonForm, type: e.target.value as "choice" | "toggle" })}>
                    <option value="toggle">Pode marcar junto com outros</option>
                    <option value="choice">Escolhe somente um do grupo</option>
                  </select>
                </label>
                <div className="switch-row">
                  <label><input type="checkbox" checked={Boolean(addonForm.active)} onChange={(e) => setAddonForm({ ...addonForm, active: e.target.checked })} /><span /> Visível no site</label>
                </div>
              </div>
            )}

            {message && <div className="admin-alert">{message}</div>}
            <footer>
              <button type="button" onClick={() => setDrawerOpen(false)}>Cancelar</button>
              <button className="admin-primary" type="submit" disabled={busy}>
                {busy ? "Salvando..." : "Salvar alterações"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
}
