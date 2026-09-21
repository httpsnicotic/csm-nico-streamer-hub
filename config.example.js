// Copia estos dos valores desde Supabase > Project Settings > API.
// El anon/public key ES público por diseño. La seguridad real la aplican las políticas RLS.
// NUNCA pegues aquí service_role, secret key ni una contraseña.
window.SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_ANON_PUBLIC_KEY"
};
