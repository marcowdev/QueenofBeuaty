"use client";

import { useEffect, useMemo, useState } from "react";

type Service = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  featured: boolean;
  active: boolean;
};

type Addon = {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "choice" | "toggle";
  groupName: string;
  active: boolean;
};

const defaultServices: Service[] = [
  {
    id: 1,
    name: "Box Braids Clássicas",
    category: "Box braids",
    description: "Leves, versáteis e finalizadas com cuidado em cada divisão.",
    price: 220,
    duration: "4h a 6h",
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85",
    featured: true,
    active: true,
  },
  {
    id: 2,
    name: "Nagô Desenhada",
    category: "Nagô",
    description: "Traçado personalizado para valorizar seu rosto e seu estilo.",
    price: 130,
    duration: "2h a 3h",
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85",
    featured: true,
    active: true,
  },
  {
    id: 3,
    name: "Goddess Braids",
    category: "Goddess",
    description: "Tranças com cachos soltos para um acabamento delicado e marcante.",
    price: 280,
    duration: "5h a 7h",
    image:
      "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85",
    featured: true,
    active: true,
  },
  {
    id: 4,
    name: "Twist",
    category: "Twist",
    description: "Visual leve, moderno e confortável para a rotina.",
    price: 240,
    duration: "4h a 6h",
    image:
      "https://images.unsplash.com/photo-1618375531912-867984bdfd87?auto=format&fit=crop&w=900&q=85",
    featured: false,
    active: true,
  },
  {
    id: 5,
    name: "Tranças Infantis",
    category: "Infantil",
    description: "Atendimento paciente, delicado e pensado para as pequenas.",
    price: 95,
    duration: "1h30 a 3h",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=85",
    featured: false,
    active: true,
  },
  {
    id: 6,
    name: "Manutenção",
    category: "Manutenção",
    description: "Renove a raiz e prolongue a beleza das suas tranças.",
    price: 100,
    duration: "1h30 a 2h30",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
    featured: false,
    active: true,
  },
];

const defaultAddons: Addon[] = [
  {
    id: 1,
    name: "Vou levar meu jumbo",
    description: "Você leva o material indicado para o modelo escolhido.",
    price: 0,
    type: "choice",
    groupName: "Material",
    active: true,
  },
  {
    id: 2,
    name: "Jumbo do studio",
    description: "Escolhemos juntas a cor disponível no studio.",
    price: 45,
    type: "choice",
    groupName: "Material",
    active: true,
  },
  {
    id: 3,
    name: "Aplicação de miçangas",
    description: "Detalhes escolhidos para combinar com o seu estilo.",
    price: 20,
    type: "toggle",
    groupName: "Extras",
    active: true,
  },
  {
    id: 4,
    name: "Cachos nas pontas",
    description: "Finalização ondulada para um efeito mais delicado.",
    price: 30,
    type: "toggle",
    groupName: "Extras",
    active: true,
  },
];

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);

export function Storefront() {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [addons, setAddons] = useState<Addon[]>(defaultAddons);
  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [category, setCategory] = useState("Todos");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/catalog")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.services?.length) setServices(data.services);
        if (data?.addons?.length) setAddons(data.addons);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const categories = [
    "Todos",
    ...Array.from(new Set(services.filter((item) => item.active).map((item) => item.category))),
  ];
  const visible = services.filter(
    (item) => item.active && (category === "Todos" || item.category === category),
  );
  const selectedExtras = addons.filter((addon) => selectedAddons.includes(addon.id));
  const total = useMemo(
    () =>
      (selected?.price ?? 0) +
      selectedExtras.reduce((sum, addon) => sum + addon.price, 0),
    [selected, selectedExtras],
  );

  function openService(service: Service) {
    setSelected(service);
    setSelectedAddons([]);
    setStep(1);
  }

  function toggleAddon(addon: Addon) {
    setSelectedAddons((current) => {
      if (addon.type === "choice") {
        const groupIds = addons
          .filter((item) => item.groupName === addon.groupName && item.type === "choice")
          .map((item) => item.id);
        return [...current.filter((id) => !groupIds.includes(id)), addon.id];
      }
      return current.includes(addon.id)
        ? current.filter((id) => id !== addon.id)
        : [...current, addon.id];
    });
  }

  function sendToWhatsApp() {
    if (!selected) return;
    const extras = selectedExtras.length
      ? selectedExtras
          .map((item) => `• ${item.name}${item.price ? ` (+${money(item.price)})` : ""}`)
          .join("\n")
      : "• Sem adicionais";
    const message = [
      "Olá! Vim pelo site da Queen of Beauty 👑",
      "",
      `Meu nome é ${name || "não informado"} e gostaria de solicitar:`,
      `✨ ${selected.name}`,
      `💰 Valor estimado: ${money(total)}`,
      `🕒 Duração aproximada: ${selected.duration}`,
      "",
      "Personalização:",
      extras,
      "",
      `📅 Melhor data: ${date || "a combinar"}`,
      notes ? `📝 Observações: ${notes}` : "",
      "",
      "Podemos confirmar a disponibilidade e os detalhes?",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(
      `https://wa.me/5531971536509?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Queen of Beauty, início">
          <img
            className="brand-logo"
            src="/logo-queen-of-beauty.png"
            alt="Queen of Beauty"
          />
          <span>
            <strong>Queen of Beauty</strong>
            <small>Tranças & beleza</small>
          </span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
        <nav className={menuOpen ? "nav-open" : ""}>
          <a href="#servicos" onClick={() => setMenuOpen(false)}>
            Serviços
          </a>
          <a href="#como-funciona" onClick={() => setMenuOpen(false)}>
            Como funciona
          </a>
          <a href="#studio" onClick={() => setMenuOpen(false)}>
            O studio
          </a>
          <a
            className="nav-cta"
            href="#servicos"
            onClick={() => setMenuOpen(false)}
          >
            Escolher minha trança
          </a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            Seu cabelo, sua coroa
          </p>
          <h1>
            A trança perfeita,
            <em> do seu jeito.</em>
          </h1>
          <p className="hero-text">
            Escolha o modelo, personalize os detalhes e converse diretamente
            pelo WhatsApp. Simples, rápido e sem compromisso.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#servicos">
              Explorar serviços
              <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#como-funciona">
              Veja como funciona
            </a>
          </div>
          <div className="trust-row">
            <div>
              <span className="avatars">
                <i>J</i>
                <i>M</i>
                <i>A</i>
              </span>
              <p>
                <strong>Feito com carinho</strong>
                Atendimento personalizado
              </p>
            </div>
            <div className="rating">
              <span>★★★★★</span>
              <small>Trancista especializada</small>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-label="Composição editorial sobre tranças">
          <div className="arch arch-main">
            <div className="braid-pattern" />
            <span className="art-tag">BELEZA<br />ANCESTRAL</span>
          </div>
          <div className="arch arch-small">
            <div className="bead-pattern">● ◦ ●<br />◦ ● ◦</div>
          </div>
          <div className="quote-card">
            <span>“</span>
            A melhor versão é sempre a próxima.
          </div>
          <div className="spark spark-one">✦</div>
          <div className="spark spark-two">✦</div>
        </div>
      </section>

      <section className="quick-strip" aria-label="Diferenciais">
        <div><span>01</span><p><strong>Escolha</strong>Seu estilo favorito</p></div>
        <div><span>02</span><p><strong>Personalize</strong>Material e detalhes</p></div>
        <div><span>03</span><p><strong>Converse</strong>Finalize no WhatsApp</p></div>
      </section>

      <section className="services-section" id="servicos">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Nosso catálogo</p>
            <h2>Encontre sua próxima trança</h2>
          </div>
          <p>
            Valores iniciais. O preço final pode variar conforme comprimento,
            volume e personalização.
          </p>
        </div>

        <div className="filters" role="tablist" aria-label="Filtrar serviços">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="service-grid">
          {visible.map((service) => (
            <article className="service-card" key={service.id}>
              <button
                type="button"
                className="service-image"
                onClick={() => openService(service)}
                style={{ backgroundImage: `url(${service.image})` }}
                aria-label={`Ver ${service.name}`}
              >
                {service.featured && <span className="popular">Mais escolhido</span>}
                <span className="image-arrow">↗</span>
              </button>
              <div className="service-body">
                <div>
                  <p>{service.category}</p>
                  <h3>{service.name}</h3>
                </div>
                <p className="description">{service.description}</p>
                <div className="card-footer">
                  <span>
                    a partir de <strong>{money(service.price)}</strong>
                  </span>
                  <button type="button" onClick={() => openService(service)}>
                    Escolher
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="como-funciona">
        <div className="how-copy">
          <p className="eyebrow"><span /> Sem complicação</p>
          <h2>Seu atendimento começa aqui</h2>
          <p>
            Não precisa criar conta, preencher formulários enormes ou pagar
            antes de conversar. Você escolhe os detalhes e combina tudo
            diretamente com a gente.
          </p>
        </div>
        <div className="steps">
          <article><span>1</span><div><h3>Escolha o serviço</h3><p>Veja modelos, valores iniciais e tempo estimado.</p></div></article>
          <article><span>2</span><div><h3>Deixe com a sua cara</h3><p>Selecione jumbo, miçangas e outros detalhes.</p></div></article>
          <article><span>3</span><div><h3>Converse pelo WhatsApp</h3><p>Recebemos suas escolhas e confirmamos todos os detalhes e a agenda.</p></div></article>
        </div>
      </section>

      <section className="studio-section" id="studio">
        <div>
          <p className="eyebrow light"><span /> Queen of Beauty</p>
          <h2>Mais que um penteado. Um momento seu.</h2>
          <p>
            Cuidado, escuta e técnica para você sair se sentindo ainda mais
            bonita — exatamente como deve ser.
          </p>
          <a
            href="https://wa.me/5531971536509"
            target="_blank"
            rel="noreferrer"
            className="button button-light"
          >
            Falar com o studio
            <span>↗</span>
          </a>
        </div>
        <div className="studio-seal">
          <img
           className="studio-logo"
           src="/logo-queen-of-beauty.png"
           alt="Queen of Beauty"
         />
         <small>
            feito para<br />
            pessoas reais
         </small>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#inicio">
        <img
          className="brand-logo"
          src="/logo-queen-of-beauty.png"
          alt="Queen of Beauty"
        />  
          <span><strong>Queen of Beauty</strong><small>Tranças & beleza</small></span>
        </a>
        <p>Beleza, identidade e cuidado em cada detalhe.</p>
        <div>
          <a href="#servicos">Serviços</a>
          <a href="https://wa.me/5531971536509" target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="/admin">Área da proprietária</a>
        </div>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Fechar"
            >
              ×
            </button>
            <div className="modal-progress">
              <span className={step >= 1 ? "active" : ""}>1</span>
              <i />
              <span className={step >= 2 ? "active" : ""}>2</span>
              <i />
              <span className={step >= 3 ? "active" : ""}>3</span>
            </div>

            {step === 1 && (
              <div className="modal-step">
                <p className="modal-kicker">Você escolheu</p>
                <h2 id="modal-title">{selected.name}</h2>
                <div className="selection-summary">
                  <div
                    style={{ backgroundImage: `url(${selected.image})` }}
                    aria-hidden="true"
                  />
                  <p>
                    {selected.description}
                    <span>Tempo estimado: {selected.duration}</span>
                  </p>
                  <strong>{money(selected.price)}</strong>
                </div>
                <button
                  className="button button-primary modal-next"
                  type="button"
                  onClick={() => setStep(2)}
                >
                  Personalizar meu serviço <span>→</span>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="modal-step">
                <p className="modal-kicker">Deixe do seu jeito</p>
                <h2 id="modal-title">Personalize sua trança</h2>
                {Array.from(new Set(addons.filter((a) => a.active).map((a) => a.groupName))).map(
                  (group) => (
                    <div className="addon-group" key={group}>
                      <h3>{group}</h3>
                      {addons
                        .filter((addon) => addon.active && addon.groupName === group)
                        .map((addon) => (
                          <label className="addon-row" key={addon.id}>
                            <input
                              type={addon.type === "choice" ? "radio" : "checkbox"}
                              name={addon.type === "choice" ? group : String(addon.id)}
                              checked={selectedAddons.includes(addon.id)}
                              onChange={() => toggleAddon(addon)}
                            />
                            <span className="fake-check" />
                            <span>
                              <strong>{addon.name}</strong>
                              <small>{addon.description}</small>
                            </span>
                            <b>{addon.price ? `+ ${money(addon.price)}` : "Incluso"}</b>
                          </label>
                        ))}
                    </div>
                  ),
                )}
                <div className="modal-actions">
                  <button className="back-button" type="button" onClick={() => setStep(1)}>
                    Voltar
                  </button>
                  <button className="button button-primary" type="button" onClick={() => setStep(3)}>
                    Continuar <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="modal-step">
                <p className="modal-kicker">Último passo</p>
                <h2 id="modal-title">Como podemos te chamar?</h2>
                <div className="form-grid">
                  <label>
                    Seu nome
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex.: Maria"
                    />
                  </label>
                  <label>
                    Data desejada
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>
                  <label className="full-field">
                    Alguma observação?
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Ex.: prefiro jumbo castanho, cabelo na cintura..."
                    />
                  </label>
                </div>
                <div className="order-total">
                  <span>Valor estimado</span>
                  <strong>{money(total)}</strong>
                </div>
                <p className="estimate-note">
                  O valor final e a disponibilidade serão confirmados pelo WhatsApp.
                </p>
                <div className="modal-actions">
                  <button className="back-button" type="button" onClick={() => setStep(2)}>
                    Voltar
                  </button>
                  <button className="button whatsapp-button" type="button" onClick={sendToWhatsApp}>
                    Enviar pelo WhatsApp <span>↗</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
