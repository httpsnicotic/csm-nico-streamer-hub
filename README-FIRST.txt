STREAMER HUB V2 SECURE
======================

NUEVO EN ESTA VERSIÓN
---------------------
- Borrador separado de la web publicada.
- Preview obligatorio ANTES de publicar.
- Si editas algo después del preview, PUBLISH vuelve a bloquearse.
- Confirmación final escribiendo PUBLICAR.
- Historial de versiones / rollback.
- Preview móvil, tablet y desktop.
- Preview grande a pantalla completa.
- Personalización completa de colores.
- Glow, bordes y esquinas configurables.
- Partículas on/off.
- Ticker on/off.
- Animaciones reveal on/off.
- Carrusel automático on/off + velocidad.
- Imagen de fondo del hero.
- Imágenes en carrusel.
- Imágenes en clips.
- Agregar/eliminar redes.
- Agregar/eliminar tarjetas de carrusel.
- Agregar/eliminar clips.
- Mostrar/ocultar secciones.
- Reordenar secciones.
- Publicación segura con Supabase RLS.
- Subida autenticada de imágenes.
- Filtrado de URLs peligrosas.
- Texto dinámico sin inyección HTML.
- Content Security Policy.

PRUEBA LOCAL
------------
1. Extrae la carpeta.
2. Doble clic en start.bat.
3. Página:
   http://localhost:5500
4. Admin:
   http://localhost:5500/admin.html

IPHONE
------
PC + iPhone deben usar el mismo Wi-Fi.

start.bat muestra la IPv4 de tu PC.
Ejemplo: 192.168.1.3

Safari:
http://192.168.1.3:5500/

Admin:
http://192.168.1.3:5500/admin.html

Usa HTTP, no HTTPS, para el servidor local de Python.

FLUJO SEGURO DE EDICIÓN
-----------------------
1. Editas cualquier cosa.
2. PUBLISH queda bloqueado.
3. Pulsas PREVIEW DRAFT.
4. Revisas móvil/tablet/desktop.
5. Si vuelves a editar, PUBLISH se bloquea de nuevo.
6. Generas otro preview.
7. Pulsas PUBLISH.
8. Escribes PUBLICAR.
9. Recién ahí cambia la configuración publicada.

LOCAL MODE
----------
Sirve para diseñar.
Los cambios publicados viven solo en localStorage de ese navegador.

En local puedes usar imágenes pequeñas (< 900 KB) como data URL.

SECURE CLOUD MODE
-----------------
1. Crea un proyecto en Supabase.
2. SQL Editor -> ejecuta supabase-secure-setup.sql.
3. Authentication -> Users -> crea tu cuenta admin.
4. Copia el UUID del usuario.
5. En el SQL, ejecuta el INSERT final reemplazando el UUID.
6. Project Settings -> API:
   copia Project URL y anon public key.
7. Pega SOLO esos dos valores en config.js.

Nunca pongas una service_role key en archivos públicos.

GITHUB PAGES
------------
Sube todos estos archivos a la raíz del repositorio.

GitHub -> Settings -> Pages
Source: Deploy from a branch
Branch: main
Folder: / (root)

La web pública será index.html.

SEGURIDAD
---------
Lee SECURITY.md.

Un visitante sí puede inspeccionar o alterar la página en DevTools en SU navegador, pero eso no modifica tu web real. Los cambios remotos quedan protegidos por Supabase RLS y la lista explícita de administradores.


V2.1 - CORRECCIÓN DE COMPATIBILIDAD
-----------------------------------
Si ya usaste una versión anterior, NO necesitas borrar tus datos.
Esta versión detecta automáticamente configuraciones antiguas donde
las redes estaban guardadas con otro formato y las adapta al formato nuevo.

Esto corrige el caso donde:
- la vista previa mostraba solo el encabezado/partículas;
- la portada desaparecía;
- el panel mostraba datos distintos al preview.

También se corrigió el selector de colores en español.


V5.2
- Preview visible en celular y sincronizado con el apartado activo del admin.
- Colores de Identidad + Portada restaurados.
- Controles de intensidad para neón de NICO, brillo blanco, títulos de secciones y luces del fondo.
- Logos Telegram/Instagram son SVG pequeños, sin imágenes gigantes.
- Cache busting actualizado a 5.2 para evitar que Safari/Chrome cargue CSS/JS viejo.

V5.4 RELEASE CANDIDATE
----------------------
- Scroll Admin -> Preview sincronizado por sección con detección precisa del panel activo.
- En móvil, el preview queda fijo arriba y el menú del admin se mantiene debajo.
- Al abrir el teclado en celular, el preview se compacta automáticamente para dejar más espacio al editor.
- Inputs móviles a 16 px para evitar el zoom automático de Safari.
- El menú horizontal del admin sigue automáticamente la sección activa.
- Preview grande ya no carga en segundo plano hasta que realmente lo abres.
- Se eliminó la comparación pesada de toda la configuración en cada tecla. Esto reduce mucho el lag, especialmente cuando hay imágenes locales en base64.
- Menos partículas en móvil/preview y cursor glow desactivado en pantallas táctiles.
- Animaciones se pausan cuando la pestaña queda oculta.
- El pulso de Kick usa una animación más ligera.
- El neón fuerte de NICO usa capas de halo separadas para mantener el control de intensidad sin cargar tanto la página.
- Fail-safe de animaciones: si JavaScript falla o una CDN no responde, el contenido no queda invisible.
- Supabase se carga solo si realmente está configurado.
- En una URL pública (por ejemplo GitHub Pages), admin.html queda BLOQUEADO si Supabase todavía no está configurado.
- admin.html incluye noindex/nofollow.
- Cache busting 5.4 para evitar archivos viejos en Safari/Chrome.

ANTES DE GITHUB
---------------
1. Configura Supabase y ejecuta supabase-secure-setup.sql.
2. Crea el usuario administrador en Supabase Authentication.
3. Añade su UUID a public.admins.
4. Pega solamente Project URL + anon public key en config.js.
5. Prueba iniciar sesión en admin.html en local.
6. Publica un cambio de prueba y confirma que aparece en otro dispositivo.
7. Recién después sube la carpeta completa a GitHub Pages.

IMPORTANTE: admin.html seguirá siendo una ruta visible si alguien conoce la URL, porque GitHub Pages es estático. Lo importante es que el editor y las escrituras quedan protegidos por autenticación + RLS. No hay usuario, contraseña ni service_role guardados en el JavaScript.

============================================================
PRODUCCIÓN / GITHUB + SUPABASE
============================================================
Para el despliegue final usa DEPLOY-GITHUB-SUPABASE.md y
supabase-secure-setup.sql. La primera publicación en nube puede migrar
la configuración local y sus imágenes automáticamente.
