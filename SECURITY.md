# Security model

This project is static on GitHub Pages. Visitors can inspect HTML/CSS/JS because browsers need those files. That is normal and does not give them permission to change the real site.

The important boundary is Supabase:

- Public visitors get SELECT access only to `site_config`.
- Only authenticated users present in `public.admins` can UPDATE `site_config`.
- A normal authenticated user is not an admin unless their UUID is manually inserted in `public.admins`.
- Only admins can upload, update, or delete files in `site-media`.
- Every publish stores the previous config in `site_revisions`.
- The admin requires login in Cloud Mode.
- The public renderer blocks `javascript:` links and only accepts normal HTTP/HTTPS links.
- Dynamic public text is inserted with `textContent`, not raw HTML.
- Uploaded media is restricted to JPG, PNG, WEBP, and GIF.
- The page uses a restrictive Content Security Policy.

Important limitations:

1. No website is literally unhackable.
2. GitHub Pages cannot provide every security control. If later you want stronger edge headers, HSTS, rate limiting, bot rules, or a Web Application Firewall, put the site behind Cloudflare Pages or another host that supports them.
3. Never put a Supabase `service_role` key in this project. Only the public `anon` key belongs in `config.js`.
4. Use a strong, unique password for the admin account and enable MFA where available.
5. Protect the GitHub account with MFA. Repository write access can change the static site files.

## Preview safety

- Editing changes only an in-memory draft.
- `PREVIEW DRAFT` writes a browser-only preview copy.
- The public live configuration is untouched.
- Any edit after preview disables `PUBLISH` again.
- Publishing requires typing `PUBLICAR`.
- Each publish saves the previous version for rollback.

## V5.4 production admin lock

The admin editor no longer falls back to browser-local editing on a public hostname. If Supabase is not configured, `admin.html` shows a locked state instead of the editor. Local development remains available on localhost, file URLs, and private LAN addresses.

`admin.html` is also marked `noindex,nofollow,noarchive`. This reduces accidental search indexing, but it is not a security boundary. The real boundary remains Supabase authentication and RLS.

The Supabase browser SDK is loaded only when `config.js` contains a real Project URL and anon public key. No password, admin email, or `service_role` credential is embedded in the project.
