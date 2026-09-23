window.DEFAULT_CONFIG = {
  version: 5.821,

  brandBase: "CSM",
  brandAccent: "NICO",
  eyebrow: "CREADOR · STREAMER · EST. 2026",
  heroLine1: "STREAM",
  heroLine2: "NICO",
  heroLine1Size: 1,
  heroLine2Size: 1,
  heroDescription: "DIRECTOS · RETOS · IRL · CLIPS",
  heroImage: "",
  heroOverlay: 0.46,

  primaryCta: { label: "VER EN KICK", url: "https://kick.com/" },
  secondaryCta: { label: "SÍGUEME", url: "#socials" },
  tertiaryCta: { enabled: false, label: "DESTACADO", url: "#featured" },
  sponsorCta: { enabled: true, label: "CANJES + PATROCINIOS", url: "#sponsors" },

  telegramBar: {
    enabled: true,
    label: "NUEVOS LANZAMIENTOS · TELEGRAM",
    url: "https://t.me/"
  },

  instagramPromo: {
    enabled: true,
    hint: "MANTENTE CONECTADO",
    text: "DETRÁS DE CÁMARAS · ACTUALIZACIONES · MÁS",
    cta: { label: "ÚNETE EN INSTAGRAM", url: "https://instagram.com/" }
  },

  theme: {
    background: "#050506",
    backgroundSoft: "#09090d",
    surface: "#0b0b0f",
    surface2: "#111118",
    headerBackground: "#050506",
    footerBackground: "#030304",
    brandBaseColor: "#ffffff",
    brandAccentColor: "#ff2db7",
    heroEyebrow: "#b8b0bf",

    text: "#f7f4f8",
    muted: "#a39daa",
    navText: "#b8b0bf",
    navHover: "#ffffff",
    footerText: "#817988",

    primary: "#ff2db7",
    secondary: "#7a63ff",
    kick: "#53fc18",

    borderColor: "#ffffff",
    sectionLine: "#ff2db7",

    cardBackground: "#0b0b10",
    cardText: "#ffffff",
    cardMuted: "#cfc9d4",
    socialCardBackground: "#0a0a0d",
    cultureCardBackground: "#08080b",
    noticeCardBackground: "#0b0b10",
    upcomingCardBackground: "#0b0b10",
    liveCardBackground: "#0b0b10",

    buttonGradientStart: "#ff2db7",
    buttonGradientEnd: "#7a63ff",
    buttonText: "#09070b",
    buttonDark: "#050506",
    buttonDarkText: "#ffffff",
    buttonOutlineText: "#ffffff",

    badgeBackground: "#160712",
    badgeText: "#ff2db7",
    badgeBorder: "#ff2db7",

    heroGlowLeft: "#ff178f",
    heroGlowCenter: "#7d42ff",
    heroGlowRight: "#1681ff",
    heroBeamPink: "#ff178f",
    heroBeamBlue: "#1681ff",
    heroTitleWhite: "#ffffff",
    heroTitleNeon: "#ff4fc7",
    heroText: "#d5ced9",

    sectionTitleWhite: "#ffffff",
    sectionTitleNeon: "#ff4fc7",

    countdownBackground: "#101015",
    countdownNumber: "#ffffff",
    countdownLabel: "#8d8593",

    floatingButton: "#d100cf",
    floatingButtonText: "#ffffff",

    previewRibbonBackground: "#ffcf33",
    previewRibbonText: "#151000",

    borderAlpha: 0.14,
    radius: 30,
    glowStrength: 0.55
  },

  effects: {
    particles: true,
    ticker: false,
    reveal: true,
    carouselAuto: true,
    carouselSeconds: 3.6,
    reduceMotion: false,
    floatingButton: true,
    heroNeonIntensity: 26,
    heroNeonMax: 230,
    heroWhiteGlowIntensity: 18,
    sectionNeonIntensity: 24,
    subtitleNeonIntensity: 16,
    subtitleTextBrightness: 100,
    backgroundGlowIntensity: 46
  },

  tickerText: "DIRECTOS ✦ IRL ✦ RETOS ✦ CLIPS ✦ COMUNIDAD ✦",

  navLinks: [
    { id: "nav1", label: "REDES", target: "#socials", enabled: true },
    { id: "nav2", label: "INSTAGRAM", target: "#culture", enabled: true },
    { id: "nav3", label: "DESTACADO", target: "#featured", enabled: true },
    { id: "nav4", label: "CLIPS", target: "#clips", enabled: true },
    { id: "navSponsors", label: "CANJES", target: "#sponsors", enabled: true },
    { id: "nav5", label: "PRÓXIMO", target: "#upcoming", enabled: true }
  ],

  isLive: true,
  kickHandle: "yourkick",
  liveDescription: "",
  liveImage: "",
  liveStats: [
    { value: "IRL", label: "DIRECTOS" },
    { value: "SEMANAL", label: "EVENTOS" },
    { value: "CLIPS", label: "MOMENTOS" }
  ],

  sectionHeaders: {
    live: { tag: "01 / EN VIVO", title1: "STREAM EN", title2: "KICK." },
    socials: { tag: "02 / REDES", title1: "SIGUE LA", title2: "COMUNIDAD." },
    culture: { tag: "03 / INSTAGRAM", title1: "SIGUE LA", title2: "CULTURA." },
    featured: { tag: "04 / DESTACADO", title1: "QUÉ ESTÁ", title2: "PASANDO." },
    clips: { tag: "05 / CLIPS", title1: "MIRA LOS", title2: "CLIPS." },
    upcoming: { tag: "06 / PRÓXIMO", title1: "NO TE LO", title2: "PIERDAS." },
    announcements: { tag: "07 / AVISOS", title1: "LO ÚLTIMO", title2: "DEL STREAM." },
    sponsors: { tag: "08 / CANJES", title1: "CANJES +", title2: "PATROCINADORES." },
    about: { tag: "09 / SOBRE MÍ", title1: "HECHO PARA", title2: "EL STREAM." }
  },

  socialsDescription: "",
  socialsMainCta: { label: "TODAS MIS REDES", url: "#socials" },
  socials: [
    { id:"kick", label:"Kick", handle:"@yourkick", url:"https://kick.com/", color:"#53fc18", icon:"K", image:"", enabled:true },
    { id:"tiktok", label:"TikTok", handle:"@yourtiktok", url:"https://tiktok.com/", color:"#20f2ea", icon:"T", image:"", enabled:true },
    { id:"instagram", label:"Instagram", handle:"@yourinstagram", url:"https://instagram.com/", color:"#ff3d9a", icon:"IG", image:"", enabled:true },
    { id:"youtube", label:"YouTube", handle:"@youryoutube", url:"https://youtube.com/", color:"#ff3347", icon:"YT", image:"", enabled:true },
    { id:"x", label:"X", handle:"@yourx", url:"https://x.com/", color:"#ffffff", icon:"X", image:"", enabled:true },
    { id:"discord", label:"Discord", handle:"Comunidad", url:"#", color:"#7585ff", icon:"DS", image:"", enabled:true }
  ],

  culture: {
    enabled: true,
    kicker: "03 / INSTAGRAM",
    title1: "SIGUE LA",
    title2: "CULTURA.",
    text: "",
    ctaLabel: "@TUINSTAGRAM · SEGUIR",
    ctaUrl: "https://instagram.com/",
    items: [
      { id:"ig1", title:"DETRÁS DE CÁMARAS", text:"", platform:"instagram", platformLabel:"", badge:"", image:"", url:"https://instagram.com/", enabled:true },
      { id:"ig2", title:"SETUP / ESTUDIO", text:"", platform:"instagram", platformLabel:"", badge:"", image:"", url:"https://instagram.com/", enabled:true },
      { id:"ig3", title:"MOMENTOS IRL", text:"", platform:"instagram", platformLabel:"", badge:"", image:"", url:"https://instagram.com/", enabled:true }
    ]
  },

  featured: [
    { id:"f1", kicker:"01 / LIVE", title:"IRL NIGHT", subtitle:"", url:"#", image:"", badgeImage:"", glow:"#ff2db7", enabled:true },
    { id:"f2", kicker:"02 / DROP", title:"NUEVO VIDEO", subtitle:"", url:"#", image:"", badgeImage:"", glow:"#7a63ff", enabled:true },
    { id:"f3", kicker:"03 / EVENTO", title:"STREAM ESPECIAL", subtitle:"", url:"#", image:"", badgeImage:"", glow:"#53fc18", enabled:true }
  ],

  clips: [
    { id:"c1", title:"CLIP 01", subtitle:"", url:"#", image:"", enabled:true },
    { id:"c2", title:"CLIP 02", subtitle:"", url:"#", image:"", enabled:true },
    { id:"c3", title:"CLIP 03", subtitle:"", url:"#", image:"", enabled:true }
  ],

  nextStreamISO: "2026-10-01T21:00:00-05:00",
  nextStreamTitle: "PRÓXIMO DIRECTO",
  nextStreamText: "",
  nextStreamImage: "",

  announcement: { enabled: true },
  announcements: [
    { id:"notice1", enabled:true, kicker:"AVISO", title:"AVISOS / NOVEDADES", chip:"STREAMER HUB", text:"", cta:"", url:"#", image:"" }
  ],

  sponsors: {
    enabled: true,
    intro: "Marcas, tiendas y negocios que apoyan el contenido. Usa los códigos, entra a sus links y revisa los canjes activos.",
    backLabel: "VOLVER AL INICIO",
    dealsTitle: "CANJES ACTIVOS",
    vipTitle: "PATROCINADORES VIP",
    partnersTitle: "GRACIAS A NUESTROS PATROCINADORES",
    homeAuto: true, homeSpeed: 14,
    vipAuto: true, vipSpeed: 4.8,
    partnersAuto: true, partnersSpeed: 5.2,
    dealsAuto: true, dealsSpeed: 5.5,
    categories: [
      { id:"restaurantes", enabled:true, name:"Restaurantes", tag:"COMIDA", accent:"#ff2db7", description:"Canjes de comida, locales, delivery y experiencias para la comunidad." },
      { id:"ropa", enabled:true, name:"Ropa / Moda", tag:"STYLE", accent:"#7a63ff", description:"Prendas, marcas urbanas, accesorios y drops para el stream." },
      { id:"servicios", enabled:true, name:"Servicios", tag:"ALIADOS", accent:"#19f7ff", description:"Negocios, herramientas y beneficios útiles para seguidores." }
    ],
    deals: [
      { id:"deal1", enabled:true, category:"restaurantes", tag:"CANJE", tier:"LOCAL", name:"NEGOCIO ALIADO", title:"Canje destacado", description:"Espacio para explicar qué ofrece la marca, qué te dio y por qué tu comunidad debería verla.", image:"", logo:"", url:"#", color:"#ff2db7", discountEnabled:true, discountLabel:"CÓDIGO", discountCode:"NICO10" },
      { id:"deal2", enabled:true, category:"ropa", tag:"DESCUENTO", tier:"PROMO", name:"TIENDA PARTNER", title:"Promo para la comunidad", description:"Agrega el beneficio principal, condiciones y llamado a visitar la tienda.", image:"", logo:"", url:"#", color:"#7a63ff", discountEnabled:false, discountLabel:"CÓDIGO", discountCode:"" }
    ],
    vip: [
      { id:"vip1", enabled:true, name:"PATROCINADOR VIP", tag:"VIP", logo:"", url:"#" }
    ],
    partners: [
      { id:"partner1", enabled:true, name:"Sponsor", tag:"OFICIAL", logo:"", url:"#" },
      { id:"partner2", enabled:true, name:"Aliado", tag:"ALIADO", logo:"", url:"#" }
    ]
  },

  about: { title:"", text:"" },
  finalCta: { enabled:true, kicker:"NOS VEMOS EN EL PRÓXIMO", title:"NOS VEMOS EN DIRECTO." },
  customSections: [],
  sections: { live:true, socials:true, culture:true, featured:true, clips:true, upcoming:true, announcements:true, sponsors:true, about:true, custom:true },
  sectionItems: [
    { id:"live", type:"live", name:"Kick / En vivo", enabled:true },
    { id:"socials", type:"socials", name:"Redes", enabled:true },
    { id:"culture", type:"culture", name:"Instagram / Cultura", enabled:true },
    { id:"featured", type:"featured", name:"Carrusel", enabled:true },
    { id:"clips", type:"clips", name:"Clips", enabled:true },
    { id:"upcoming", type:"upcoming", name:"Próximo stream", enabled:true },
    { id:"announcements", type:"announcements", name:"Anuncio", enabled:true },
    { id:"sponsors", type:"sponsors", name:"Canjes / Patrocinadores", enabled:true },
    { id:"about", type:"about", name:"Sobre mí", enabled:true },
    { id:"custom", type:"custom", name:"Extra", enabled:true }
  ],
  sectionOrder: ["live","socials","culture","featured","clips","upcoming","announcements","sponsors","about","custom"]
};
