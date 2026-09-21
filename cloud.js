(() => {
  const cfg = window.SUPABASE_CONFIG || {};
  let client = null;
  let sdkPromise = null;

  const configured = () =>
    typeof cfg.url === "string" && cfg.url.startsWith("https://") && !cfg.url.includes("PASTE_") &&
    typeof cfg.anonKey === "string" && cfg.anonKey.length > 20 && !cfg.anonKey.includes("PASTE_");
  const enabled = () => configured();

  const ready = async () => {
    if (!configured()) return false;
    if (window.supabase) return true;
    if (!sdkPromise) sdkPromise = new Promise((resolve,reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => window.supabase ? resolve(true) : reject(new Error("Supabase no pudo iniciarse."));
      script.onerror = () => reject(new Error("No se pudo cargar el módulo seguro de Supabase."));
      document.head.appendChild(script);
    });
    return sdkPromise;
  };

  const getClient = () => {
    if (!configured() || !window.supabase) return null;
    if (!client) client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:false }
    });
    return client;
  };

  async function requireClient(){
    await ready();
    const sb=getClient();
    if(!sb) throw new Error("Supabase no está configurado.");
    return sb;
  }

  function isEmptyConfig(value){
    return !value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0;
  }

  async function currentUser(){
    const sb=await requireClient();
    const {data,error}=await sb.auth.getUser();
    return error ? null : (data?.user || null);
  }

  async function isAdmin(){
    const user=await currentUser();
    if(!user) return false;
    const sb=await requireClient();
    const {data,error}=await sb.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
    return !error && !!data;
  }

  async function uploadBlob(blob, originalName="image"){
    if(!(await isAdmin())) throw new Error("Sin permisos de administrador.");
    const allowed=new Set(["image/jpeg","image/png","image/webp","image/gif"]);
    if(!allowed.has(blob.type)) throw new Error("Formato no permitido. Usa JPG, PNG, WEBP o GIF.");
    if(blob.size>6*1024*1024) throw new Error("La imagen supera 6 MB.");

    const user=await currentUser();
    const ext = ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"})[blob.type] || "img";
    const base = String(originalName||"image")
      .toLowerCase().replace(/\.[a-z0-9]+$/i,"")
      .replace(/[^a-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"") || "image";
    const path=`${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${base}.${ext}`;
    const sb=await requireClient();
    let uploadResult;
    try{
      uploadResult=await sb.storage.from("site-media").upload(path,blob,{
        cacheControl:"31536000", upsert:false, contentType:blob.type
      });
    }catch(e){
      throw new Error(`No se pudo conectar con Storage de Supabase: ${e?.message||"error de red"}`);
    }
    const {error}=uploadResult||{};
    if(error) throw new Error(`Storage: ${error.message||String(error)}`);
    return sb.storage.from("site-media").getPublicUrl(path).data.publicUrl;
  }

  function dataUrlToBlob(dataUrl){
    const raw=String(dataUrl||"");
    const match=/^data:([^;,]+)?(;base64)?,([\s\S]*)$/i.exec(raw);
    if(!match) throw new Error("No se pudo preparar una imagen local para la nube.");
    const mime=match[1]||"application/octet-stream";
    const isBase64=!!match[2];
    try{
      if(isBase64){
        const binary=atob(match[3].replace(/\s/g,""));
        const bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
        return new Blob([bytes],{type:mime});
      }
      return new Blob([decodeURIComponent(match[3])],{type:mime});
    }catch{
      throw new Error("No se pudo decodificar una imagen local para subirla a la nube.");
    }
  }

  async function migrateInlineImages(config){
    const cache=new Map();
    async function walk(value, keyName="image"){
      if(typeof value === "string" && value.startsWith("data:image/")){
        if(cache.has(value)) return cache.get(value);
        const blob=dataUrlToBlob(value);
        const url=await uploadBlob(blob,keyName);
        cache.set(value,url);
        return url;
      }
      if(Array.isArray(value)){
        const out=[];
        for(let i=0;i<value.length;i++) out.push(await walk(value[i],`${keyName}-${i+1}`));
        return out;
      }
      if(value && typeof value === "object"){
        const out={};
        for(const [k,v] of Object.entries(value)) out[k]=await walk(v,k);
        return out;
      }
      return value;
    }
    return await walk(config,"site-media");
  }

  window.CloudConfig = {
    enabled, ready, getClient, currentUser, isAdmin, isEmptyConfig,

    async load(){
      if(!configured()) return null;
      /* Lectura pública ultraligera: no necesita descargar supabase-js.
         El SDK completo queda reservado para login/publicación del admin. */
      const endpoint=`${cfg.url.replace(/\/$/,"")}/rest/v1/site_config?id=eq.1&select=config`;
      let response;
      try{
        response=await fetch(endpoint,{
          headers:{ apikey:cfg.anonKey, Accept:"application/json" },
          cache:"no-store"
        });
      }catch(e){ throw new Error(`No se pudo leer la configuración pública: ${e?.message||"error de red"}`); }
      if(!response.ok) throw new Error(`Configuración pública: HTTP ${response.status}`);
      const rows=await response.json();
      const value=Array.isArray(rows)?rows[0]?.config:null;
      return isEmptyConfig(value) ? null : value;
    },

    async signIn(email,password){
      const sb=await requireClient();
      const {data,error}=await sb.auth.signInWithPassword({email,password});
      if(error) throw error;
      if(!(await isAdmin())){
        await sb.auth.signOut();
        throw new Error("Este usuario no está autorizado como administrador.");
      }
      return data;
    },

    async signOut(){
      if(!configured()) return;
      const sb=await requireClient();
      await sb.auth.signOut();
    },

    async publish(nextConfig){
      if(!(await isAdmin())) throw new Error("Sesión sin permisos de administrador.");
      const sb=await requireClient();
      const cloudConfig=await migrateInlineImages(nextConfig);
      let readResult;
      try{ readResult=await sb.from("site_config").select("config").eq("id",1).single(); }
      catch(e){ throw new Error(`No se pudo conectar con la base de datos de Supabase: ${e?.message||"error de red"}`); }
      const {data:current,error:readError}=readResult||{};
      if(readError) throw new Error(`Base de datos: ${readError.message||String(readError)}`);
      if(!isEmptyConfig(current?.config)){
        const {error:revError}=await sb.from("site_revisions").insert({config:current.config});
        if(revError) throw revError;
      }
      let updateResult;
      try{
        updateResult=await sb.from("site_config").update({
          config:cloudConfig,
          updated_at:new Date().toISOString()
        }).eq("id",1);
      }catch(e){
        throw new Error(`No se pudo guardar en Supabase: ${e?.message||"error de red"}`);
      }
      const {error}=updateResult||{};
      if(error) throw new Error(`Publicación: ${error.message||String(error)}`);
      return cloudConfig;
    },

    async listRevisions(limit=12){
      if(!(await isAdmin())) return [];
      const sb=await requireClient();
      const {data,error}=await sb.from("site_revisions")
        .select("id,created_at,config").order("created_at",{ascending:false}).limit(limit);
      if(error) throw error;
      return data||[];
    },

    async uploadImage(file){
      return uploadBlob(file,file.name||"image");
    },

    migrateInlineImages
  };
})();
