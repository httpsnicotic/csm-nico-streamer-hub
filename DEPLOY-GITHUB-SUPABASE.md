# STREAMER HUB - DESPLIEGUE FINAL

Esta carpeta está preparada para GitHub Pages + Supabase.

## Qué queda sincronizado
Una vez conectado Supabase, cualquier cambio publicado desde `admin.html` se guarda en la nube. El sitio público de PC, iPhone, Android y tablet carga la misma configuración. No necesitas volver a subir a GitHub cuando cambias textos, colores, fotos, avisos, clips, redes o LIVE/OFFLINE.

GitHub solo se vuelve a tocar cuando cambias código/diseño/funciones.

## 1. Crear Supabase
1. Crea un proyecto nuevo en Supabase.
2. Abre **SQL Editor**.
3. Copia y ejecuta TODO `supabase-secure-setup.sql`.
4. Ve a **Authentication > Users** y crea tu usuario administrador con correo + contraseña fuerte.
5. Regresa al SQL Editor y ejecuta SOLO el INSERT del final del archivo usando tu correo o UUID.
6. En **Authentication > Providers > Email**, deja Email activo.
7. Recomendado: desactiva nuevos registros públicos si no necesitas que nadie cree cuentas.

## 2. Conectar el proyecto con Supabase
En Supabase abre **Project Settings > API** y copia:
- Project URL
- anon / public key

Edita `config.js` y reemplaza SOLO:
- `PASTE_SUPABASE_URL_HERE`
- `PASTE_SUPABASE_ANON_KEY_HERE`

El anon key puede estar en GitHub Pages. NO pegues `service_role`, secret keys ni contraseñas en el código.

## 3. Primera migración de tus datos locales
Haz esta parte desde el mismo navegador/PC donde ya tienes tu versión testeada publicada localmente.

1. Configura `config.js`.
2. Abre el proyecto local con `start.bat`.
3. Entra a `/admin.html`.
4. Inicia sesión con el usuario de Supabase.
5. Si la nube todavía está vacía, el panel recuperará automáticamente tu configuración local actual como borrador.
6. Pulsa **VISTA PREVIA** y verifica TODO.
7. Pulsa **PUBLICAR** y escribe `PUBLICAR`.

En esa primera publicación las imágenes locales `data:image/...` se suben automáticamente al bucket `site-media` y la configuración queda usando URLs de Supabase. Desde ese momento ya funcionará en todos los dispositivos.

## 4. GitHub Pages
Crea un repositorio y sube TODO el contenido de esta carpeta a la raíz del repositorio.

Luego en GitHub:
1. **Settings > Pages**.
2. En `Build and deployment`, usa **Deploy from a branch**.
3. Branch: `main`.
4. Folder: `/ (root)`.
5. Guarda y espera a que GitHub publique el sitio.

La web quedará normalmente en:
`https://TU-USUARIO.github.io/TU-REPOSITORIO/`

Y el panel:
`https://TU-USUARIO.github.io/TU-REPOSITORIO/admin.html`

## 5. Probar sincronización
1. Abre el panel publicado en el celular.
2. Inicia sesión.
3. Cambia algo pequeño.
4. VISTA PREVIA.
5. PUBLICAR.
6. Abre la web en PC/tablet y recarga.

Debe aparecer el mismo cambio.

## Seguridad
- `admin.html` puede ser descubierto, pero sin una sesión válida no permite editar.
- La contraseña NO está en los archivos.
- La anon key NO otorga permisos de escritura por sí sola.
- Las políticas RLS de Supabase deciden quién publica.
- Solo UUIDs incluidos en `public.admins` pueden actualizar la web.
- Las imágenes se suben bajo `UUID-del-admin/...`.
- El historial de revisiones no es público.
- Nunca subas una service_role key a GitHub.

## Importante
Después de activar Supabase, NO vuelvas a usar una copia vieja del proyecto sin `config.js` configurado si vas a editar contenido, porque esa copia funcionará en modo local y no sincronizará.
