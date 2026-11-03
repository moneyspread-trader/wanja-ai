# Deploying & Accessing Wanja AI

## Current Setup
- **Server** running on your Windows PC at `http://localhost:5050`.
- **Public tunnel** created with **localtunnel** (free) exposing the app at:
  - **URL:** `https://tall-peas-cry.loca.lt`
  - **Public IP (tunnel password):** `41.90.233.159`
- The tunnel runs as a background task (`task-368`).

## How to Open on Your Phone
1. **Make sure the server is still running** (daemon task `task-358`).  If you restart your PC, you’ll need to start it again (`start.bat`).
2. Open a browser on your phone (Chrome, Edge, etc.) and navigate to the tunnel URL above.
3. You’ll see a **splash screen** from localtunnel asking for a password.  Enter the public IP (`41.90.233.159`) and tap *Continue*.
4. The app loads – you’ll be prompted for the passcode **BETTYAI**, then to create a unique username.
5. All features (chat, image upload, camera scanner, dark‑mode toggle) work over HTTPS because the tunnel provides TLS.

## Keeping the Tunnel Stable
- The free localtunnel URL changes each time you restart the tunnel.  If you need a persistent link, consider one of the alternatives below.
- To **restart** the tunnel manually:
  ```powershell
  npx localtunnel --port 5050
  ```
  The command will print the new URL.

## Alternative Free Tunneling Options
| Service | How to Use | Pros |
|---|---|---|
| **cloudflared** (Cloudflare Tunnel) | Install from `https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation` then run `cloudflared tunnel --url http://localhost:5050` | Stable, custom subdomain possible, no splash screen |
| **serveo.net** (SSH tunnel) | `ssh -R 80:localhost:5050 serveo.net` | No extra install, simple, but occasional downtime |
| **ngrok** (free tier) | Download from `ngrok.com`, then `ngrok http 5050` | Clean UI, password protection, limited to 2 hrs per session |

## Making the App Mobile‑Friendly (Optional)
- Add a **PWA manifest** (`public/manifest.json`) and a tiny **service worker** to enable *Add to Home Screen* on Android/iOS.
- Ensure all buttons have a minimum touch area (44 px) and use `meta viewport` for proper scaling (already in `index.html`).
- Test camera permissions on mobile; the HTTPS tunnel satisfies the security requirement.

## Running the Server in the Background
You can use **PM2** (Node process manager) so the server restarts automatically:
```powershell
npm install -g pm2
pm2 start server/index.js --name wanja
pm2 save
pm2 startup
```
PM2 will keep the process alive after reboots.

## Next Steps
- Try the app on your phone using the URL above.
- If the tunnel URL changes, copy the new one and share it.
- Let me know if you want to add any of the optional improvements (PWA, alternative tunnel, PM2, etc.) or any new features.
