const LIVE_KEY = "streamerHubConfig_v2";
const PREVIEW_KEY = "streamerHubPreview_v2";

const clone = value => JSON.parse(JSON.stringify(value));
const SECTION_TYPES = ["live","socials","culture","featured","clips","upcoming","announcements","sponsors","about","custom"];
const SECTION_DEFAULT_NAMES = { live:"Kick / En vivo", socials:"Redes", culture:"Instagram / Cultura", featured:"Carrusel", clips:"Clips", upcoming:"Próximo stream", announcements:"Anuncio", sponsors:"Canjes / Patrocinadores", about:"Sobre mí", custom:"Extra" };
function normalizeSectionItems(c) {
  let items = Array.isArray(c.sectionItems) ? c.sectionItems : [];
  if (!items.length) {
    const legacy = Array.isArray(c.sectionOrder) ? c.sectionOrder.filter(x => SECTION_TYPES.includes(x)) : SECTION_TYPES.slice();
    const order = [...legacy, ...SECTION_TYPES.filter(x => !legacy.includes(x))];
    items = order.map(type => ({ id:type, type, name:SECTION_DEFAULT_NAMES[type] || type, enabled:c.sections?.[type] !== false }));
  }
  const seen = new Set();
  items = items.filter(x => x && SECTION_TYPES.includes(x.type)).map((x,i) => {
    let id = String(x.id || `${x.type}_${i+1}`);
    if (seen.has(id)) id = `${id}_${i+1}`;
    seen.add(id);
    const style=x.style&&typeof x.style==='object'?{...x.style}:{};
    return { id, type:x.type, name:String(x.name || SECTION_DEFAULT_NAMES[x.type] || x.type), enabled:x.enabled !== false, data:x.data&&typeof x.data==='object'?clone(x.data):undefined, style:{titleWhite:style.titleWhite||'',titleNeon:style.titleNeon||'',titleMode:style.titleMode||'pink',cardBorder:style.cardBorder||'',cardGlow:style.cardGlow??'',bgGlow:style.bgGlow||'',bgGlowStrength:style.bgGlowStrength??'',titleWhiteGlow:style.titleWhiteGlow??'',titleNeonGlow:style.titleNeonGlow??'',titleBrightness:style.titleBrightness??''} };
  });
  SECTION_TYPES.forEach(type => { if (!items.some(x => x.type === type)) items.push({ id:type, type, name:SECTION_DEFAULT_NAMES[type] || type, enabled:c.sections?.[type] !== false }); });
  c.sectionItems = items;
  c.sectionOrder = items.map(x => x.type);
  return items;
}

function deepMerge(base, custom) {
  if (!custom || typeof custom !== "object") return clone(base);
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(custom)) {
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      base?.[key] && typeof base[key] === "object" && !Array.isArray(base[key])
    ) out[key] = deepMerge(base[key], value);
    else out[key] = value;
  }
  return out;
}

function isGuideText(value) {
  const s = String(value || "").trim();
  if (!s) return false;
  const patterns = [
    /activa o desactiva/i,
    /desde el panel/i,
    /panel admin/i,
    /panel de administraci[oó]n/i,
    /el contador se actualiza/i,
    /fecha configurada/i,
    /cuando est[eé]s en directo/i,
    /tu puerta principal/i,
    /todo tu ecosistema/i,
    /una p[aá]gina central/i,
    /aqu[ií] aparecer[aá]n/i,
    /novedades diarias, momentos/i,
    /describe aqu[ií]/i,
    /edita esta/i,
    /edit this/i,
    /este bloque/i,
    /configura/i,
    /preview/i,
    /solo afecta este navegador/i,
    /sincronizar pc/i,
    /configurad[oa] en el panel/i,
    /este texto/i,
    /texto de prueba/i,
    /placeholder/i,
    /ejemplo/i
  ];
  return patterns.some(rx => rx.test(s));
}

function cleanText(value) {
  const s = String(value || "").trim();
  return isGuideText(s) ? "" : s;
}

function normalizeConfig(custom) {
  const defaults = clone(window.DEFAULT_CONFIG || {});
  const incoming = custom || {};
  const hadAnnouncements = Array.isArray(incoming.announcements);
  const hadSectionItems = Array.isArray(incoming.sectionItems) && incoming.sectionItems.length > 0;
  const legacyAnnouncement = incoming.announcement && typeof incoming.announcement === "object" ? clone(incoming.announcement) : null;
  const c = deepMerge(defaults, incoming);
  if (!hadSectionItems) delete c.sectionItems;

  if (!Array.isArray(c.socials)) c.socials = [];
  if (!Array.isArray(c.featured)) c.featured = [];
  if (!Array.isArray(c.clips)) c.clips = [];
  if (!Array.isArray(c.liveStats)) c.liveStats = clone(defaults.liveStats || []);
  if (!Array.isArray(c.navLinks)) c.navLinks = clone(defaults.navLinks || []);
  if (!Array.isArray(c.customSections)) c.customSections = [];
  if (!c.culture || typeof c.culture !== "object") c.culture = clone(defaults.culture || {});
  if (!Array.isArray(c.culture.items)) c.culture.items = [];
  if (!Array.isArray(c.announcements)) c.announcements = [];
  if (!c.sponsors || typeof c.sponsors !== "object") c.sponsors = clone(defaults.sponsors || {});
  if (!Array.isArray(c.sponsors.categories)) c.sponsors.categories = clone(defaults.sponsors?.categories || []);
  if (!Array.isArray(c.sponsors.deals)) c.sponsors.deals = [];
  if (!Array.isArray(c.sponsors.vip)) c.sponsors.vip = [];
  if (!Array.isArray(c.sponsors.partners)) c.sponsors.partners = [];
  if (!hadAnnouncements && legacyAnnouncement && ["kicker","title","chip","text","cta","url","image"].some(k => legacyAnnouncement[k])) {
    c.announcements = [{ id:"notice_migrated", enabled:legacyAnnouncement.enabled !== false, kicker:legacyAnnouncement.kicker || "AVISO", title:legacyAnnouncement.title || "AVISO / NOVEDAD", chip:legacyAnnouncement.chip || "", text:legacyAnnouncement.text || "", cta:legacyAnnouncement.cta || "", url:legacyAnnouncement.url || "#", image:legacyAnnouncement.image || "" }];
  }

  c.sections = { ...(defaults.sections || {}), ...(c.sections || {}) };
  normalizeSectionItems(c);
  c.sectionHeaders = deepMerge(defaults.sectionHeaders || {}, c.sectionHeaders || {});

  c.liveDescription = cleanText(c.liveDescription);
  c.socialsDescription = cleanText(c.socialsDescription);
  c.nextStreamText = cleanText(c.nextStreamText);
  c.about = c.about || {};
  c.about.title = cleanText(c.about.title);
  c.about.text = cleanText(c.about.text);
  c.announcement = c.announcement || { enabled:true };
  c.culture.text = cleanText(c.culture.text);
  c.announcements.forEach(x => { x.text = cleanText(x.text); if (x.enabled == null) x.enabled = true; });
  c.sponsors.intro = cleanText(c.sponsors.intro);
  c.sponsors.categories.forEach((x,i) => { if (x.enabled == null) x.enabled = true; if (!x.id) x.id = `cat_${i+1}`; if (!x.name) x.name = x.tag || `Sesión ${i+1}`; if (!x.accent) x.accent = c.theme?.primary || '#ff2db7'; x.description = cleanText(x.description); });
  c.sponsors.deals.forEach(x => { x.description = cleanText(x.description); if (x.enabled == null) x.enabled = true; if (x.discountEnabled == null) x.discountEnabled = !!x.discountCode; if (!x.category) x.category = 'general'; if (!x.color && x.glow) x.color = x.glow; });
  c.sponsors.vip.forEach(x => { if (x.enabled == null) x.enabled = true; });
  c.sponsors.partners.forEach(x => { if (x.enabled == null) x.enabled = true; });
  c.featured.forEach(x => x.subtitle = cleanText(x.subtitle));
  c.clips.forEach(x => x.subtitle = cleanText(x.subtitle));
  c.customSections.forEach(x => x.text = cleanText(x.text));
  c.culture.items.forEach(x => {
    x.text = cleanText(x.text);
    if (!x.platform) x.platform = "instagram";
    if (x.platformLabel == null) x.platformLabel = "";
  });

  if (c.tertiaryCta && /nuevo lanzamiento/i.test(String(c.tertiaryCta.label || ""))) {
    c.tertiaryCta.enabled = false;
  }
  return c;
}

function safeLink(value, fallback = "#") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("#") || raw.startsWith("/")) return raw;
  try {
    const u = new URL(raw, location.href);
    return ["http:", "https:"].includes(u.protocol) ? u.href : fallback;
  } catch {
    return fallback;
  }
}

function sitePageHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "#";
  const sponsorPage = document.body?.dataset?.page === "sponsors";
  if (!sponsorPage && (raw === "#sponsors" || raw === "sponsors.html" || raw.endsWith("/sponsors.html"))) return "#sponsors";
  if (sponsorPage && raw.startsWith("#")) return raw === "#top" ? "index.html" : `index.html${raw}`;
  return raw;
}

function safeImage(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/") || raw.startsWith("blob:")) return raw;
  try {
    const u = new URL(raw, location.href);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

function safeColor(value, fallback) {
  const v = String(value || "").trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (/^rgba?\([\d\s.,%]+\)$/.test(v)) return v;
  return fallback;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = String(value);
}

function setOptionalText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = cleanText(value);
  el.textContent = text;
  el.classList.toggle("empty-copy", !text);
}

function setLink(id, obj, suffix = "↗") {
  const el = document.getElementById(id);
  if (!el || !obj) return;
  const label = String(obj.label || "").trim();
  el.replaceChildren(document.createTextNode(label));
  if (suffix) {
    const b = document.createElement("b");
    b.textContent = suffix;
    el.append(" ", b);
  }
  el.href = safeLink(obj.url);
}

function sponsorsPageUrl() { return document.body?.dataset?.page === "sponsors" ? "index.html#top" : "#sponsors"; }

function openSponsorsOverlay() {
  if (document.body?.dataset?.page === "sponsors") return;
  const sec = document.getElementById("sponsors");
  if (!sec) return;
  sec.classList.add("sponsors-open");
  sec.classList.remove("hidden-section");
  document.body.classList.add("sponsors-modal-open");
  window.setTimeout(() => setupSponsorsCarousel(sec), 60);
}

function closeSponsorsOverlay() {
  if (document.body?.dataset?.page === "sponsors") return;
  const sec = document.getElementById("sponsors");
  sec?.classList.remove("sponsors-open");
  document.body.classList.remove("sponsors-modal-open");
}

function bindSponsorCtaPage() {
  if (document.body?.dataset?.page === "sponsors") return;
  const selectors = ['#sponsorCta','[data-open-sponsors]','a[href="#sponsors"]','a[href="sponsors.html"]','a[href$="/sponsors.html"]'];
  document.querySelectorAll(selectors.join(',')).forEach(btn => {
    btn.setAttribute('href', '#sponsors');
    btn.removeAttribute('target');
    btn.removeAttribute('rel');
    btn.onclick = ev => { ev.preventDefault(); openSponsorsOverlay(); };
  });
  const back = document.getElementById('sponsorsBackBtn');
  if (back) {
    back.setAttribute('href', '#top');
    back.onclick = ev => { ev.preventDefault(); closeSponsorsOverlay(); };
  }
  const sec = document.getElementById('sponsors');
  if (sec && !sec.dataset.overlayBound) {
    sec.dataset.overlayBound = '1';
    sec.addEventListener('click', ev => { if (ev.target === sec) closeSponsorsOverlay(); });
  }
}

window.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSponsorsOverlay(); });

function setIconLink(id, labelId, obj, suffix = "↗") {
  const el = document.getElementById(id);
  if (!el || !obj) return;
  const label = el.querySelector(`#${CSS.escape(labelId)}`);
  if (label) label.textContent = String(obj.label || "").trim();
  const b = el.querySelector("b");
  if (b) b.textContent = suffix;
  el.href = safeLink(obj.url);
}

function applyTheme(c) {
  const t = c.theme || {};
  const e = c.effects || {};
  const root = document.documentElement.style;

  const vars = {
    "--bg": safeColor(t.background, "#050506"),
    "--bg-soft": safeColor(t.backgroundSoft, "#09090d"),
    "--surface": safeColor(t.surface, "#0b0b0f"),
    "--surface-2": safeColor(t.surface2, "#111118"),
    "--header-bg": safeColor(t.headerBackground, "#050506"),
    "--footer-bg": safeColor(t.footerBackground, "#030304"),
    "--brand-base": safeColor(t.brandBaseColor, "#ffffff"),
    "--brand-accent": safeColor(t.brandAccentColor, t.primary || "#ff2db7"),
    "--hero-eyebrow": safeColor(t.heroEyebrow, "#b8b0bf"),
    "--text": safeColor(t.text, "#f7f4f8"),
    "--muted": safeColor(t.muted, "#a39daa"),
    "--nav-text": safeColor(t.navText, "#b8b0bf"),
    "--nav-hover": safeColor(t.navHover, "#ffffff"),
    "--footer-text": safeColor(t.footerText, "#817988"),
    "--primary": safeColor(t.primary, "#ff2db7"),
    "--pink": safeColor(t.primary, "#ff2db7"),
    "--secondary": safeColor(t.secondary, "#7a63ff"),
    "--violet": safeColor(t.secondary, "#7a63ff"),
    "--kick": safeColor(t.kick, "#53fc18"),
    "--border-color": safeColor(t.borderColor, "#ffffff"),
    "--section-line": safeColor(t.sectionLine, t.primary || "#ff2db7"),
    "--card": safeColor(t.cardBackground, "#0b0b10"),
    "--card-text": safeColor(t.cardText, "#ffffff"),
    "--card-muted": safeColor(t.cardMuted, "#cfc9d4"),
    "--social-card-bg": safeColor(t.socialCardBackground, "#0a0a0d"),
    "--culture-card-bg": safeColor(t.cultureCardBackground, "#08080b"),
    "--notice-card-bg": safeColor(t.noticeCardBackground, "#0b0b10"),
    "--upcoming-card-bg": safeColor(t.upcomingCardBackground, "#0b0b10"),
    "--live-card-bg": safeColor(t.liveCardBackground, "#0b0b10"),
    "--button-gradient-start": safeColor(t.buttonGradientStart, t.primary || "#ff2db7"),
    "--button-gradient-end": safeColor(t.buttonGradientEnd, t.secondary || "#7a63ff"),
    "--button-text": safeColor(t.buttonText, "#09070b"),
    "--button-dark": safeColor(t.buttonDark, "#050506"),
    "--button-dark-text": safeColor(t.buttonDarkText, "#ffffff"),
    "--button-outline-text": safeColor(t.buttonOutlineText, "#ffffff"),
    "--badge-bg": safeColor(t.badgeBackground, "#160712"),
    "--badge-text": safeColor(t.badgeText, "#ff2db7"),
    "--badge-border": safeColor(t.badgeBorder, t.badgeText || "#ff2db7"),
    "--orb-left": safeColor(t.heroGlowLeft, "#ff178f"),
    "--orb-center": safeColor(t.heroGlowCenter, "#7d42ff"),
    "--orb-right": safeColor(t.heroGlowRight, "#1681ff"),
    "--beam-pink": safeColor(t.heroBeamPink, "#ff178f"),
    "--beam-blue": safeColor(t.heroBeamBlue, "#1681ff"),
    "--hero-white": safeColor(t.heroTitleWhite, "#ffffff"),
    "--hero-neon": safeColor(t.heroTitleNeon, "#ff4fc7"),
    "--hero-text": safeColor(t.heroText, "#d5ced9"),
    "--section-white": safeColor(t.sectionTitleWhite, "#ffffff"),
    "--section-neon": safeColor(t.sectionTitleNeon, t.heroTitleNeon || "#ff4fc7"),
    "--countdown-bg": safeColor(t.countdownBackground, "#101015"),
    "--countdown-number": safeColor(t.countdownNumber, "#ffffff"),
    "--countdown-label": safeColor(t.countdownLabel, "#8d8593"),
    "--floating-bg": safeColor(t.floatingButton, "#d100cf"),
    "--floating-text": safeColor(t.floatingButtonText, "#ffffff"),
    "--preview-ribbon-bg": safeColor(t.previewRibbonBackground, "#ffcf33"),
    "--preview-ribbon-text": safeColor(t.previewRibbonText, "#151000")
  };
  Object.entries(vars).forEach(([k,v]) => root.setProperty(k,v));

  const borderAlpha = Math.min(.65, Math.max(.02, Number(t.borderAlpha ?? .14)));
  root.setProperty("--line", `color-mix(in srgb, var(--border-color) ${Math.round(borderAlpha * 100)}%, transparent)`);
  root.setProperty("--radius", `${Math.min(60, Math.max(8, Number(t.radius ?? 30)))}px`);
  root.setProperty("--hero-overlay", Math.min(.95, Math.max(.04, Number(c.heroOverlay ?? .46))));

  const backgroundIntensity = Math.min(100, Math.max(0, Number(e.backgroundGlowIntensity ?? Math.round((t.glowStrength ?? .46) * 100)))) / 100;
  const heroNeonRaw = Math.max(0, Number(e.heroNeonIntensity ?? 26));
  const heroNeon = Math.min(Number(e.heroNeonMax ?? 230) || 230, heroNeonRaw) / 100;
  const heroWhiteGlow = Math.min(230, Math.max(0, Number(e.heroWhiteGlowIntensity ?? 18))) / 100;
  const sectionNeon = Math.min(230, Math.max(0, Number(e.sectionNeonIntensity ?? 24))) / 100;

  root.setProperty("--glow-strength", backgroundIntensity.toFixed(3));
  root.setProperty("--hero-neon-alpha", heroNeon.toFixed(3));
  root.setProperty("--section-neon-alpha", sectionNeon.toFixed(3));

  /* Nuevo rango extendido: de sutil a muy fuerte, incluyendo el look lavado del ejemplo móvil. */
  const heroBoost = Math.max(0, heroNeon - 1);
  const h1 = Math.round(2 + heroNeon * 6);
  const h2 = Math.round(8 + heroNeon * 18);
  const h3 = Math.round(18 + heroNeon * 34);
  const h4 = Math.round(34 + heroNeon * 60 + heroBoost * 40);
  const h5 = Math.round(48 + heroNeon * 94 + heroBoost * 76);
  const hp1 = Math.min(96, Math.round(18 + heroNeon * 30));
  const hp2 = Math.min(88, Math.round(12 + heroNeon * 24));
  const hp3 = Math.min(78, Math.round(7 + heroNeon * 18));
  const hp4 = Math.min(64, Math.round(4 + heroNeon * 12));
  const hp5 = Math.min(50, Math.round(2 + heroNeon * 8));
  root.setProperty("--hero-neon-shadow", heroNeon <= .005 ? "none" : `0 0 ${Math.min(h1,12)}px color-mix(in srgb,var(--hero-neon) ${hp1}%,transparent),0 0 ${Math.min(h2,34)}px color-mix(in srgb,var(--hero-neon) ${hp2}%,transparent)`);
  root.setProperty("--hero-halo-blur", `${Math.round(Math.min(68,6+heroNeon*28))}px`);
  root.setProperty("--hero-halo-opacity", Math.min(1,heroNeon*.55).toFixed(3));
  root.setProperty("--hero-fog-blur", `${Math.round(Math.min(120,18+heroNeon*46))}px`);
  root.setProperty("--hero-fog-opacity", Math.min(.82,Math.max(0,heroNeon-.35)*.48).toFixed(3));

  const w1 = Math.round(2 + heroWhiteGlow * 4);
  const w2 = Math.round(8 + heroWhiteGlow * 13);
  const w3 = Math.round(18 + heroWhiteGlow * 24);
  root.setProperty("--hero-white-shadow", heroWhiteGlow <= .005 ? "none" : `0 0 ${w1}px color-mix(in srgb,var(--hero-white) ${Math.round(18+heroWhiteGlow*38)}%,transparent),0 0 ${w2}px color-mix(in srgb,var(--hero-white) ${Math.round(8+heroWhiteGlow*20)}%,transparent),0 0 ${w3}px color-mix(in srgb,var(--hero-white) ${Math.round(3+heroWhiteGlow*10)}%,transparent)`);

  const s1 = Math.round(2 + sectionNeon * 5);
  const s2 = Math.round(8 + sectionNeon * 14);
  const s3 = Math.round(18 + sectionNeon * 24);
  const s4 = Math.round(34 + sectionNeon * 34);
  const s5 = Math.round(50 + sectionNeon * 48);
  const secP1 = Math.min(98, Math.round(25 + sectionNeon * 31));
  const secP2 = Math.min(90, Math.round(14 + sectionNeon * 25));
  const secP3 = Math.min(80, Math.round(8 + sectionNeon * 20));
  const secP4 = Math.min(66, Math.round(4 + sectionNeon * 14));
  root.setProperty("--section-neon-shadow", sectionNeon <= .005 ? "none" : `0 0 ${s1}px color-mix(in srgb,var(--section-neon) ${secP1}%,transparent),0 0 ${s2}px color-mix(in srgb,var(--section-neon) ${secP2}%,transparent),0 0 ${s3}px color-mix(in srgb,var(--section-neon) ${secP3}%,transparent),0 0 ${s4}px color-mix(in srgb,var(--section-neon) ${secP4}%,transparent),0 0 ${s5}px color-mix(in srgb,var(--section-neon) ${Math.min(46,Math.round(sectionNeon*15))}%,transparent)`);
  root.setProperty("--section-white-shadow", sectionNeon <= .005 ? "none" : `0 0 ${Math.max(2,Math.round(s1*.7))}px rgba(255,255,255,${Math.min(.95,.26+sectionNeon*.26).toFixed(2)}),0 0 ${Math.max(7,Math.round(s2*.75))}px rgba(255,255,255,${Math.min(.72,.12+sectionNeon*.18).toFixed(2)}),0 0 ${Math.max(16,Math.round(s3*.85))}px color-mix(in srgb,var(--section-neon) ${Math.min(44,Math.round(10+sectionNeon*13))}%,transparent)`);
  root.setProperty("--section-glow-filter", sectionNeon <= .005 ? "none" : `drop-shadow(0 0 ${Math.min(26,Math.round(5+sectionNeon*8))}px color-mix(in srgb,var(--section-neon) ${Math.min(55,Math.round(14+sectionNeon*15))}%,transparent))`);

  const subtitleNeon = Math.max(0, Math.min(2.3, Number(e.subtitleNeonIntensity ?? 16) / 100));
  const sub1 = Math.round(2 + subtitleNeon * 7);
  const sub2 = Math.round(10 + subtitleNeon * 20);
  const sub3 = Math.round(18 + subtitleNeon * 30);
  root.setProperty("--subtitle-neon-shadow", subtitleNeon <= .005 ? "none" : `0 0 ${sub1}px color-mix(in srgb,var(--primary) ${Math.round(18 + subtitleNeon * 30)}%,transparent),0 0 ${sub2}px color-mix(in srgb,var(--primary) ${Math.round(10 + subtitleNeon * 22)}%,transparent),0 0 ${sub3}px color-mix(in srgb,var(--secondary) ${Math.round(7 + subtitleNeon * 18)}%,transparent)`);
  const subtitleBrightness = Math.max(0, Math.min(2.3, Number(e.subtitleTextBrightness ?? 100) / 100));
  root.setProperty("--subtitle-text-brightness", subtitleBrightness.toFixed(2));

  document.body.classList.toggle("reduce-motion", !!e.reduceMotion);
}

function renderParticles(c) {
  const wrap = document.getElementById("particles");
  wrap.innerHTML = "";
  if (!c.effects?.particles) return;
  const previewMode = new URLSearchParams(location.search).get("preview") === "1";
  const mobile = matchMedia("(max-width: 700px)").matches;
  const count = previewMode ? (mobile ? 4 : 8) : (mobile ? 8 : 18);
  const frag=document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "particle";
    s.style.left = `${(i * 37) % 101}%`;
    s.style.top = `${(i * 61) % 97}%`;
    s.style.setProperty("--dur", `${8 + (i % 7)}s`);
    s.style.setProperty("--dx", `${(i % 2 ? 1 : -1) * (8 + i % 18)}px`);
    s.style.setProperty("--dy", `${-(18 + i % 34)}px`);
    frag.appendChild(s);
  }
  wrap.appendChild(frag);
}

function renderTicker(c) {
  const section = document.getElementById("tickerSection");
  section.classList.toggle("hidden", c.effects?.ticker === false);
  const track = document.getElementById("tickerTrack");
  track.innerHTML = "";
  const text = `${c.tickerText || ""} `.repeat(6);
  for (let i = 0; i < 2; i++) {
    const span = document.createElement("span");
    span.textContent = text;
    if (i) span.setAttribute("aria-hidden", "true");
    track.appendChild(span);
  }
}

function renderNav(c) {
  const nav = document.getElementById("desktopNav");
  if (!nav) return;
  nav.innerHTML = "";
  (c.navLinks || []).filter(x => x.enabled !== false).forEach(item => {
    const a = document.createElement("a");
    a.href = safeLink(sitePageHref(item.target));
    a.textContent = item.label || "ENLACE";
    nav.appendChild(a);
  });
  bindSponsorCtaPage();
}

let lazyBgObserver = null;
function setBackgroundImage(el, value, critical = false) {
  if (!el) return;
  const safe = safeImage(value);
  el.classList.toggle('is-png-media', isPngLike(safe));
  if (!safe) { el.style.backgroundImage = ""; delete el.dataset.lazyBg; return; }
  const css = `url("${safe.replaceAll('"','%22')}")`;
  if (critical || !("IntersectionObserver" in window)) { el.style.backgroundImage = css; return; }
  if (!lazyBgObserver) lazyBgObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      if (node.dataset.lazyBg) node.style.backgroundImage = node.dataset.lazyBg;
      delete node.dataset.lazyBg;
      lazyBgObserver.unobserve(node);
    });
  }, { rootMargin:"700px 0px" });
  el.dataset.lazyBg = css;
  lazyBgObserver.observe(el);
}

function renderSocials(c) {
  const grid = document.getElementById("socialGrid");
  const footer = document.getElementById("footerLinks");
  grid.innerHTML = "";
  footer.innerHTML = "";

  (c.socials || []).filter(s => s.enabled !== false).forEach(s => {
    const card = document.createElement("a");
    card.className = "social-card reveal";
    card.href = safeLink(s.url);
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.style.setProperty("--social-color", safeColor(s.color, "#ff2db7"));
    const socialImage = safeImage(s.image);
    if (socialImage) {
      card.classList.add("has-image");
      const media = document.createElement("div");
      media.className = "social-card-media";
      setBackgroundImage(media, socialImage);
      card.appendChild(media);
    }

    const head = document.createElement("div");
    head.className = "social-card-head";
    const icon = document.createElement("div");
    icon.className = "social-icon";
    icon.textContent = s.icon || "+";
    head.appendChild(icon);

    const copy = document.createElement("div");
    copy.className = "social-copy";
    const h3 = document.createElement("h3");
    h3.textContent = s.label || "Red";
    const p = document.createElement("p");
    p.textContent = s.handle || "";
    copy.append(h3,p);

    const go = document.createElement("span");
    go.className = "circle-btn social-arrow text-badge";
    go.innerHTML = '<span class="go-text">IR</span>';

    card.append(head,copy,go);
    grid.appendChild(card);

    const link = document.createElement("a");
    link.href = safeLink(s.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = s.label || "SOCIAL";
    footer.appendChild(link);
  });
}

function isPngLike(url) {
  const raw = String(url || '').toLowerCase();
  return !!raw && (/\.png(?:[?#].*)?$/i.test(raw) || /^data:image\/png/i.test(raw) || raw.includes('#png') || raw.includes('transparent=1') || raw.includes('png=true'));
}
function makeBackground(url, className = "media-bg") {
  const div = document.createElement("div");
  div.className = className;
  if (isPngLike(url)) div.classList.add('is-png-media');
  setBackgroundImage(div, url);
  return div;
}

const CULTURE_PLATFORMS = {
  instagram:{label:"Instagram",color:"#ff3d9a",icon:"instagram"},
  tiktok:{label:"TikTok",color:"#20f2ea",icon:"tiktok"},
  kick:{label:"Kick",color:"#53fc18",icon:"kick"},
  youtube:{label:"YouTube",color:"#ff3347",icon:"youtube"},
  x:{label:"X",color:"#ffffff",icon:"x"},
  discord:{label:"Discord",color:"#7585ff",icon:"discord"},
  twitch:{label:"Twitch",color:"#9b6cff",icon:"twitch"},
  custom:{label:"Red",color:"#ff4fc7",icon:"custom"}
};
function culturePlatformMeta(item){
  const key=String(item?.platform||"instagram").toLowerCase();
  const base=CULTURE_PLATFORMS[key]||CULTURE_PLATFORMS.custom;
  return {key,label:String(item?.platformLabel||base.label),color:base.color,icon:base.icon};
}
function culturePlatformIcon(meta,item){
  const box=document.createElement("span"); box.className="culture-network-icon"; box.setAttribute("aria-hidden","true");
  const custom=String(item?.badge||"").trim();
  const icon=meta.icon;
  if(icon==="instagram") box.innerHTML='<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"></rect><circle cx="12" cy="12" r="3.8"></circle><circle cx="17.3" cy="6.8" r=".9" class="fill"></circle></svg>';
  else if(icon==="youtube") box.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"></rect><path d="M10 9.2 15 12l-5 2.8Z" class="fill"></path></svg>';
  else if(icon==="tiktok") box.innerHTML='<svg viewBox="0 0 24 24"><path d="M14.2 4v10.1a4.2 4.2 0 1 1-3.2-4.08v2.55a1.85 1.85 0 1 0 .85 1.55V4h2.35Zm0 0c.5 2.25 2.05 3.66 4.3 3.85v2.42c-1.8-.08-3.24-.7-4.3-1.66Z" class="fill"></path></svg>';
  else if(icon==="discord") box.innerHTML='<svg viewBox="0 0 24 24"><path d="M7.4 7.2c2.9-1.3 6.3-1.3 9.2 0 1.2 1.8 2 4.1 2.1 6.7-1.4 1.4-2.9 2.2-4.5 2.6l-.8-1.1c.8-.2 1.5-.5 2.2-.9-2.2 1-5 1-7.2 0 .7.4 1.4.7 2.2.9l-.8 1.1c-1.6-.4-3.1-1.2-4.5-2.6.1-2.6.9-4.9 2.1-6.7Zm2.5 6.4c.7 0 1.2-.6 1.2-1.4s-.5-1.4-1.2-1.4-1.2.6-1.2 1.4.5 1.4 1.2 1.4Zm4.2 0c.7 0 1.2-.6 1.2-1.4s-.5-1.4-1.2-1.4-1.2.6-1.2 1.4.5 1.4 1.2 1.4Z" class="fill"></path></svg>';
  else if(icon==="kick") box.textContent="K";
  else if(icon==="x") box.textContent="X";
  else if(icon==="twitch") box.textContent="T";
  else box.textContent=custom||"+";
  return box;
}

function renderCulture(c) {
  const sec = document.getElementById("culture");
  const cfg = c.culture || {};
  if (!sec) return;
  sec.classList.toggle("hidden-section", c.sections?.culture === false || cfg.enabled === false);

  setText("cultureTag", cfg.kicker || c.sectionHeaders?.culture?.tag || "03 / INSTAGRAM");
  setText("cultureTitle1", cfg.title1 || c.sectionHeaders?.culture?.title1 || "SIGUE LA");
  setText("cultureTitle2", cfg.title2 || c.sectionHeaders?.culture?.title2 || "CULTURA.");
  setOptionalText("cultureDescription", cfg.text);
  setLink("cultureMainCta", { label: cfg.ctaLabel || "@TUINSTAGRAM · SEGUIR", url: cfg.ctaUrl }, "IR");

  const gallery = document.getElementById("cultureGallery");
  gallery.innerHTML = "";
  (cfg.items || []).filter(x => x.enabled !== false).forEach(item => {
    const meta=culturePlatformMeta(item);
    const a = document.createElement("a");
    a.className = "culture-card reveal";
    a.href = safeLink(item.url || cfg.ctaUrl);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.setProperty("--culture-accent",meta.color);
    a.appendChild(makeBackground(item.image, "culture-media"));

    const top = document.createElement("div");
    top.className = "culture-card-top";
    top.appendChild(culturePlatformIcon(meta,item));

    const bottom = document.createElement("div");
    bottom.className = "culture-card-bottom";
    const left = document.createElement("div");
    left.className="culture-card-copy";
    const h = document.createElement("h3");
    h.textContent = item.title || "POST";
    left.appendChild(h);
    const network=document.createElement("span");
    network.className="culture-platform-label";
    network.textContent=meta.label;
    left.appendChild(network);
    const text = cleanText(item.text);
    if (text) {
      const p = document.createElement("p");
      p.textContent = text;
      left.appendChild(p);
    }
    const go = document.createElement("span");
    go.className = "circle-btn text-badge culture-go";
    go.innerHTML = '<span class="go-text">IR</span>';
    bottom.append(left,go);
    a.append(top,bottom);
    gallery.appendChild(a);
  });
}

function renderFeatured(c) {
  const track = document.getElementById("featuredTrack");
  track.innerHTML = "";
  (c.featured || []).filter(x => x.enabled !== false).forEach((item, i) => {
    const a = document.createElement("a");
    a.className = "feature-card";
    a.href = safeLink(item.url);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.setProperty("--card-glow", safeColor(item.glow || c.theme?.primary, "#ff2db7"));
    a.dataset.index = String(i);
    a.appendChild(makeBackground(item.image));

    const index = document.createElement("span");
    index.className = "feature-index";
    index.textContent = item.kicker || `0${i+1}`;
    a.appendChild(index);

    const badgeImage = safeImage(item.badgeImage);
    if (badgeImage) {
      const img = document.createElement("img");
      img.className = "feature-badge-image";
      img.src = badgeImage;
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = "";
      a.appendChild(img);
    }

    const h = document.createElement("h3");
    h.textContent = item.title || "DESTACADO";
    a.appendChild(h);

    const subtitle = cleanText(item.subtitle);
    if (subtitle) {
      const p = document.createElement("p");
      p.textContent = subtitle;
      a.appendChild(p);
    }

    const go = document.createElement("span");
    go.className = "circle-btn arrow-only text-badge";
    go.innerHTML = '<span class="go-text">IR</span>';
    a.appendChild(go);
    track.appendChild(a);
  });
}

function renderClips(c) {
  const grid = document.getElementById("clipsGrid");
  grid.innerHTML = "";
  (c.clips || []).filter(x => x.enabled !== false).forEach(item => {
    const a = document.createElement("a");
    a.className = "clip-card reveal";
    a.href = safeLink(item.url);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.appendChild(makeBackground(item.image));

    const play = document.createElement("div");
    play.className = "play";
    play.innerHTML = '<span class="play-triangle"></span>';

    const copy = document.createElement("div");
    copy.className = "clip-copy";
    const h = document.createElement("h3");
    h.textContent = item.title || "CLIP";
    copy.appendChild(h);
    const subtitle = cleanText(item.subtitle);
    if (subtitle) {
      const p = document.createElement("p");
      p.textContent = subtitle;
      copy.appendChild(p);
    }

    const go = document.createElement("span");
    go.className = "circle-btn clip-go text-badge";
    go.innerHTML = '<span class="go-text">IR</span>';
    a.append(play,copy,go);
    grid.appendChild(a);
  });
}


function sponsorLogoNode(item, cls='sponsor-logo') {
  const logo = safeImage(item.logo || item.image || '');
  const box = document.createElement('div');
  box.className = cls;
  const isPng = isPngLike(logo);
  box.classList.add(isPng ? 'is-png-logo' : 'is-photo-logo');
  if (logo) {
    box.classList.add('has-image');
    const img = document.createElement('img');
    img.src = logo; img.loading = 'lazy'; img.decoding = 'async'; img.alt = item.name || 'Patrocinador';
    box.appendChild(img);
  } else {
    box.textContent = String(item.name || 'LOGO').slice(0, 10);
  }
  return box;
}
function sponsorDealCard(item, i) {
  const a = document.createElement('a');
  a.className = 'sponsor-deal-card reveal';
  a.href = safeLink(item.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.style.setProperty('--sponsor-accent', safeColor(item.color || item.glow || '#ff2db7', '#ff2db7'));
  const bg = safeImage(item.image);
  if (bg) a.appendChild(makeBackground(bg, 'sponsor-card-bg'));
  const top = document.createElement('div'); top.className = 'sponsor-card-top';
  top.appendChild(sponsorLogoNode(item));
  const chips = document.createElement('div'); chips.className = 'sponsor-chips';
  [item.tag || 'CANJE', item.tier || 'ALIADO'].filter(Boolean).slice(0,2).forEach(t => { const s=document.createElement('span'); s.textContent=t; chips.appendChild(s); });
  top.appendChild(chips);
  const body = document.createElement('div'); body.className = 'sponsor-card-body';
  const name = document.createElement('p'); name.className='sponsor-name'; name.textContent=item.name || `ALIADO ${i+1}`;
  const title = document.createElement('h3'); title.textContent=item.title || item.name || 'CANJE ACTIVO';
  body.append(name,title);
  const desc = cleanText(item.description); if(desc){ const p=document.createElement('p'); p.textContent=desc; body.appendChild(p); }
  if(item.discountEnabled !== false && cleanText(item.discountCode)){
    const code=document.createElement('div'); code.className='sponsor-code';
    code.innerHTML=`<span>${escapeHtml(item.discountLabel || 'CÓDIGO')}</span><b>${escapeHtml(item.discountCode)}</b>`;
    body.appendChild(code);
  }
  const go=document.createElement('span'); go.className='circle-btn sponsor-go text-badge'; go.innerHTML='<span class="go-text">IR</span>';
  a.append(top, body, go);
  return a;
}
function renderHomeSponsorStrip(c) {
  const strip = document.getElementById('homeSponsorStrip');
  const logos = document.getElementById('homeSponsorLogos');
  if (!strip || !logos) return;
  logos.innerHTML = '';
  const s = c.sponsors || {};
  const items = [...(s.vip || []), ...(s.partners || [])].filter(x => x && x.enabled !== false).slice(0, 18);
  strip.classList.toggle('hidden-section', s.enabled === false || !items.length);
  const auto = items.length > 1 && s.homeAuto !== false;
  logos.classList.toggle('is-auto', auto);
  logos.style.setProperty('--home-sponsor-speed', `${Math.max(26, Number(s.homeSpeed || 28))}s`);
  // Marquee sin huecos: grupo largo duplicado exactamente.
  const groupLen = auto ? Math.max(18, items.length) : items.length;
  const baseGroup = Array.from({length: groupLen}, (_, i) => items[i % items.length]);
  const displayItems = auto ? [...baseGroup, ...baseGroup] : baseGroup;
  displayItems.forEach((item, i) => {
    const a = document.createElement('a');
    a.className = 'home-sponsor-logo';
    a.href = safeLink(item.url);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = item.name || 'Patrocinador';
    if (auto && i >= baseGroup.length) a.setAttribute('aria-hidden','true');
    a.appendChild(sponsorLogoNode(item, 'home-sponsor-logo-box'));
    logos.appendChild(a);
  });
}

function renderSponsors(c) {
  const root = document.getElementById('sponsors');
  if (root) renderSponsorsInto(root, c);
  renderHomeSponsorStrip(c);
  bindSponsorCtaPage();
}

function renderCustomSections(c) {
  const container = document.getElementById("customSections");
  container.innerHTML = "";
  const active = (c.customSections || []).filter(s => s.enabled !== false);
  document.getElementById("customSectionContainer")?.classList.toggle("hidden-section", !active.length || c.sections?.custom === false);
  const shell=document.createElement('div');
  shell.className='custom-carousel-shell';
  shell.innerHTML='<button class="rail-arrow rail-arrow-left custom-arrow" type="button" aria-label="Extra anterior">←</button><div class="custom-track"></div><button class="rail-arrow rail-arrow-right custom-arrow" type="button" aria-label="Extra siguiente">→</button>';
  const track=shell.querySelector('.custom-track');
  active.forEach((item, i) => {
    const wrap = document.createElement("section");
    wrap.className = "custom-block custom-card reveal";
    wrap.id = item.anchorId || `custom-${i+1}`;

    const inner = document.createElement("div");
    inner.className = `custom-inner ${item.image ? "with-image" : ""}`;
    if (item.image && isPngLike(item.image)) inner.classList.add('png-custom');
    const copy = document.createElement("div");
    copy.className = "custom-copy";
    copy.innerHTML = `<div class="section-badge"><span>${escapeHtml(item.kicker || "NUEVA SECCIÓN")}</span></div><h2 class="display-title section-display"><span class="white">${escapeHtml(item.title1 || "NUEVO")}</span><span>${escapeHtml(item.title2 || "BLOQUE.")}</span></h2>`;

    const text = cleanText(item.text);
    if (text) {
      const p = document.createElement("p");
      p.className = "section-copy";
      p.textContent = text;
      copy.appendChild(p);
    }
    if (item.ctaEnabled !== false && item.ctaLabel) {
      const a = document.createElement("a");
      a.className = "btn btn-outline";
      a.href = safeLink(item.ctaUrl);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `${escapeHtml(item.ctaLabel)} <b>IR</b>`;
      copy.appendChild(a);
    }
    inner.appendChild(copy);
    if (item.image) {
      const media = document.createElement("div");
      media.className = "custom-media";
      media.appendChild(makeBackground(item.image, "custom-image"));
      inner.appendChild(media);
    }
    wrap.appendChild(inner);
    track.appendChild(wrap);
  });
  container.appendChild(shell);
}

function renderAnnouncements(c) {
  const track = document.getElementById("noticesTrack");
  if (!track) return;
  track.innerHTML = "";
  const items = (c.announcements || []).filter(x => x && x.enabled !== false).slice(0, 12);
  items.forEach((notice, index) => {
    const card = document.createElement("article");
    card.className = "notice-card notice-carousel-card reveal";
    card.dataset.noticeId = notice.id || String(index);

    const image = safeImage(notice.image);
    if (image) {
      const media = document.createElement("div");
      media.className = "notice-media";
      const img = document.createElement("img");
      img.src = image;
      img.alt = notice.title || "Aviso";
      img.loading = "lazy";
      img.decoding = "async";
      media.appendChild(img);
      card.appendChild(media);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "notice-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = 'Ver foto completa <span>⌄</span>';
      toggle.onclick = () => {
        const expanded = card.classList.toggle("expanded");
        toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        toggle.innerHTML = expanded ? 'Ocultar foto <span>⌃</span>' : 'Ver foto completa <span>⌄</span>';
      };
      card.appendChild(toggle);
    }

    const content = document.createElement("div");
    content.className = "notice-content";
    const kicker = cleanText(notice.kicker || "AVISO");
    if (kicker) {
      const el = document.createElement("div");
      el.className = "notice-kicker";
      el.textContent = kicker;
      content.appendChild(el);
    }
    const h3 = document.createElement("h3");
    h3.textContent = notice.title || "AVISO / NOVEDAD";
    content.appendChild(h3);
    const chip = cleanText(notice.chip);
    if (chip) {
      const place = document.createElement("div");
      place.className = "notice-place";
      place.textContent = chip;
      content.appendChild(place);
    }
    const copy = cleanText(notice.text);
    if (copy) {
      const text = document.createElement("p");
      text.textContent = copy;
      content.appendChild(text);
    }
    const cta = cleanText(notice.cta);
    const url = String(notice.url || "").trim();
    if (cta && url && url !== "#") {
      const a = document.createElement("a");
      a.className = "notice-button";
      a.href = safeLink(url);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = cta;
      content.appendChild(a);
    }
    card.appendChild(content);
    track.appendChild(card);
  });
  document.getElementById("announcements")?.classList.toggle("no-notices", !items.length);
}

function rewriteCloneIds(root, suffix) {
  if (root.id) root.id = `${root.id}--${suffix}`;
  root.querySelectorAll('[id]').forEach(el => { el.id = `${el.id}--${suffix}`; });
  root.querySelectorAll('[for]').forEach(el => { const v=el.getAttribute('for'); if(v)el.setAttribute('for',`${v}--${suffix}`); });
}
function sectionInstanceVisible(c, item) {
  if (item.enabled === false) return false;
  const isClone = item && item.id !== item.type;
  if (item.type === 'culture' && !isClone && c.culture?.enabled === false) return false;
  if (item.type === 'announcements') {
    const list = isClone ? (Array.isArray(item.data?.announcements) ? item.data.announcements : []) : (Array.isArray(c.announcements) ? c.announcements : []);
    const ann = isClone ? (item.data?.announcement || {}) : (c.announcement || {});
    const hasNotices = list.some(x => x && x.enabled !== false);
    if (ann.enabled === false || !hasNotices) return false;
  }
  if (item.type === 'sponsors') {
    const src = isClone ? (item.data?.sponsors || {}) : (c.sponsors || {});
    const hasAny = (src.deals || []).some(x => x && x.enabled !== false) || (src.vip || []).some(x => x && x.enabled !== false) || (src.partners || []).some(x => x && x.enabled !== false);
    if (src.enabled === false || !hasAny) return false;
  }
  if (item.type === 'custom') {
    const list = isClone ? (Array.isArray(item.data?.customSections) ? item.data.customSections : []) : (Array.isArray(c.customSections) ? c.customSections : []);
    const hasCustom = list.some(x => x && x.enabled !== false);
    if (!hasCustom) return false;
  }
  return true;
}
function applySections(c) {
  const container = document.getElementById("dynamicSections");
  if (!container) return;
  const items = normalizeSectionItems(c);
  if (!container.__sectionTemplates) {
    container.__sectionTemplates = {};
    SECTION_TYPES.forEach(type => {
      const base = container.querySelector(`:scope > [data-section="${type}"]`);
      if (base) container.__sectionTemplates[type] = base.cloneNode(true);
    });
  }
  container.innerHTML = "";
  items.forEach(item => {
    const template = container.__sectionTemplates[item.type];
    if (!template) return;
    const el = template.cloneNode(true);
    if (item.id !== item.type) {
      el.dataset.sectionDuplicate = '1';
      rewriteCloneIds(el, item.id);
    } else {
      delete el.dataset.sectionDuplicate;
    }
    el.dataset.sectionInstance = item.id;
    el.dataset.sectionName = item.name || '';
    el.classList.toggle('hidden-section', !sectionInstanceVisible(c,item));
    container.appendChild(el);
    hydrateSectionInstance(el,c,item);
  });
}

function setSectionHeader(prefix, obj = {}) {
  setText(`${prefix}Tag`, obj.tag || "");
  setText(`${prefix}Title1`, obj.title1 || "");
  setText(`${prefix}Title2`, obj.title2 || "");
}

function scopedEl(root, id) {
  try { return root.querySelector(`#${CSS.escape(id)}, [id^="${CSS.escape(id)}--"]`); } catch { return root.querySelector(`[id^="${id}"]`); }
}
function setScopedText(root, idPrefix, value) {
  const el = scopedEl(root, idPrefix);
  if (el) el.textContent = value ?? "";
}
function setSponsorPanelTitle(root, idPrefix, value, fallback = '') {
  const el = scopedEl(root, idPrefix);
  if (!el) return;
  el.classList.add('panel-title-stack','panel-title-unified');
  const text = String(value || fallback || '').trim();
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    el.innerHTML = `<span class="title-main"><span class="title-white">${escapeHtml(text || fallback || '')}</span></span>`;
    return;
  }
  const first = parts.shift() || '';
  const second = parts.join(' ');
  el.innerHTML = `<span class="title-main"><span class="title-white">${escapeHtml(first)}</span>${second ? `<span class="title-neon">${escapeHtml(second)}</span>` : ''}</span>`;
}
function setSponsorStackTitle(root, idPrefix, kicker = '', main = '', accent = '') {
  const el = scopedEl(root, idPrefix);
  if (!el) return;
  const kick = String(kicker || '').trim();
  const base = String(main || '').trim();
  const accentText = String(accent || '').trim();
  const mainHtml = [
    base ? `<span class="title-white">${escapeHtml(base)}</span>` : '',
    accentText ? `<span class="title-neon">${escapeHtml(accentText)}</span>` : ''
  ].filter(Boolean).join(' ');
  el.classList.add('panel-title-stack');
  el.innerHTML = `${kick ? `<span class="title-kicker">${escapeHtml(kick)}</span>` : ''}<span class="title-main">${mainHtml || `<span class="title-white">&nbsp;</span>`}</span>`;
}
function setScopedOptionalText(root, idPrefix, value) {
  const el = scopedEl(root, idPrefix);
  if (el) {
    const txt = cleanText(value);
    el.textContent = txt;
    el.classList.toggle("hidden", !txt);
  }
}
function getSectionStyle(item = {}) {
  const st = item.style || {};
  const white = safeColor(st.titleWhite || "", getComputedStyle(document.documentElement).getPropertyValue('--section-white').trim() || "#ffffff");
  const neon = safeColor(st.titleNeon || "", getComputedStyle(document.documentElement).getPropertyValue('--section-neon').trim() || "#ff4fc7");
  const border = safeColor(st.cardBorder || st.titleNeon || "", neon);
  const bg = safeColor(st.bgGlow || st.titleNeon || "", neon);
  const glow = Math.max(0, Math.min(100, Number(st.cardGlow ?? 65))) / 100;
  const bgGlow = Math.max(0, Math.min(100, Number(st.bgGlowStrength ?? 55))) / 100;
  const whiteGlow = Math.max(0, Math.min(100, Number(st.titleWhiteGlow ?? 34))) / 100;
  const neonGlow = Math.max(0, Math.min(100, Number(st.titleNeonGlow ?? 76))) / 100;
  const brightness = Math.max(.7, Math.min(1.6, Number(st.titleBrightness ?? 100) / 100));
  return { white, neon, border, bg, glow, bgGlow, whiteGlow, neonGlow, brightness };
}
function applySectionStyle(root,item){
  root.style.removeProperty('--section-title-white');
  root.style.removeProperty('--section-title-neon');
  root.style.removeProperty('--section-card-border');
  root.style.removeProperty('--section-card-glow-strength');
  root.style.removeProperty('--section-bg-glow');
  root.style.removeProperty('--section-bg-glow-strength');
  root.style.removeProperty('--section-title-white-glow');
  root.style.removeProperty('--section-title-neon-glow');
  root.style.removeProperty('--section-title-brightness');
  root.style.removeProperty('--section-title-white-glow-px');
  root.style.removeProperty('--section-title-neon-glow-px');
  root.style.removeProperty('--section-title-white-glow-px2');
  root.style.removeProperty('--section-title-neon-glow-px2');
  root.style.removeProperty('--section-card-glow-px');
  if(item?.type!=='featured') return;
  const st=getSectionStyle(item);
  root.style.setProperty('--section-title-white',st.white);
  root.style.setProperty('--section-title-neon',st.neon);
  root.style.setProperty('--section-card-border',st.border);
  root.style.setProperty('--section-card-glow-strength',st.glow.toFixed(2));
  root.style.setProperty('--section-bg-glow',st.bg);
  root.style.setProperty('--section-bg-glow-strength',st.bgGlow.toFixed(2));
  root.style.setProperty('--section-title-white-glow',st.whiteGlow.toFixed(2));
  root.style.setProperty('--section-title-neon-glow',st.neonGlow.toFixed(2));
  root.style.setProperty('--section-title-brightness',st.brightness.toFixed(2));
  root.style.setProperty('--section-title-white-glow-px',`${Math.round(2+30*st.whiteGlow)}px`);
  root.style.setProperty('--section-title-white-glow-px2',`${Math.round(8+58*st.whiteGlow)}px`);
  root.style.setProperty('--section-title-neon-glow-px',`${Math.round(6+62*st.neonGlow)}px`);
  root.style.setProperty('--section-title-neon-glow-px2',`${Math.round(18+105*st.neonGlow)}px`);
  root.style.setProperty('--section-card-glow-px',`${Math.round(10+68*st.glow)}px`);
}
function mergedConfigForItem(c,item){
  const isClone = item && item.id !== item.type;
  if(!item?.data) return {...c,__sectionClone:false,__sectionInstanceId:item?.id||''};
  const d=item.data || {};
  const out={...c,...d,sectionHeaders:{...(c.sectionHeaders||{}),...(d.sectionHeaders||{})},__sectionClone:isClone,__sectionInstanceId:item.id||''};
  if(isClone){
    if(item.type==='announcements'){
      out.announcements = Array.isArray(d.announcements) ? d.announcements : [];
      out.announcement = d.announcement && typeof d.announcement === 'object' ? d.announcement : {enabled:true};
    }
    if(item.type==='featured') out.featured = Array.isArray(d.featured) ? d.featured : [];
    if(item.type==='clips') out.clips = Array.isArray(d.clips) ? d.clips : [];
    if(item.type==='socials') out.socials = Array.isArray(d.socials) ? d.socials : [];
    if(item.type==='custom') out.customSections = Array.isArray(d.customSections) ? d.customSections : [];
    if(item.type==='sponsors') out.sponsors = d.sponsors && typeof d.sponsors === 'object' ? d.sponsors : {deals:[],vip:[],partners:[]};
    if(item.type==='culture') out.culture = d.culture && typeof d.culture === 'object' ? d.culture : {items:[]};
  }
  return out;
}

function renderLiveInto(root,cfg){
  const h=cfg.sectionHeaders?.live||{};setScopedText(root,'liveTag',h.tag||'');setScopedText(root,'liveTitle1',h.title1||'');setScopedText(root,'liveTitle2',h.title2||'');setScopedOptionalText(root,'liveDescription',cfg.liveDescription);
  const kick=(cfg.socials||[]).find(s=>s.id==='kick')||{};const liveKick=scopedEl(root,'liveKickBtn');if(liveKick)liveKick.href=safeLink(kick.url);
  const handle=scopedEl(root,'kickHandle');if(handle)handle.textContent=`@${String(cfg.kickHandle||kick.handle||'yourkick').replace(/^@/,'')}`;
  const badge=scopedEl(root,'liveBadge');const badgeText=badge?.querySelector('span');if(badgeText)badgeText.textContent=cfg.isLive?'LIVE':'OFFLINE';else if(badge)badge.textContent=cfg.isLive?'LIVE':'OFFLINE';badge?.classList.toggle('offline',!cfg.isLive);
  const card=scopedEl(root,'liveCard');card?.classList.toggle('live-pulse',!!cfg.isLive);
  const photo=scopedEl(root,'livePhoto');const url=safeImage(cfg.liveImage);if(photo){setBackgroundImage(photo,url);photo.classList.toggle('hidden',!url)}
  (cfg.liveStats||[]).slice(0,3).forEach((s,i)=>{setScopedText(root,`stat${i+1}Value`,s.value);setScopedText(root,`stat${i+1}Label`,s.label)});
}
function renderSocialsInto(root,cfg){
  const h=cfg.sectionHeaders?.socials||{};setScopedText(root,'socialsTag',h.tag||'');setScopedText(root,'socialsTitle1',h.title1||'');setScopedText(root,'socialsTitle2',h.title2||'');setScopedOptionalText(root,'socialsDescription',cfg.socialsDescription);
  const cta=scopedEl(root,'socialsMainCta');if(cta){const obj=cfg.socialsMainCta||{};cta.href=safeLink(obj.url);cta.innerHTML=`${escapeHtml(obj.label||'@TUUSUARIO | SEGUIR')} <b>IR</b>`;cta.classList.toggle('hidden',!cleanText(obj.label));}
  const grid=root.querySelector('[id^="socialGrid"],.social-grid');if(!grid)return;grid.innerHTML='';
  (cfg.socials||[]).filter(s=>s.enabled!==false).forEach(s=>{const card=document.createElement('a');card.className='social-card reveal in';card.href=safeLink(s.url);card.target='_blank';card.rel='noopener noreferrer';card.style.setProperty('--social-color',safeColor(s.color,'#ff2db7'));const socialImage=safeImage(s.image);if(socialImage){card.classList.add('has-image');const media=document.createElement('div');media.className='social-card-media';setBackgroundImage(media,socialImage);card.appendChild(media)}const head=document.createElement('div');head.className='social-card-head';const icon=document.createElement('div');icon.className='social-icon';icon.textContent=s.icon||'+';head.appendChild(icon);const copy=document.createElement('div');copy.className='social-copy';const h3=document.createElement('h3');h3.textContent=s.label||'Red';const p=document.createElement('p');p.textContent=s.handle||'';copy.append(h3,p);const go=document.createElement('span');go.className='circle-btn social-arrow text-badge';go.innerHTML='<span class="go-text">IR</span>';card.append(head,copy,go);grid.appendChild(card)});
}
function renderCultureInto(root,cfg){
  const data=cfg.culture||{};setScopedText(root,'cultureTag',data.kicker||cfg.sectionHeaders?.culture?.tag||'');setScopedText(root,'cultureTitle1',data.title1||cfg.sectionHeaders?.culture?.title1||'');setScopedText(root,'cultureTitle2',data.title2||cfg.sectionHeaders?.culture?.title2||'');setScopedOptionalText(root,'cultureDescription',data.text);const cta=scopedEl(root,'cultureMainCta');if(cta){cta.href=safeLink(data.ctaUrl);cta.innerHTML=`${escapeHtml(data.ctaLabel||'@TUINSTAGRAM | SEGUIR')} <b>IR</b>`;}
  const gallery=root.querySelector('[id^="cultureGallery"],.culture-gallery');if(!gallery)return;gallery.innerHTML='';(data.items||[]).filter(x=>x.enabled!==false).forEach(item=>{const meta=culturePlatformMeta(item);const a=document.createElement('a');a.className='culture-card reveal in';a.href=safeLink(item.url||data.ctaUrl);a.target='_blank';a.rel='noopener noreferrer';a.style.setProperty('--culture-accent',meta.color);a.appendChild(makeBackground(item.image,'culture-media'));const top=document.createElement('div');top.className='culture-card-top';top.appendChild(culturePlatformIcon(meta,item));const bottom=document.createElement('div');bottom.className='culture-card-bottom';const left=document.createElement('div');left.className='culture-card-copy';const h=document.createElement('h3');h.textContent=item.title||'POST';left.appendChild(h);const network=document.createElement('span');network.className='culture-platform-label';network.textContent=meta.label;left.appendChild(network);const text=cleanText(item.text);if(text){const p=document.createElement('p');p.textContent=text;left.appendChild(p)}const go=document.createElement('span');go.className='circle-btn text-badge culture-go';go.innerHTML='<span class="go-text">IR</span>';bottom.append(left,go);a.append(top,bottom);gallery.appendChild(a)});
}
function renderFeaturedInto(root, cfg){
  const track=root.querySelector('[id^="featuredTrack"]'); if(!track)return; track.innerHTML='';
  const cloneMode=cfg.__sectionClone===true;
  const h=cfg.sectionHeaders?.featured||{}; setScopedText(root,'featuredTag',cloneMode?(h.tag??''):(h.tag||'')); setScopedText(root,'featuredTitle1',cloneMode?(h.title1??''):(h.title1||'')); setScopedText(root,'featuredTitle2',cloneMode?(h.title2??''):(h.title2||''));
  (cfg.featured||[]).filter(x=>x.enabled!==false).forEach((item,i)=>{
    const a=document.createElement('a');a.className='feature-card';a.href=safeLink(item.url);a.target='_blank';a.rel='noopener noreferrer';a.style.setProperty('--card-glow',safeColor(item.glow||cfg.theme?.primary,'#ff2db7'));a.dataset.index=String(i);a.appendChild(makeBackground(item.image));
    const index=document.createElement('span');index.className='feature-index';index.textContent=cloneMode?(item.kicker??''):(item.kicker||`0${i+1}`);a.appendChild(index);
    const badgeImage=safeImage(item.badgeImage);if(badgeImage){const img=document.createElement('img');img.className='feature-badge-image';img.src=badgeImage;img.loading='lazy';img.decoding='async';img.alt='';a.appendChild(img)}
    const title=cloneMode?(item.title??''):(item.title||'DESTACADO');if(cleanText(title)){const h3=document.createElement('h3');h3.textContent=title;a.appendChild(h3)}const subtitle=cleanText(item.subtitle);if(subtitle){const p=document.createElement('p');p.textContent=subtitle;a.appendChild(p)}
    const go=document.createElement('span');go.className='circle-btn arrow-only text-badge';go.innerHTML='<span class="go-text">IR</span>';a.appendChild(go);track.appendChild(a)
  });
}
function renderClipsInto(root,cfg){const grid=root.querySelector('[id^="clipsGrid"],.clips-grid');if(!grid)return;grid.innerHTML='';const h=cfg.sectionHeaders?.clips||{};setScopedText(root,'clipsTag',h.tag||'');setScopedText(root,'clipsTitle1',h.title1||'');setScopedText(root,'clipsTitle2',h.title2||'');(cfg.clips||[]).filter(x=>x.enabled!==false).forEach(item=>{const a=document.createElement('a');a.className='clip-card reveal in';a.href=safeLink(item.url);a.target='_blank';a.rel='noopener noreferrer';a.appendChild(makeBackground(item.image));const play=document.createElement('div');play.className='play';play.innerHTML='<span class="play-triangle"></span>';const copy=document.createElement('div');copy.className='clip-copy';const h3=document.createElement('h3');h3.textContent=item.title||'CLIP';copy.appendChild(h3);const subtitle=cleanText(item.subtitle);if(subtitle){const p=document.createElement('p');p.textContent=subtitle;copy.appendChild(p)}const go=document.createElement('span');go.className='circle-btn clip-go text-badge';go.innerHTML='<span class="go-text">IR</span>';a.append(play,copy,go);grid.appendChild(a)})}
function renderCustomInto(root,cfg){const box=root.querySelector('[id^="customSections"]')||root;box.innerHTML='';const active=(cfg.customSections||[]).filter(s=>s.enabled!==false);const shell=document.createElement('div');shell.className='custom-carousel-shell';shell.innerHTML='<button class="rail-arrow rail-arrow-left custom-arrow" type="button" aria-label="Extra anterior">←</button><div class="custom-track"></div><button class="rail-arrow rail-arrow-right custom-arrow" type="button" aria-label="Extra siguiente">→</button>';const track=shell.querySelector('.custom-track');active.forEach((item,i)=>{const wrap=document.createElement('section');wrap.className='custom-block custom-card reveal in';wrap.id=item.anchorId||`custom-${i+1}`;const inner=document.createElement('div');inner.className=`custom-inner ${item.image?'with-image':''}`; if (item.image && isPngLike(item.image)) inner.classList.add('png-custom');const copy=document.createElement('div');copy.className='custom-copy';copy.innerHTML=`<div class="section-badge"><span>${escapeHtml(item.kicker||'NUEVA SECCIÓN')}</span></div><h2 class="display-title section-display"><span class="white">${escapeHtml(item.title1||'NUEVO')}</span><span>${escapeHtml(item.title2||'BLOQUE.')}</span></h2>`;const text=cleanText(item.text);if(text){const p=document.createElement('p');p.className='section-copy';p.textContent=text;copy.appendChild(p)}if(item.ctaEnabled!==false&&item.ctaLabel){const a=document.createElement('a');a.className='btn btn-outline';a.href=safeLink(item.ctaUrl);a.target='_blank';a.rel='noopener noreferrer';a.innerHTML=`${escapeHtml(item.ctaLabel)} <b>IR</b>`;copy.appendChild(a)}inner.appendChild(copy);if(item.image){const media=document.createElement('div');media.className='custom-media';media.appendChild(makeBackground(item.image,'custom-image'));inner.appendChild(media)}wrap.appendChild(inner);track.appendChild(wrap)});box.appendChild(shell);}

function renderUpcomingInto(root,cfg){
  const h=cfg.sectionHeaders?.upcoming||{};setScopedText(root,'upcomingTag',h.tag||'');setScopedText(root,'upcomingTitle1',h.title1||'');setScopedText(root,'upcomingTitle2',h.title2||'');setScopedOptionalText(root,'nextStreamTitle',cfg.nextStreamTitle);setScopedOptionalText(root,'nextStreamText',cfg.nextStreamText);const imgUrl=safeImage(cfg.nextStreamImage);const img=scopedEl(root,'nextStreamImage');const box=scopedEl(root,'nextStreamImageBox');const card=scopedEl(root,'upcomingCard');if(img)setBackgroundImage(img,imgUrl);box?.classList.toggle('no-image',!imgUrl);card?.classList.toggle('with-image',!!imgUrl);
}
function renderAnnouncementsInto(root,cfg){
  const cloneMode=cfg.__sectionClone===true;
  const header=cfg.sectionHeaders?.announcements||{};
  setScopedOptionalText(root,'announcementKicker',cloneMode?(header.tag??''):(header.tag||'07 / AVISOS'));
  setScopedText(root,'announcementTitle1',cloneMode?(header.title1??''):(header.title1||'LO ÚLTIMO'));
  setScopedText(root,'announcementTitle2',cloneMode?(header.title2??''):(header.title2||'DEL STREAM.'));
  const track=root.querySelector('[id^="noticesTrack"],.notices-track');if(!track)return;track.innerHTML='';
  (cfg.announcements||[]).filter(x=>x&&x.enabled!==false).slice(0,12).forEach((notice,index)=>{const card=document.createElement('article');card.className='notice-card notice-carousel-card reveal in';card.dataset.noticeId=notice.id||String(index);const image=safeImage(notice.image);if(image){const media=document.createElement('div');media.className='notice-media';const img=document.createElement('img');img.src=image;img.alt=notice.title||'Aviso';img.loading='lazy';img.decoding='async';media.appendChild(img);card.appendChild(media);const toggle=document.createElement('button');toggle.type='button';toggle.className='notice-toggle';toggle.setAttribute('aria-expanded','false');toggle.innerHTML='Ver foto completa <span>⌄</span>';toggle.onclick=()=>{const expanded=card.classList.toggle('expanded');toggle.setAttribute('aria-expanded',expanded?'true':'false');toggle.innerHTML=expanded?'Ocultar foto <span>⌃</span>':'Ver foto completa <span>⌄</span>';};card.appendChild(toggle)}const content=document.createElement('div');content.className='notice-content';const kicker=cleanText(cloneMode?(notice.kicker??''):(notice.kicker||'AVISO'));if(kicker){const el=document.createElement('div');el.className='notice-kicker';el.textContent=kicker;content.appendChild(el)}const title=cloneMode?(notice.title??''):(notice.title||'AVISO / NOVEDAD');if(cleanText(title)){const h3=document.createElement('h3');h3.textContent=title;content.appendChild(h3)}const chip=cleanText(notice.chip);if(chip){const place=document.createElement('div');place.className='notice-place';place.textContent=chip;content.appendChild(place)}const text=cleanText(notice.text);if(text){const p=document.createElement('p');p.textContent=text;content.appendChild(p)}const cta=cleanText(notice.cta);const url=String(notice.url||'').trim();if(cta&&url&&url!=='#'){const a=document.createElement('a');a.className='notice-button';a.href=safeLink(url);a.target='_blank';a.rel='noopener noreferrer';a.textContent=cta;content.appendChild(a)}card.appendChild(content);track.appendChild(card)});root.classList.toggle('no-notices',!track.children.length);
}

function sponsorCategoryKey(value) {
  return String(value || 'general').trim() || 'general';
}
function sponsorCategoryName(cat, fallback) {
  return cleanText(cat?.name) || cleanText(cat?.tag) || fallback || 'Otros canjes';
}
function sponsorCategoryTag(cat) {
  return cleanText(cat?.tag) || 'SESIÓN';
}
function renderSponsorCategoryGroup(parent, cat, items, index) {
  const accent = safeColor(cat?.accent || cat?.color || items[0]?.color || items[0]?.glow || '#ff2db7', '#ff2db7');
  const group = document.createElement('section');
  group.className = 'sponsor-category-group reveal in';
  group.style.setProperty('--sponsor-category-color', accent);
  group.dataset.category = sponsorCategoryKey(cat?.id || cat?.name || index);

  const head = document.createElement('div');
  head.className = 'sponsor-category-head';
  const copy = document.createElement('div');
  const badge = document.createElement('span');
  badge.className = 'sponsor-category-badge';
  badge.textContent = sponsorCategoryTag(cat);
  const h4 = document.createElement('h4');
  h4.textContent = sponsorCategoryName(cat, `Canjes ${index + 1}`);
  copy.append(badge, h4);
  const desc = cleanText(cat?.description);
  if (desc) {
    const p = document.createElement('p');
    p.textContent = desc;
    copy.appendChild(p);
  }
  const count = document.createElement('b');
  count.className = 'sponsor-category-count';
  count.textContent = `${items.length} ${items.length === 1 ? 'CANJE' : 'CANJES'}`;
  head.append(copy, count);

  const shell = document.createElement('div');
  shell.className = 'sponsor-category-shell';
  const prev = document.createElement('button');
  prev.className = 'rail-arrow rail-arrow-left sponsor-category-arrow';
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Canje anterior');
  prev.textContent = '←';
  const track = document.createElement('div');
  track.className = 'sponsor-category-track';
  if (items.length === 1) track.classList.add('is-single');
  items.forEach((item, i) => { const card = sponsorDealCard(item, i); if (i === 0) card.classList.add('is-active'); track.appendChild(card); });
  const next = document.createElement('button');
  next.className = 'rail-arrow rail-arrow-right sponsor-category-arrow';
  next.type = 'button';
  next.setAttribute('aria-label', 'Canje siguiente');
  next.textContent = '→';
  shell.append(prev, track, next);
  group.append(head, shell);
  parent.appendChild(group);
}

function setupSponsorTrackInteractions(root, settings = {}){
  const tracks = [...root.querySelectorAll('.sponsor-category-track, .sponsor-vip-grid.is-carousel, .sponsor-partners-grid.is-carousel')];
  tracks.forEach(track => {
    clearInterval(track._sponsorTimer);
    if (track._resizeHandler) window.removeEventListener('resize', track._resizeHandler);

    const cards = () => [...track.children].filter(el => el.classList.contains('sponsor-deal-card') || el.classList.contains('sponsor-vip-logo') || el.classList.contains('sponsor-partner-logo'));
    const shell = track.closest('.sponsor-category-shell') || track.closest('.sponsor-vip-wrap') || track.closest('.sponsor-partner-wrap') || track.parentElement;
    const left = shell?.querySelector(':scope > .rail-arrow-left');
    const right = shell?.querySelector(':scope > .rail-arrow-right');

    const getMode = () => {
      if (track.classList.contains('sponsor-category-track')) return {auto: settings.dealsAuto !== false, speed:Math.max(8, Number(settings.dealsSpeed || 18))};
      if (track.classList.contains('sponsor-vip-grid')) return {auto: settings.vipAuto !== false, speed:Math.max(8, Number(settings.vipSpeed || 18))};
      if (track.classList.contains('sponsor-partners-grid')) return {auto: settings.partnersAuto !== false, speed:Math.max(8, Number(settings.partnersSpeed || 20))};
      return {auto:false,speed:12};
    };

    // Siempre iniciar cada carrusel desde el primer elemento al renderizar.
    // Antes se reutilizaba dataset.sponsorIndex y por eso VIP podía aparecer seleccionado al costado.
    track.dataset.sponsorIndex = '0';
    let index = 0;

    const setSidePadding = () => {
      const list = cards();
      if (!list.length) return;
      const card = list[index] || list[0];
      const cardWidth = card.getBoundingClientRect().width || card.offsetWidth || 0;
      const pad = Math.max(0, (track.clientWidth - cardWidth) / 2);
      track.style.setProperty('padding-left', `${pad}px`, 'important');
      track.style.setProperty('padding-right', `${pad}px`, 'important');
    };

    const updateStateOnly = () => {
      const list = cards();
      if (!list.length) return;
      index = ((index % list.length) + list.length) % list.length;
      track.dataset.sponsorIndex = String(index);
      list.forEach((card,i) => {
        const raw = Math.abs(i-index);
        const circularNeighbor = list.length > 2 && raw === list.length - 1;
        card.classList.toggle('is-active', i === index);
        card.classList.toggle('is-neighbor', raw === 1 || circularNeighbor);
      });
    };

    const centerCurrent = (behavior='smooth') => {
      const list = cards();
      if (!list.length) return;
      const card = list[index] || list[0];
      setSidePadding();
      // Forzar reflow para que el padding lateral aplicado por JS cuente antes de calcular el centro.
      void track.offsetWidth;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const target = Math.max(0, Math.min(max, card.offsetLeft + (card.offsetWidth / 2) - (track.clientWidth / 2)));
      try { track.scrollTo({ left: target, behavior }); }
      catch { track.scrollLeft = target; }
    };

    const update = (next=index, behavior='smooth') => {
      const list = cards();
      if (!list.length) return;
      index = ((next % list.length) + list.length) % list.length;
      updateStateOnly();
      requestAnimationFrame(() => requestAnimationFrame(() => centerCurrent(behavior)));
    };

    const bindCardClicks = () => {
      const list = cards();
      list.forEach((card, cardIndex) => {
        if (card.dataset.sponsorSelectBound === '1') return;
        card.dataset.sponsorSelectBound = '1';
        card.addEventListener('click', ev => {
          const current = Number(track.dataset.sponsorIndex || 0);
          if (cardIndex !== current) {
            ev.preventDefault();
            ev.stopPropagation();
            clearInterval(track._sponsorTimer);
            update(cardIndex);
            startAuto();
          }
        });
        const imgs = [...card.querySelectorAll('img')];
        imgs.forEach(img => {
          if (img.dataset.sponsorCenterBound === '1') return;
          img.dataset.sponsorCenterBound = '1';
          img.addEventListener('load', () => {
            window.setTimeout(() => centerCurrent('auto'), 30);
          }, { once:false });
        });
      });
    };

    const mode = getMode();
    const canMove = cards().length > 1;
    const useAuto = !!mode.auto && canMove;
    shell?.classList.toggle('sponsor-auto-mode', useAuto);
    shell?.classList.toggle('sponsor-arrow-mode', !useAuto && canMove);
    shell?.classList.toggle('is-single', !canMove);

    if (left) left.onclick = e => { e.preventDefault(); e.stopPropagation(); clearInterval(track._sponsorTimer); update(index - 1); };
    if (right) right.onclick = e => { e.preventDefault(); e.stopPropagation(); clearInterval(track._sponsorTimer); update(index + 1); };

    let downX = 0;
    track.onpointerdown = e => { downX = e.clientX || 0; clearInterval(track._sponsorTimer); };
    track.onpointerup = e => {
      const dx = (e.clientX || 0) - downX;
      if (Math.abs(dx) > 38) update(index + (dx < 0 ? 1 : -1));
      startAuto();
    };
    bindCardClicks();
    track.onmouseenter = () => clearInterval(track._sponsorTimer);
    track.onmouseleave = () => startAuto();

    const startAuto = () => {
      clearInterval(track._sponsorTimer);
      if (!useAuto) return;
      track._sponsorTimer = setInterval(()=>update(index + 1), Math.max(8, Number(mode.speed || 12))*1000);
    };

    track._resizeHandler = () => {
      setSidePadding();
      window.setTimeout(()=>centerCurrent('auto'), 60);
    };
    window.addEventListener('resize', track._resizeHandler);

    track.scrollLeft = 0;
    update(0, 'auto');
    window.setTimeout(()=>{ track.scrollLeft = 0; update(0, 'auto'); startAuto(); }, 180);
  });
}

function renderSponsorsInto(root,cfg){
  const s = cfg.sponsors || {};
  root.style.setProperty('--sponsor-vip-accent', safeColor(s.vipAccent || s.themeColor || '#ff2db7', '#ff2db7'));
  root.style.setProperty('--sponsor-partner-accent', safeColor(s.partnerAccent || s.vipAccent || s.themeColor || '#ff2db7', '#ff2db7'));
  root.style.setProperty('--sponsor-logo-bg', safeColor(s.logoBackplate || '#171018', '#171018'));
  const header = cfg.sectionHeaders?.sponsors || {};
  setScopedText(root,'sponsorsTag',header.tag || 'CANJES');
  setScopedText(root,'sponsorsTitle1',header.title1 || 'CANJES +');
  setScopedText(root,'sponsorsTitle2',header.title2 || 'PATROCINADORES.');
  setScopedOptionalText(root,'sponsorsIntro',s.intro || '');
  const dealsTitle = s.dealsTitle || 'CANJES ACTIVOS';
  setSponsorPanelTitle(root,'sponsorsDealsTitle',dealsTitle,'CANJES ACTIVOS');
  // Nuevo formato estético para VIP: arriba el subtítulo y abajo el título principal.
  setSponsorStackTitle(root,'sponsorsVipTitle','SOCIOS DEL STREAM','PATROCINIOS','VIPS');
  // Este título debe ser igual al del home: PATROCINADORES / ALIADOS DEL STREAM.
  setSponsorStackTitle(root,'sponsorsPartnersTitle','PATROCINADORES','ALIADOS DEL STREAM','');
  // Los símbolos decorativos se eliminan sin tocar los spans internos del título.
  root.querySelector('.sponsor-deals-block .sponsor-panel-title > span')?.replaceChildren();
  root.querySelector('.sponsor-vip-panel .sponsor-panel-title > span')?.replaceChildren();
  root.querySelector('.sponsor-partners-panel .sponsor-panel-title > span')?.replaceChildren();
  const back = scopedEl(root,'sponsorsBackBtn'); if(back){ back.textContent=s.backLabel || 'VOLVER AL INICIO'; back.href=document.body?.dataset?.page==='sponsors'?'index.html#top':'#top'; }

  const deals = (s.deals || []).filter(x => x && x.enabled !== false);
  const categories = Array.isArray(s.categories) ? s.categories.filter(x => x && x.enabled !== false) : [];
  const track = root.querySelector('[id^="sponsorDealsTrack"], .sponsor-deals-track');
  if(track){
    track.innerHTML='';
    track.classList.add('sponsor-category-list');
    const rendered = new Set();
    categories.forEach((cat, i) => {
      const key = sponsorCategoryKey(cat.id || cat.name);
      const items = deals.filter(item => sponsorCategoryKey(item.category) === key || sponsorCategoryKey(item.categoryName) === key || String(item.category || '').trim().toLowerCase() === String(cat.name || '').trim().toLowerCase());
      if (items.length) { rendered.add(key); renderSponsorCategoryGroup(track, cat, items, i); }
    });
    const others = deals.filter(item => {
      const key = sponsorCategoryKey(item.category);
      return !categories.some(cat => sponsorCategoryKey(cat.id || cat.name) === key || String(item.category || '').trim().toLowerCase() === String(cat.name || '').trim().toLowerCase());
    });
    if (others.length) renderSponsorCategoryGroup(track, {id:'general',name:'Otros canjes',tag:'GENERAL',accent:s.themeColor || '#ff2db7',description:'Canjes activos que todavía no tienen una sesión asignada.'}, others, categories.length);
  }

  const vipItems = (s.vip||[]).filter(x=>x&&x.enabled!==false);
  const vip = root.querySelector('[id^="sponsorVipGrid"], .sponsor-vip-grid');
  if(vip){
    vip.innerHTML='';
    vip.dataset.sponsorIndex = '0';
    vip.classList.toggle('is-single', vipItems.length===1);
    vip.classList.toggle('is-centered', vipItems.length>0);
    vip.classList.toggle('is-carousel', vipItems.length>1);
    if (!vip.parentElement?.classList.contains('sponsor-vip-wrap')) {
      const wrap=document.createElement('div'); wrap.className='sponsor-vip-wrap sponsor-logo-carousel-wrap';
      vip.parentNode.insertBefore(wrap, vip); wrap.appendChild(vip);
      wrap.insertAdjacentHTML('afterbegin','<button class="rail-arrow rail-arrow-left sponsor-vip-arrow" type="button" aria-label="VIP anterior">←</button>');
      wrap.insertAdjacentHTML('beforeend','<button class="rail-arrow rail-arrow-right sponsor-vip-arrow" type="button" aria-label="VIP siguiente">→</button>');
    }
    vip.parentElement?.classList.toggle('is-single', vipItems.length<=1);
    vipItems.forEach((item,idx)=>{
      const a=document.createElement('a');
      a.className='sponsor-vip-logo' + (idx===0?' is-active':'');
      a.href=safeLink(item.url); a.target='_blank'; a.rel='noopener noreferrer';
      a.appendChild(sponsorLogoNode(item,'sponsor-vip-logo-box'));
      const tag=document.createElement('span'); tag.textContent=item.tag||'VIP';
      const name=document.createElement('b'); name.textContent=item.name||'VIP'; name.title=item.name||'VIP';
      a.title=item.name||'VIP'; a.append(tag,name); vip.appendChild(a);
    });
  }
  const partnerItems = (s.partners||[]).filter(x=>x&&x.enabled!==false);
  const partners = root.querySelector('[id^="sponsorPartnersGrid"], .sponsor-partners-grid');
  if(partners){
    partners.innerHTML='';
    partners.dataset.sponsorIndex = '0';
    const partnerAuto = partnerItems.length > 1 && s.partnersAuto !== false;
    partners.classList.toggle('is-single', partnerItems.length===1);
    partners.classList.toggle('is-centered', partnerItems.length>0);
    partners.classList.toggle('is-carousel', false);
    partners.classList.toggle('is-marquee', partnerAuto);
    if (!partners.parentElement?.classList.contains('sponsor-partner-wrap')) {
      const wrap=document.createElement('div'); wrap.className='sponsor-partner-wrap sponsor-logo-carousel-wrap';
      partners.parentNode.insertBefore(wrap, partners); wrap.appendChild(partners);
      wrap.insertAdjacentHTML('afterbegin','<button class="rail-arrow rail-arrow-left sponsor-partner-arrow" type="button" aria-label="Patrocinador anterior">←</button>');
      wrap.insertAdjacentHTML('beforeend','<button class="rail-arrow rail-arrow-right sponsor-partner-arrow" type="button" aria-label="Patrocinador siguiente">→</button>');
    }
    const wrap = partners.parentElement;
    wrap?.classList.toggle('is-single', partnerItems.length<=1);
    wrap?.classList.toggle('is-marquee', partnerAuto);
    if (partnerAuto) {
      const baseGroup = Array.from({length: Math.max(8, partnerItems.length)}, (_, i) => partnerItems[i % partnerItems.length]);
      const displayItems = [...baseGroup, ...baseGroup];
      displayItems.forEach((item, idx) => {
        const a=document.createElement('a');
        a.className='sponsor-partner-logo' + (idx===0?' is-active':'');
        a.href=safeLink(item.url); a.target='_blank'; a.rel='noopener noreferrer';
        if (idx >= baseGroup.length) a.setAttribute('aria-hidden','true');
        a.appendChild(sponsorLogoNode(item,'sponsor-partner-logo-box'));
        const name=document.createElement('span'); name.textContent=item.name||'Sponsor'; name.title=item.name||'Sponsor';
        a.title=item.name||'Sponsor'; a.appendChild(name); partners.appendChild(a);
      });
      partners.style.setProperty('--partners-speed', `${Math.max(18, Number(s.partnersSpeed || 24))}s`);
    } else {
      partnerItems.forEach((item,idx)=>{
        const a=document.createElement('a');
        a.className='sponsor-partner-logo' + (idx===0?' is-active':''); a.href=safeLink(item.url); a.target='_blank'; a.rel='noopener noreferrer';
        a.appendChild(sponsorLogoNode(item,'sponsor-partner-logo-box'));
        const name=document.createElement('span'); name.textContent=item.name||'Sponsor'; name.title=item.name||'Sponsor';
        a.title=item.name||'Sponsor'; a.appendChild(name); partners.appendChild(a);
      });
    }
  }
  setupSponsorTrackInteractions(root, s);
  root.classList.toggle('hidden-section', s.enabled === false);
}

function renderAboutInto(root,cfg){
  const h=cfg.sectionHeaders?.about||{};
  setScopedText(root,'aboutTag',h.tag||'');
  setScopedText(root,'aboutTitle1',h.title1||'');
  setScopedText(root,'aboutTitle2',h.title2||'');
  setScopedOptionalText(root,'aboutTitle',cfg.about?.title);
  setScopedOptionalText(root,'aboutText',cfg.about?.text);
}

function renderFinalSponsorWall(cfg){
  const final = document.querySelector('.final-cta');
  if (!final) return;
  let wall = final.querySelector('.final-sponsor-wall');
  if (!wall) {
    wall = document.createElement('div');
    wall.className = 'final-sponsor-wall';
    final.appendChild(wall);
  }
  wall.innerHTML = '';
  const s = cfg.sponsors || {};
  const vip = (s.vip || []).filter(x => x && x.enabled !== false);
  const partners = (s.partners || []).filter(x => x && x.enabled !== false);
  const add = (arr, cls) => arr.forEach(item => {
    const a = document.createElement('a');
    a.className = `final-sponsor-dot ${cls}`;
    a.href = safeLink(item.url);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = item.name || 'Patrocinador';
    a.appendChild(sponsorLogoNode(item,'final-sponsor-logo'));
    wall.appendChild(a);
  });
  add(vip,'is-vip');
  add(partners,'is-partner');
  wall.classList.toggle('hidden-section', !vip.length && !partners.length);
}

function hydrateSectionInstance(el,c,item){
  if(!el||!item)return;applySectionStyle(el,item);
  const cfg=mergedConfigForItem(c,item);
  if(item.type==='live')renderLiveInto(el,cfg);
  if(item.type==='socials')renderSocialsInto(el,cfg);
  if(item.type==='culture')renderCultureInto(el,cfg);
  if(item.type==='featured')renderFeaturedInto(el,cfg);
  if(item.type==='clips')renderClipsInto(el,cfg);
  if(item.type==='upcoming')renderUpcomingInto(el,cfg);
  if(item.type==='announcements')renderAnnouncementsInto(el,cfg);
  if(item.type==='sponsors')renderSponsorsInto(el,cfg);
  if(item.type==='about')renderAboutInto(el,cfg);
  if(item.type==='custom')renderCustomInto(el,cfg);
}

function setupCarousel(c, root = document) {
  const viewport = root.querySelector ? root.querySelector(".carousel-viewport") : null;
  const track = root.querySelector ? root.querySelector(".carousel-track") : null;
  const prevFeatured = root.querySelector ? root.querySelector(".featured-arrow.rail-arrow-left") : null;
  const nextFeatured = root.querySelector ? root.querySelector(".featured-arrow.rail-arrow-right") : null;
  if (!viewport || !track) return;
  const cards = [...track.children];
  const hasFeaturedCarousel = cards.length > 1;
  prevFeatured?.classList.toggle("hidden", !hasFeaturedCarousel);
  nextFeatured?.classList.toggle("hidden", !hasFeaturedCarousel);
  if (!cards.length) return;

  let index = 0;
  let timer = null;
  let startX = 0;
  const gap = () => parseFloat(getComputedStyle(track).gap || 22);
  const step = () => cards[0].getBoundingClientRect().width + gap();
  const max = () => Math.max(0, cards.length - 1);
  const update = () => cards.forEach((card, i) => {
    card.classList.toggle("active", i === index);
    card.classList.toggle("neighbor", Math.abs(i-index) === 1);
  });
  const go = next => {
    index = Math.max(0, Math.min(max(), next));
    const cardWidth = cards[0].getBoundingClientRect().width;
    const offset = Math.max(0, (viewport.clientWidth - cardWidth) / 2);
    track.style.transform = `translateX(${offset - index * step()}px)`;
    update();
  };
  const auto = () => {
    clearInterval(timer);
    if (c.effects?.carouselAuto === false || cards.length <= 1) return;
    timer = setInterval(() => go(index >= max() ? 0 : index + 1), Math.max(1500, Number(c.effects?.carouselSeconds || 3.6) * 1000));
  };
  if (nextFeatured) nextFeatured.onclick = () => { go(index >= max() ? 0 : index + 1); auto(); };
  if (prevFeatured) prevFeatured.onclick = () => { go(index <= 0 ? max() : index - 1); auto(); };
  viewport.addEventListener("pointerdown", e => { startX = e.clientX; });
  viewport.addEventListener("pointerup", e => { const d=e.clientX-startX; if(Math.abs(d)>45)go(d<0?index+1:index-1); auto(); });
  window.addEventListener("resize", () => go(index));
  go(0);auto();
}

function setupReveal(c) {
  const nodes = document.querySelectorAll(".reveal");
  const params = new URLSearchParams(location.search);
  const instant = params.get("preview") === "1" || matchMedia("(max-width:700px)").matches || c.effects?.reveal === false;
  if (instant) {
    nodes.forEach(el => el.classList.add("in"));
    return;
  }
  document.body.classList.add("js-reveal");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .1 });
  nodes.forEach(el => observer.observe(el));
}

function startCountdown(iso) {
  const tick = () => {
    let diff = new Date(iso).getTime() - Date.now();
    diff = Number.isFinite(diff) ? Math.max(0, diff) : 0;
    const vals = [Math.floor(diff/86400000),Math.floor(diff%86400000/3600000),Math.floor(diff%3600000/60000),Math.floor(diff%60000/1000)];
    document.querySelectorAll('[data-section="upcoming"]').forEach(sec => {
      const prefixes=['cdDays','cdHours','cdMinutes','cdSeconds'];
      prefixes.forEach((prefix,i)=>{const el=sec.querySelector(`[id^="${prefix}"]`);if(el)el.textContent=String(vals[i]).padStart(2,"0")});
    });
  };
  tick(); setInterval(tick,1000);
}

function setupSocialCarousel(root = document) {
  const track = root.querySelector ? root.querySelector(".social-grid") : null;
  const prev = root.querySelector ? root.querySelector(".social-carousel-btn.prev") : null;
  const next = root.querySelector ? root.querySelector(".social-carousel-btn.next") : null;
  if (!track || !prev || !next) return;
  const cardStep = () => {
    const card = track.querySelector(".social-card");
    if (!card) return Math.max(240, track.clientWidth * .78);
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.gap || styles.columnGap || 14) || 14;
    return card.getBoundingClientRect().width + gap;
  };
  const move = dir => track.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
  prev.onclick = () => move(-1); next.onclick = () => move(1);
  const update = () => { const mobileCarousel=matchMedia("(max-width: 700px)").matches; prev.classList.toggle("hidden",!mobileCarousel||track.children.length<=1); next.classList.toggle("hidden",!mobileCarousel||track.children.length<=1); };
  update(); window.addEventListener("resize", update, { passive:true });
}
function setupRailCarousel(root, trackSelector, prevSelector, nextSelector, cardSelector, mobileOnly = false) {
  const track = root.querySelector(trackSelector), prev = root.querySelector(prevSelector), next = root.querySelector(nextSelector);
  if (!track || !prev || !next) return;
  const enabled = () => !mobileOnly || matchMedia("(max-width: 900px)").matches;
  const step = () => { const card=track.querySelector(cardSelector); if(!card)return Math.max(260,track.clientWidth*.78); const styles=getComputedStyle(track); const gap=parseFloat(styles.gap||styles.columnGap||16)||16; return card.getBoundingClientRect().width+gap; };
  const move=dir=>{if(enabled())track.scrollBy({left:dir*step(),behavior:"smooth"})}; prev.onclick=()=>move(-1);next.onclick=()=>move(1);
  const update=()=>{const show=enabled()&&track.children.length>1;prev.classList.toggle("hidden",!show);next.classList.toggle("hidden",!show)}; update();window.addEventListener("resize",update,{passive:true});
}
function setupCultureCarousel(root = document) { setupRailCarousel(root, ".culture-gallery", ".culture-arrow.rail-arrow-left", ".culture-arrow.rail-arrow-right", ".culture-card", true); }
function setupNoticesCarousel(root = document) { setupRailCarousel(root, ".notices-track", ".notice-arrow.rail-arrow-left", ".notice-arrow.rail-arrow-right", ".notice-carousel-card", false); }
function setupCustomCarousel(root = document) { setupRailCarousel(root, ".custom-track", ".custom-arrow.rail-arrow-left", ".custom-arrow.rail-arrow-right", ".custom-card", false); }
function setupSponsorsCarousel(root = document) {
  const cfg = window.__LAST_CONFIG__?.sponsors || {};
  setupSponsorTrackInteractions(root, cfg);
}

function setupClipsCarousel(root = document) {
  const track = root.querySelector ? root.querySelector(".clips-grid") : null; if(!track)return;
  const step=()=>{const card=track.querySelector(".clip-card");if(!card)return Math.max(260,track.clientWidth*.82);return card.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap||18)};
  const move=dir=>track.scrollBy({left:dir*step(),behavior:"smooth"});
  const prev=root.querySelector(".clips-side-arrow.rail-arrow-left"),next=root.querySelector(".clips-side-arrow.rail-arrow-right");
  const has=track.children.length>1;prev?.classList.toggle("hidden",!has);next?.classList.toggle("hidden",!has);if(prev)prev.onclick=()=>move(-1);if(next)next.onclick=()=>move(1);
}

function setupAmbient(c) {
  const glow = document.getElementById("cursorGlow");
  if (glow && matchMedia("(pointer:fine)").matches) {
    let raf=0,x=0,y=0;
    window.addEventListener("pointermove", e => {
      x=e.clientX;y=e.clientY;
      if(raf)return;
      raf=requestAnimationFrame(()=>{raf=0;glow.style.transform=`translate3d(${x-160}px,${y-160}px,0)`});
    }, { passive:true });
  } else if(glow) glow.style.display="none";

  document.addEventListener("visibilitychange",()=>document.body.classList.toggle("page-paused",document.hidden));
  const btn = document.getElementById("floatingButton");
  btn.classList.toggle("hidden", c.effects?.floatingButton === false);
  btn.innerHTML = '<span class="floating-x">×</span>';
  btn.onclick = () => document.getElementById("socials")?.scrollIntoView({ behavior:"smooth" });
}

async function loadConfig() {
  const params = new URLSearchParams(location.search);
  if (params.get("preview") === "1") {
    document.getElementById("previewRibbon").classList.remove("hidden");
    try {
      const memoryDraft = window.parent && window.parent !== window ? window.parent.__STREAMER_PREVIEW_DRAFT__ : null;
      if (memoryDraft) return normalizeConfig(memoryDraft);
    } catch {}
    try {
      let draft = await window.LocalConfigDB?.get(PREVIEW_KEY);
      if (!draft) draft = await window.LocalConfigDB?.migrateFromLocalStorage(PREVIEW_KEY);
      if (draft) return normalizeConfig(draft);
    } catch (err) { console.warn("Preview local DB unavailable:", err); }
  }

  if (window.CloudConfig?.enabled()) {
    let cached = null;
    try { cached = await window.LocalConfigDB?.get(LIVE_KEY); } catch {}
    if (cached) {
      Promise.resolve().then(async () => {
        try {
          const cloud = await window.CloudConfig.load();
          if (!cloud) return;
          const a = JSON.stringify(cached), b = JSON.stringify(cloud);
          if (a !== b) {
            await window.LocalConfigDB?.set(LIVE_KEY, cloud);
            const marker = 'streamerHubCloudRefresh_v589';
            const sig = b.length + ':' + b.slice(0,120);
            if (sessionStorage.getItem(marker) !== sig) {
              sessionStorage.setItem(marker, sig);
              setTimeout(() => location.reload(), 120);
            }
          }
        } catch (err) { console.warn("Cloud background refresh unavailable:", err?.message || err); }
      });
      return normalizeConfig(cached);
    }
    try {
      const cloud = await window.CloudConfig.load();
      if (cloud) {
        window.LocalConfigDB?.set(LIVE_KEY, cloud).catch(() => {});
        return normalizeConfig(cloud);
      }
    } catch (err) {
      console.warn("Cloud config unavailable:", err.message);
    }
  }

  try {
    let local = await window.LocalConfigDB?.get(LIVE_KEY);
    if (!local) local = await window.LocalConfigDB?.migrateFromLocalStorage(LIVE_KEY);
    if (local) return normalizeConfig(local);
  } catch (err) { console.warn("Local config DB unavailable:", err); }

  return normalizeConfig(window.DEFAULT_CONFIG);
}

async function initSponsorsPage() {
  const params = new URLSearchParams(location.search);
  if (params.get("preview") === "1") document.getElementById("previewRibbon")?.classList.remove("hidden");
  const c = await loadConfig();
  window.__LAST_CONFIG__ = c;
  applyTheme(c);
  renderParticles(c);
  renderNav(c);
  setText("brandBase", c.brandBase);
  setText("brandAccent", c.brandAccent);
  setText("footerBrandBase", c.brandBase);
  setText("footerBrandAccent", c.brandAccent);
  setText("copyrightBrand", `${c.brandBase}${c.brandAccent}`);
  document.title = `Canjes + Patrocinadores · ${c.brandBase}${c.brandAccent}`;
  const kick = (c.socials || []).find(s => s.id === "kick") || {};
  const headerKick = document.getElementById("headerKick");
  if (headerKick) headerKick.href = safeLink(kick.url);
  renderSponsors(c);
  document.querySelectorAll('[data-section="sponsors"]').forEach(sec => {
    sec.classList.remove('hidden-section');
    setupSponsorsCarousel(sec);
  });
  setupReveal(c);
  setText("year", new Date().getFullYear());
}

async function init() {
  const params = new URLSearchParams(location.search);
  if (params.get("preview") === "1" && params.get("fast") === "1") document.body.classList.add("preview-fast");
  const c = await loadConfig();
  window.__LAST_CONFIG__ = c;
  applyTheme(c);
  renderParticles(c);
  renderTicker(c);
  renderNav(c);

  setText("brandBase", c.brandBase);
  setText("brandAccent", c.brandAccent);
  setText("footerBrandBase", c.brandBase);
  setText("footerBrandAccent", c.brandAccent);
  setText("copyrightBrand", `${c.brandBase}${c.brandAccent}`);
  setText("eyebrowText", c.eyebrow);
  setText("heroLine1", c.heroLine1);
  setText("heroLine2", c.heroLine2);
  document.documentElement.style.setProperty('--hero-line1-scale', String(Math.max(.5, Math.min(2, Number(c.heroLine1Size || 1)))));
  document.documentElement.style.setProperty('--hero-line2-scale', String(Math.max(.5, Math.min(2, Number(c.heroLine2Size || 1)))));
  const heroNeonLine=document.getElementById("heroLine2");if(heroNeonLine)heroNeonLine.dataset.glowText=String(c.heroLine2||"");
  setOptionalText("heroDescription", c.heroDescription);
  document.title = `${c.brandBase}${c.brandAccent}`;

  const heroImg = safeImage(c.heroImage);
  const heroBg = document.getElementById("heroBg");
  heroBg.style.backgroundImage = heroImg ? `url("${heroImg.replaceAll('"','%22')}")` : "";

  setLink("primaryCta", c.primaryCta, "↗");
  setLink("secondaryCta", c.secondaryCta, "↗");
  const tertiary = document.getElementById("tertiaryCta");
  tertiary.classList.toggle("hidden", !c.tertiaryCta?.enabled);
  if (c.tertiaryCta?.enabled) setLink("tertiaryCta", c.tertiaryCta, "↗");
  const sponsorCta = document.getElementById("sponsorCta");
  sponsorCta?.classList.toggle("hidden", c.sponsorCta?.enabled === false || c.sponsors?.enabled === false);
  if (sponsorCta && c.sponsorCta?.enabled !== false) {
    setLink("sponsorCta", { ...(c.sponsorCta || {}), url: sponsorsPageUrl() }, "✦");
    sponsorCta.classList.add('sponsor-floating-trigger');
    sponsorCta.dataset.openSponsors = '1';
    bindSponsorCtaPage();
  }

  setIconLink("telegramCta", "telegramLabel", c.telegramBar || {}, "↗");
  document.getElementById("telegramCta")?.classList.toggle("hidden", c.telegramBar?.enabled === false);

  setOptionalText("instagramHint", c.instagramPromo?.hint || "");
  setOptionalText("instagramText", c.instagramPromo?.text || "");
  const instagramCtaObj = c.instagramPromo?.cta || {};
  const igLabel = document.getElementById("instagramCtaLabel");
  if (igLabel) igLabel.textContent = instagramCtaObj.label || "ÚNETE EN INSTAGRAM";
  const igCta = document.getElementById("instagramCta");
  igCta.href = safeLink(instagramCtaObj.url);
  document.querySelector(".hero-social-follow")?.classList.toggle("hidden", c.instagramPromo?.enabled === false);

  setSectionHeader("live", c.sectionHeaders?.live || {});
  setSectionHeader("socials", c.sectionHeaders?.socials || {});
  setSectionHeader("featured", c.sectionHeaders?.featured || {});
  setSectionHeader("clips", c.sectionHeaders?.clips || {});
  setSectionHeader("upcoming", c.sectionHeaders?.upcoming || {});
  setSectionHeader("about", c.sectionHeaders?.about || {});
  setSectionHeader("sponsors", c.sectionHeaders?.sponsors || {});

  setOptionalText("liveDescription", c.liveDescription);
  setOptionalText("socialsDescription", c.socialsDescription);
  setLink("socialsMainCta", c.socialsMainCta || {}, "IR");

  const kick = (c.socials || []).find(s => s.id === "kick") || {};
  ["headerKick","liveKickBtn","finalKickBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = safeLink(kick.url);
  });
  setText("kickHandle", `@${String(c.kickHandle || kick.handle || "yourkick").replace(/^@/,"")}`);
  const liveBadge = document.getElementById("liveBadge");
  const liveBadgeText = liveBadge?.querySelector("span");
  if (liveBadgeText) liveBadgeText.textContent = c.isLive ? "LIVE" : "OFFLINE";
  else if (liveBadge) liveBadge.textContent = c.isLive ? "LIVE" : "OFFLINE";
  liveBadge?.classList.toggle("offline", !c.isLive);
  const liveCard = document.getElementById("liveCard");
  liveCard?.classList.toggle("live-pulse", !!c.isLive);
  const livePhoto = document.getElementById("livePhoto");
  const livePhotoUrl = safeImage(c.liveImage);
  if (livePhoto) {
    setBackgroundImage(livePhoto, livePhotoUrl);
    livePhoto.classList.toggle("hidden", !livePhotoUrl);
  }
  (c.liveStats || []).slice(0,3).forEach((s,i) => {
    setText(`stat${i+1}Value`, s.value);
    setText(`stat${i+1}Label`, s.label);
  });

  renderSocials(c);
  renderCulture(c);
  renderFeatured(c);
  renderClips(c);
  renderCustomSections(c);

  setOptionalText("nextStreamTitle", c.nextStreamTitle);
  setOptionalText("nextStreamText", c.nextStreamText);
  const upcomingImageUrl = safeImage(c.nextStreamImage);
  const upcomingImageBox = document.getElementById("nextStreamImageBox");
  const upcomingImage = document.getElementById("nextStreamImage");
  const upcomingCard = document.getElementById("upcomingCard");
  if (upcomingImage) setBackgroundImage(upcomingImage, upcomingImageUrl);
  upcomingImageBox?.classList.toggle("no-image", !upcomingImageUrl);
  upcomingCard?.classList.toggle("with-image", !!upcomingImageUrl);

  setOptionalText("announcementKicker", c.sectionHeaders?.announcements?.tag || "07 / AVISOS");
  setText("announcementTitle1", c.sectionHeaders?.announcements?.title1 || "LO ÚLTIMO");
  setText("announcementTitle2", c.sectionHeaders?.announcements?.title2 || "DEL STREAM.");
  renderAnnouncements(c);
  renderSponsors(c);

  setOptionalText("aboutTitle", c.about?.title);
  setOptionalText("aboutText", c.about?.text);
  document.querySelector(".final-cta")?.classList.toggle("hidden-section", c.finalCta?.enabled === false);
  setOptionalText("finalKicker", c.finalCta?.kicker);
  const finalTitle = cleanText(c.finalCta?.title || "NOS VEMOS EN DIRECTO.");
  document.getElementById("finalTitle").innerHTML = escapeHtml(finalTitle).replace(/(\S+\.)$/, "<span>$1</span>");
  renderFinalSponsorWall(c);

  applySections(c);
  bindSponsorCtaPage();
  setText("year", new Date().getFullYear());
  document.querySelectorAll('[data-section="featured"]').forEach(sec => setupCarousel(c, sec));
  document.querySelectorAll('[data-section="socials"]').forEach(sec => setupSocialCarousel(sec));
  document.querySelectorAll('[data-section="clips"]').forEach(sec => setupClipsCarousel(sec));
  document.querySelectorAll('[data-section="culture"]').forEach(sec => setupCultureCarousel(sec));
  document.querySelectorAll('[data-section="announcements"]').forEach(sec => setupNoticesCarousel(sec));
  document.querySelectorAll('[data-section="custom"]').forEach(sec => setupCustomCarousel(sec));
  document.querySelectorAll('[data-section="sponsors"]').forEach(sec => setupSponsorsCarousel(sec));
  setupReveal(c);
  setupAmbient(c);
  startCountdown(c.nextStreamISO);
}

if (document.body?.dataset?.page === "sponsors") initSponsorsPage();
else init();
