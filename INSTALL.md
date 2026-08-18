# Kaveri → 70.3 Goa Tracker — Install & Uninstall Guide

A PWA (Progressive Web App) for the Kaveri Trail Marathon (22 Nov 2026) → Ironman 70.3 Goa (2027) training plan. Install it on your Android phone for offline use, watch-mirrored pacing cues, and daily tracking.

---

## Part 1 — Install on your Android phone

You have **three paths**. Use **Path A** to try it now (5 min, no deploy). Use **Path A2** if you want the real offline install from your laptop without deploying. Use **Path B** for the permanent install you'll actually use day-to-day.

| | Path A (dev WiFi) | Path A2 (local HTTPS) | Path B (Netlify) |
|---|---|---|---|
| **Time** | 5 min | 20 min | 10 min |
| **Needs laptop on** | Yes | Yes | No |
| **Works offline** | **No** | Yes | Yes |
| **Installable as a real PWA** | No (bookmark shortcut only) | Yes | Yes |
| **Live updates** | Yes (hot reload) | On `npm run build` | On `git push` |
| **Best for** | Trying it now | Offline testing without deploying | Daily use, sharing |

**Why Path A can't be offline:** a PWA's offline engine (the service worker) only runs on **HTTPS** (or localhost). `http://192.168.x.x:5173` is plain HTTP, so the phone never gets a service worker — "Add to Home screen" just creates a shortcut that needs the laptop to be on. For real offline use you need HTTPS: **Path A2** (local HTTPS from your laptop) or **Path B** (Netlify).

**Recommendation:** Do Path A right now to see it on your phone in 5 minutes. If you want offline from the laptop, follow Path A2 once. When you're happy, do Path B so it's permanent and independent of your laptop.

---

### Path A — Run it live on your phone over WiFi

Use this to try the app right now. The phone and your laptop must be on the **same WiFi network**. No offline, no real install — just a quick look.

#### A1. Start the dev server on your laptop

```bash
cd /home/harish-kumar-v/Documents/opencode_marathon/marathon-tracker
npm install      # only the first time
npm run dev
```

You'll see something like:

```
  VITE v8 ready in 400 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/   ← use this one
```

The `Network:` URL is what your phone will open. (`server.host: true` is set in `vite.config.ts` so Vite binds to all interfaces — without it, the phone can't reach the server.)

#### A2. Find that Network URL

```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

You'll get something like `inet 192.168.1.42/24`. The URL for your phone is then `http://192.168.1.42:5173/`.

#### A3. Open it on your phone

1. Unlock the phone, open **Chrome** (or Firefox)
2. Type the URL from step A2 into the address bar: `http://192.168.1.42:5173/`
3. The app loads. You'll see the 4-screen onboarding, then the Today page.

> **Note:** over this plain-HTTP URL the app is *not* installable as a real PWA and *not* offline-capable — it's a preview. When you shut the laptop, this URL dies. For offline, do Path A2 or Path B.

#### A5. Enable notifications so cues mirror to your Amazfit

1. Open the installed app
2. Tap the **Race** tab at the bottom → you'll see **"Enable watch notifications"** → tap **"Allow notifications"** → phone asks permission → **Allow**
3. Tap **"Test cue"** to verify — a notification appears on the phone, and mirrors to the watch

#### A6. Mirror to the Amazfit T-Rex 3 Pro

On the phone (not the watch), open the **Zepp** companion app:

1. Go to **Profile** → **Devices** → your T-Rex 3 Pro
2. Find **"Notification management"** (or "Phone notifications" / "App notifications")
3. Enable it, and in the list of apps, enable **Chrome** (or whichever browser you installed the PWA from)
4. Some Zepp versions call this **"Read notifications"** — turn that on for the browser

Now every cue the PWA fires (pacing band, 9:1 phase changes, gel timings, daily shin reminder, etc.) will pop up on the watch face.

**Note on Path A:** the dev server must keep running on your laptop for the phone to reach it at all — no cache, no offline. For an offline-capable install from your laptop, do Path A2.

---

### Path A2 — Local HTTPS from your laptop (real offline install, no deploy)

Same laptop+phone WiFi setup, but served over HTTPS so the service worker registers and the app genuinely works offline when the laptop is off.

#### A2.1. Create a local HTTPS certificate (one-time)

Install `mkcert` (macOS: `brew install mkcert` · Linux: see mkcert.dev — the binary is a single download):

```bash
mkcert -install   # installs a local Certificate Authority on your laptop
ip addr show | grep "inet " | grep -v 127.0.0.1   # find your laptop's IP, e.g. 192.168.1.42
mkcert 192.168.1.42   # creates 192.168.1.42.pem + 192.168.1.42-key.pem
```

#### A2.2. Trust the certificate on your phone (one-time)

1. Find the CA file: `mkcert -CAROOT` (prints a folder containing `rootCA.pem`)
2. Copy `rootCA.pem` to the phone (email it to yourself, or `python3 -m http.server` + download)
3. On Android: **Settings → Security → More security settings → Install from storage (or "Install CA certificate")** → pick `rootCA.pem` → name it anything → confirm
4. Chrome on Android honours phone-installed CAs, so no extra step

#### A2.3. Serve the production build over HTTPS

```bash
cd /home/harish-kumar-v/Documents/opencode_marathon/marathon-tracker
npm run build
npm run preview -- --port 5173
```

(The HTTPS config lives in `vite.config.ts` (`preview.https`), which reads the cert files `192.168.0.117.pem` / `192.168.0.117-key.pem` next to it. If the laptop's IP changed, re-run `mkcert <new-ip>` and update the filenames in `vite.config.ts`.)

> **Why not `npx serve`?** `serve` adds a `Content-Disposition: inline` header to every response. Some Android Chrome versions reject that header on service-worker scripts, so the SW install dies silently (registered ✓ but never controlling, 0 caches, and the registration gets dropped on every visit). Vite's preview server sends clean headers and serves `index.html` directly with no redirect chain — the SW installs and caches correctly.

> **⚠️ Known limitation — Android Chrome refuses Path A2 service workers.** A minimal test proved the phone's Chrome downloads the SW script fine but rejects the install with `"An SSL certificate error occurred when fetching the script"`, even though the page loads fine over the same certificate. Android Chrome applies stricter certificate validation (Certificate Transparency checks) to service-worker scripts and **does not honour user-installed CAs there** — mkcert's CA is a user certificate, so *no* local-HTTPs Path A2 SW will ever install on Android Chrome. Desktop Chrome (where mkcert installs into the OS trust store) and Firefox on Android (different trust handling) do work. **On your Android phone, use Path B (Netlify) — a publicly trusted certificate — for the real offline install.**

#### A2.4. Install on the phone

1. Open Chrome on the phone → `https://192.168.1.42:5173`
2. Chrome **⋮ → Add to Home screen / Install app** → confirm
3. Icon appears. Tapping it opens **full-screen standalone**. The service worker has now cached the entire app — **turn on airplane mode and it still opens**.
4. Verify: **Settings → About → "Offline & service worker"** — registered ✓, controlling ✓, offline cache ready ✓. (If the laptop's IP changed since `mkcert`, the SW never registers — see Troubleshooting.)

Every time you change the app: `npm run build` (the `npx serve` server picks up the new `dist/` automatically — refresh the phone once).

**Note:** this certificate is tied to your laptop's current IP — if the IP changes (router restart, new WiFi), re-run `mkcert <new-ip>` and serve with the new files. When the laptop is off, the installed app still works from cache (but can't fetch updates — that's Path B's job).

---

### Path B — Deploy to Netlify (permanent, free)

Use this for the real install that survives laptop shutdown and works anywhere.

#### B1. Build the production bundle

```bash
cd /home/harish-kumar-v/Documents/opencode_marathon/marathon-tracker
npm run build
```

This produces a `dist/` folder (~1 MB) containing the app, the service worker, the manifest, and all icons.

#### B2. Put the code on GitHub (easiest path)

```bash
cd /home/harish-kumar-v/Documents/opencode_marathon/marathon-tracker
git init && git add -A && git commit -m "Kaveri → 70.3 tracker PWA"
gh repo create kaveri-tracker --public --source=. --push
```

(If you don't have `gh` installed: create an empty repo on github.com, then:)
```bash
git remote add origin git@github.com:YOUR-NAME/kaveri-tracker.git
git push -u origin main
```

#### B3. Connect to Netlify

1. Go to **[app.netlify.com](https://app.netlify.com)** → sign in with GitHub
2. **"Add a new site"** → **"Import an existing project"**
3. Pick the `kaveri-tracker` repo you just pushed
4. Build settings auto-detected:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **"Deploy site"**

Netlify runs `npm install && npm run build` and hosts `dist/`. You get a URL like `https://kaveri-tracker.netlify.app` in 1–2 minutes. HTTPS is automatic.

#### B4. Install on the phone from the Netlify URL

1. On the phone, open **Chrome** → go to `https://kaveri-tracker.netlify.app`
2. The app loads (over cellular or WiFi — doesn't matter, it's a real URL)
3. Chrome **⋮** → **"Add to Home screen"** → confirm
4. Icon appears on the home screen. Opens standalone, works offline, survives phone restarts and laptop shutdown.

#### B5. Enable notifications + Amazfit mirror

Same as Path A steps A5–A6 above: Race tab → "Allow notifications" → Zepp app → enable notification mirroring for Chrome.

---

## Part 2 — Uninstall from your Android phone

### Uninstall the PWA from your home screen

#### Method 1 (quick — removes the home-screen icon)

1. Long-press the **"Kaveri Tracker"** icon on your home screen
2. Drag it to the **"Uninstall"** (or "Remove") drop-zone at the top of the screen
3. Confirm — the icon is removed

This removes the home-screen shortcut. The cached app data (service worker + caches) remains in Chrome's storage. To fully remove, also do Method 2.

#### Method 2 (full — clears Chrome's cached data for the site)

1. Open **Chrome** → **⋮** → **Settings** → **Site settings** (or "History")
2. Find the site URL (`192.168.x.x:5173` for Path A, or `kaveri-tracker.netlify.app` for Path B)
3. Tap it → **Clear & reset** (or "Clear storage")
4. Confirm

This clears the service worker, the caches, and any saved data for the app. The next visit will re-fetch from the network as if it were the first visit.

#### Method 3 (clear all Chrome data — nuclear option)

1. Open **Chrome** → **⋮** → **Settings** → **Privacy and security** → **Clear browsing data**
2. Check **"Cached images and files"** and **"Cookies and site data"**
3. Tap **Clear data**

This clears cached data for **all** sites, not just this app. Use only if Method 2 doesn't solve the issue.

### Uninstall the dev server (Path A only)

If you used Path A and want to stop the dev server on your laptop:

```bash
# Find the Vite process
pkill -f vite

# Or, if that doesn't work
ps aux | grep -E "vite|node" | grep -v grep
# then: kill <PID>
```

### Remove the local project (optional — full cleanup from laptop)

```bash
cd /home/harish-kumar-v/Documents/opencode_marathon
rm -rf marathon-tracker
```

This deletes the source code, `node_modules`, `dist/`, and all installed files. The PWA installed on your phone is unaffected (it's cached in Chrome, not in this folder).

### Remove the GitHub repo + Netlify site (Path B only)

If you deployed via Path B and want to take it down:

**GitHub:**
```bash
cd /home/harish-kumar-v/Documents/opencode_marathon/marathon-tracker
gh repo delete kaveri-tracker --yes
```

**Netlify:**
1. Go to **[app.netlify.com](https://app.netlify.com)** → your sites
2. Click the **kaveri-tracker** site → **Site settings** → **⋮** → **Delete site**
3. Confirm

The URL `https://kaveri-tracker.netlify.app` stops serving immediately. Any installed PWAs on phones will keep working from cache until the user uninstalls them (see Method 1/2 above).

---

## Part 3 — Troubleshooting

**"Add to Home screen" missing in Chrome?** Update Chrome from the Play Store. Old versions don't support PWA install prompts.

**No `Network:` URL when you run `npm run dev`?** Make sure `server.host: true` is in `vite.config.ts` (it is). Restart `npm run dev`. Your laptop firewall may prompt — allow Node on private networks.

**Phone can't reach the URL?** Both devices must be on the same WiFi. Some routers isolate clients (guest network) — try your home WiFi, not a public one.

**Notifications don't mirror to the watch?** Three things must line up: (1) PWA installed, (2) notification permission granted in the Race tab, (3) Zepp app's notification mirroring enabled for Chrome. Test with the "Test cue" button in the Race tab — if the test cue appears on the watch, everything else will too.

**Installed app won't open offline?** Offline requires HTTPS (Path A2 or Path B). If you installed from plain `http://192.168.x.x`, you only got a bookmark shortcut — open `https://` (Path A2) or the Netlify URL (Path B), re-add to home screen, then test with airplane mode. If it still fails after HTTPS, clear the site's storage and re-install.

**Installed app opens blank / white screen when offline (works when the laptop is on)?** That's the service worker not being in charge on the phone. Diagnose from the app itself: **Settings → About → "Offline & service worker"** shows exactly which leg is broken (registered? controlling? caches?). The usual causes, in order:

1. **Your laptop's IP changed** since you ran `mkcert` — the certificate is tied to the old IP, Chrome treats the origin as insecure, and the service worker silently never registers. Fix: re-run `mkcert <new-ip>`, serve with the new files, open the `https://<new-ip>:5173` URL **once** on the phone (Chrome must see a valid cert + a live page so the SW installs), then tap **Re-register service worker** in Settings.
2. **You never re-opened the https:// URL after a rebuild.** Every new build installs a new service worker on the *next visit*. After `npm run build`, refresh the phone once while the laptop is reachable.
3. **Android cleared the site's storage** (storage pressure or "Clear storage"): Chrome evicts service worker caches without warning. Re-open the https:// URL, then Re-register in Settings.
4. **Cert warning accepted instead of trusted CA installed** (A2.2 not done on the phone): Chrome won't register the SW over a warning-only page. Install `rootCA.pem` (A2.2) properly.

After fixing, verify in the health card: registered ✓, controlling ✓, offline cache ready ✓ — then airplane mode will open the app. (You can also check `chrome://serviceworker-internals` on the phone.)

**Installed PWA opens to a blank screen?** Clear Chrome's cache for the site (Settings → Apps → Chrome → Storage → Clear), then re-add to home screen. If it still blanks, use the health card in Settings (above).

**Build failed?** Run `npm run build` again and read the error — it's usually a type error. `npx tsc -b --noEmit` gives the precise line.

**App shows old data after an update?** The service worker caches the old version. Hard-refresh in Chrome: clear the site's storage (Method 2 in Part 2), then re-open the URL. The new version will cache.

**Export/import won't restore?** The JSON file must be a valid backup from this app. If you edited it manually and it's malformed, import fails silently with a message. Re-export a fresh backup and try again.

---

## Part 4 — Update the app

### If you used Path A (dev WiFi)

The app updates **live** every time you save a file — Vite hot-reloads. Just keep `npm run dev` running. Refresh the app on your phone (pull down to refresh, or kill and re-open the icon).

### If you used Path B (Netlify)

1. Push changes to GitHub:
```bash
cd /home/harish-kumar-v/Documents/opencode_marathon/marathon-tracker
git add -A && git commit -m "describe the change" && git push
```
2. Netlify auto-rebuilds and deploys within 1–2 minutes
3. On your phone, the app will update **on next open** (the service worker checks for updates in the background). If it doesn't, hard-refresh (clear site storage, re-open).

---

## Part 5 — Enable Supabase cloud sync (optional, v2)

The app is structured so Supabase slots in without rewriting. All data access goes through a `Repository` interface; v1 uses `LocalRepo` (localStorage), v2 uses `SupabaseRepo` (cloud).

### Steps

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier)
2. **Run the schema**: open the SQL editor and paste the contents of `supabase/schema.sql`. This creates the `athletes`, `set_logs`, `run_logs`, `swim_logs`, `check_ins`, `journals`, `pain_logs`, `settings`, `shoes`, `sleep_logs`, `fuel_logs`, `retrospectives`, `recaps`, `form_checklists`, `substitutions`, `exercise_settings`, and `push_subscriptions` tables with row-level security.
3. **Install the Supabase client**:
   ```bash
   npm install @supabase/supabase-js
   ```
4. **Add env vars** — create `.env` in `marathon-tracker/`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. **Wire up the repo** — in `src/repo/SupabaseRepo.ts`, replace the `throw new Error` stubs with Supabase queries. The interface is already defined; each method maps to a table. Then flip the switch in `src/repo/index.ts`:
   ```ts
   const USE_SUPABASE = true  // was false
   ```
6. **(Optional) Web Push for background alarms** — deploy the Edge Function:
   ```bash
   supabase functions deploy push-reminder
   ```
   Set VAPID keys as function secrets. The stub at `supabase/functions/push-reminder/index.ts` shows the shape.

After step 5, all data syncs to the cloud and is shared across devices. The localStorage data stays as a fallback when offline.

---

## Quick reference — what's in the app

### Pages (bottom nav, 6 tabs)

- **Today** — current week, today's sessions with tick-marks + prescribed-vs-actual logging, morning check-in (RHR/sleep/weight/mood/soreness/motivation), daily journal, safety widgets, additive reminders
- **Plan** — 14-week timeline with volume bars, stage tags (Build/Deload/Peak/Taper/Race/Recovery), tap-to-explain stage meanings, day-by-day breakdown; Decision Gate calculator; Adaptive Week (missed-week rule); Weekly Recap; Step 2 (70.3 Goa) Block 0–4 timeline
- **Library** — all 30+ exercises with 4-layer visuals (custom SVG figures, SVG muscle maps, Commons photos, curated YouTube search links + paste-your-own), setup/execution/breathing/watch-for cues, regression/progression, "why it's in this plan"; guided flows (mobility, Primer A/B, daily shin); substitution library; form checklist per exercise
- **Race** — pacing band (4 segments), 9:1 run-walk alarm with screen wake-lock, gel-timing cues, kit checklist, race-week logistics, full fuel timeline, taper cockpit, race retrospective
- **Insights** — weekly volume vs plan (bar chart), aerobic efficiency trend, weight 4-week rolling avg with 74–76 kg band, RHR trend with 7-bpm alarm, sleep vs 7.5–8 h, shoe rotation with 600/800 km alerts, fuel log with "nothing new after Week 12" indicator
- **Settings** — weekly session times, plan anchor date, body weight, rest timer, dark mode (auto/light/dark), backup export/import, wipe all data

### Data backed up

Export (Settings → "Export backup") saves a JSON file containing:
- All gym set logs (weight/reps/RPE per exercise per session)
- All run logs (distance/pace/HR/cadence/splits/fuel/heat/notes)
- All swim logs (drills/200m milestone/notes)
- All morning check-ins (RHR/sleep/weight/mood/soreness/motivation)
- All daily journals
- All pain logs (location/intensity/type/traffic-light)
- All shoes (name/km/retired)
- All sleep logs (hours/quality)
- All fuel logs (brand/count/timing/tested)
- All race retrospectives
- All weekly recaps
- All form checklists
- All substitutions
- All exercise settings (custom video URLs, notes)
- All settings (session times, dark mode, etc.)

Import (Settings → "Import backup") restores all of the above on any device.

### Offline & PWA

- Installable on Android (Add to Home Screen) — opens standalone, full-screen
- Service worker caches the app shell + all data → works offline **over HTTPS only** (Path A2 local HTTPS or Path B Netlify — plain HTTP dev servers get a bookmark shortcut, not a real PWA)
- Custom app icon (running-figure motif)
- Dark mode (auto/light/dark)

### Amazfit T-Rex 3 Pro integration

- Pacing cues, 9:1 phase changes, gel timings, daily shin reminder, in-cab break, legs-elevated, weigh-in, green-light — all fire as Web Notifications
- Zepp app mirrors phone notifications to the watch (enable "Notification management" / "Read notifications" for Chrome)
- No native watch app needed — just notification mirroring

### Supabase-ready (v2)

- `Repository` interface abstracts all data access
- `LocalRepo` (localStorage) used in v1
- `SupabaseRepo` stub implements the same interface — fill in to enable cloud sync
- `supabase/schema.sql` — all tables + RLS ready to run
- `supabase/functions/push-reminder/` — Edge Function stub for Web Push
- Flip `USE_SUPABASE = true` in `src/repo/index.ts` to switch

---

## Tech

Vite + React + TypeScript + Tailwind CSS + vite-plugin-pwa + Zustand + Recharts + date-fns. No backend in v1. Netlify free hosting.
