const LIVE_KEY = "streamerHubConfig_v2";
const PREVIEW_KEY = "streamerHubPreview_v2";

const clone = value => JSON.parse(JSON.stringify(value));

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
  const legacyAnnouncement = incoming.announcement && typeof incoming.announcement === "object" ? clone(incoming.announcement) : null;
  const c = deepMerge(defaults, incoming);

  if (!Array.isArray(c.socials)) c.socials = [];
  if (!Array.isArray(c.featured)) c.featured = [];
  if (!Array.isArray(c.clips)) c.clips = [];
  if (!Array.isArray(c.liveStats)) c.liveStats = clone(defaults.liveStats || []);
  if (!Array.isArray(c.navLinks)) c.navLinks = clone(defaults.navLinks || []);
  if (!Array.isArray(c.customSections)) c.customSections = [];
  if (!c.culture || typeof c.culture !== "object") c.culture = clone(defaults.culture || {});
  if (!Array.isArray(c.culture.items)) c.culture.items = [];
  if (!Array.isArray(c.announcements)) c.announcements = [];
  if (!hadAnnouncements && legacyAnnouncement && ["kicker","title","chip","text","cta","url","image"].some(k => legacyAnnouncement[k])) {
    c.announcements = [{ id:"notice_migrated", enabled:legacyAnnouncement.enabled !== false, kicker:legacyAnnouncement.kicker || "AVISO", title:legacyAnnouncement.title || "AVISO / NOVEDAD", chip:legacyAnnouncement.chip || "", text:legacyAnnouncement.text || "", cta:legacyAnnouncement.cta || "", url:legacyAnnouncement.url || "#", image:legacyAnnouncement.image || "" }];
  }

  const validSections = ["live","socials","culture","featured","clips","upcoming","announcements","about","custom"];
  c.sections = { ...(defaults.sections || {}), ...(c.sections || {}) };
  if (!Array.isArray(c.sectionOrder)) c.sectionOrder = [...validSections];
  c.sectionOrder = [
    ...c.sectionOrder.filter(x => validSections.includes(x)),
    ...validSections.filter(x => !c.sectionOrder.includes(x))
  ];
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
  nav.innerHTML = "";
  (c.navLinks || []).filter(x => x.enabled !== false).forEach(item => {
    const a = document.createElement("a");
    a.href = safeLink(item.target);
    a.textContent = item.label || "ENLACE";
    nav.appendChild(a);
  });
}

let lazyBgObserver = null;
function setBackgroundImage(el, value, critical = false) {
  if (!el) return;
  const safe = safeImage(value);
  if (!safe) { el.style.backgroundImage = ""; return; }
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

function makeBackground(url, className = "media-bg") {
  const div = document.createElement("div");
  div.className = className;
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

function renderCustomSections(c) {
  const container = document.getElementById("customSections");
  container.innerHTML = "";
  const active = (c.customSections || []).filter(s => s.enabled !== false);
  document.getElementById("customSectionContainer")?.classList.toggle("hidden-section", !active.length || c.sections?.custom === false);

  active.forEach((item, i) => {
    const wrap = document.createElement("section");
    wrap.className = "custom-block reveal";
    wrap.id = item.anchorId || `custom-${i+1}`;

    const inner = document.createElement("div");
    inner.className = `custom-inner ${item.image ? "with-image" : ""}`;
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
    if (item.ctaLabel) {
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
    container.appendChild(wrap);
  });
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

function applySections(c) {
  const container = document.getElementById("dynamicSections");
  (c.sectionOrder || []).forEach(key => {
    const el = container.querySelector(`[data-section="${CSS.escape(key)}"]`);
    if (el) container.appendChild(el);
  });
  container.querySelectorAll("[data-section]").forEach(el => {
    const key = el.dataset.section;
    const hasNotices = (c.announcements || []).some(x => x && x.enabled !== false);
    const enabled = c.sections?.[key] !== false && !(key === "announcements" && (c.announcement?.enabled === false || !hasNotices));
    if (key !== "custom") el.classList.toggle("hidden-section", !enabled);
  });
}

function setSectionHeader(prefix, obj = {}) {
  setText(`${prefix}Tag`, obj.tag || "");
  setText(`${prefix}Title1`, obj.title1 || "");
  setText(`${prefix}Title2`, obj.title2 || "");
}

function setupCarousel(c) {
  const viewport = document.getElementById("featuredViewport");
  const track = document.getElementById("featuredTrack");
  const cards = [...track.children];
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

  document.getElementById("nextFeatured").onclick = () => { go(index >= max() ? 0 : index + 1); auto(); };
  document.getElementById("prevFeatured").onclick = () => { go(index <= 0 ? max() : index - 1); auto(); };
  viewport.addEventListener("pointerdown", e => { startX = e.clientX; });
  viewport.addEventListener("pointerup", e => {
    const d = e.clientX - startX;
    if (Math.abs(d) > 45) go(d < 0 ? index + 1 : index - 1);
    auto();
  });
  window.addEventListener("resize", () => go(index));
  go(0);
  auto();
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
  const ids = ["cdDays","cdHours","cdMinutes","cdSeconds"];
  const tick = () => {
    let diff = new Date(iso).getTime() - Date.now();
    diff = Number.isFinite(diff) ? Math.max(0, diff) : 0;
    const vals = [
      Math.floor(diff / 86400000),
      Math.floor(diff % 86400000 / 3600000),
      Math.floor(diff % 3600000 / 60000),
      Math.floor(diff % 60000 / 1000)
    ];
    vals.forEach((v,i) => setText(ids[i], String(v).padStart(2,"0")));
  };
  tick();
  setInterval(tick, 1000);
}

function setupSocialCarousel() {
  const track = document.getElementById("socialGrid");
  const prev = document.getElementById("prevSocial");
  const next = document.getElementById("nextSocial");
  if (!track || !prev || !next) return;

  const cardStep = () => {
    const card = track.querySelector(".social-card");
    if (!card) return Math.max(240, track.clientWidth * .78);
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.gap || styles.columnGap || 14) || 14;
    return card.getBoundingClientRect().width + gap;
  };
  const move = dir => track.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
  prev.onclick = () => move(-1);
  next.onclick = () => move(1);

  const update = () => {
    const mobileCarousel = matchMedia("(max-width: 700px)").matches;
    prev.classList.toggle("hidden", !mobileCarousel || track.children.length <= 1);
    next.classList.toggle("hidden", !mobileCarousel || track.children.length <= 1);
  };
  update();
  window.addEventListener("resize", update, { passive:true });
}

function setupRailCarousel(trackId, prevId, nextId, cardSelector, mobileOnly = false) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (!track || !prev || !next) return;

  const enabled = () => !mobileOnly || matchMedia("(max-width: 900px)").matches;
  const step = () => {
    const card = track.querySelector(cardSelector);
    if (!card) return Math.max(260, track.clientWidth * .78);
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.gap || styles.columnGap || 16) || 16;
    return card.getBoundingClientRect().width + gap;
  };
  const move = dir => {
    if (!enabled()) return;
    track.scrollBy({ left: dir * step(), behavior: "smooth" });
  };
  prev.onclick = () => move(-1);
  next.onclick = () => move(1);

  const update = () => {
    const show = enabled() && track.children.length > 1;
    prev.classList.toggle("hidden", !show);
    next.classList.toggle("hidden", !show);
  };
  update();
  window.addEventListener("resize", update, { passive:true });
}

function setupCultureCarousel() {
  setupRailCarousel("cultureGallery", "prevCulture", "nextCulture", ".culture-card", true);
}

function setupNoticesCarousel() {
  setupRailCarousel("noticesTrack", "prevNotice", "nextNotice", ".notice-carousel-card", false);
}

function setupClipsCarousel() {
  const track = document.getElementById("clipsGrid");
  if (!track) return;
  const step = () => {
    const card = track.querySelector(".clip-card");
    if (!card) return Math.max(260, track.clientWidth * .82);
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 18);
  };
  const move = dir => track.scrollBy({ left: dir * step(), behavior: "smooth" });
  const prev = document.getElementById("prevClip"), next = document.getElementById("nextClip");
  if (prev) prev.onclick = () => move(-1);
  if (next) next.onclick = () => move(1);
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

async function init() {
  const params = new URLSearchParams(location.search);
  if (params.get("preview") === "1" && params.get("fast") === "1") document.body.classList.add("preview-fast");
  const c = await loadConfig();
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
  setupSocialCarousel();
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

  setOptionalText("aboutTitle", c.about?.title);
  setOptionalText("aboutText", c.about?.text);
  setOptionalText("finalKicker", c.finalCta?.kicker);
  const finalTitle = cleanText(c.finalCta?.title || "NOS VEMOS EN DIRECTO.");
  document.getElementById("finalTitle").innerHTML = escapeHtml(finalTitle).replace(/(\S+\.)$/, "<span>$1</span>");

  applySections(c);
  setText("year", new Date().getFullYear());
  setupCarousel(c);
  setupClipsCarousel();
  setupCultureCarousel();
  setupNoticesCarousel();
  setupReveal(c);
  setupAmbient(c);
  startCountdown(c.nextStreamISO);
}

init();
