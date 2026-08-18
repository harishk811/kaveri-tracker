# Kaveri Tracker — One-Shot Manual (Features · Replication · Bug Learnings)

> The complete handoff document for the marathon-tracker app: what exists, how to run it, how it is built, and every bug class we hit and how we fixed it. Written as a single dump — read it top to bottom once, then use the section index.

**App**: Two-step training tracker for the Kaveri Trail Marathon (22 Nov 2026) and Ironman 70.3 Goa (2027).
**Fidelity rule**: every pace, volume, gate and rule comes from `Two_Step_Plan_with_Exercise_Library.pdf` (the "document" / "PDF" referenced throughout).

---

## 1. Stack & structure

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript (strict) + Vite 8 |
| State | Zustand (`src/store/useStore.ts`) |
| Storage | localStorage only (`src/repo/LocalRepo.ts`) — Supabase-ready for v2 |
| Routing | react-router HashRouter (works from file:// and any static host) |
| Styling | Tailwind, dark mode via `.dark` on `<html>` |
| PWA | vite-plugin-pwa, generateSW, offline cache, manifest **shortcuts** (9:1 alarm, Today, Insights — hash-route deep links) |
| Tests | jsdom render smoke (`tests/render-smoke.mts`) + selector guard (`scripts/check-selectors.mjs`) |

```
src/
  App.tsx                  routes, reminder scheduler wiring, audio unlock
  main.tsx                 entry
  index.css                Tailwind + design tokens
  types/index.ts           all shared types (Session, Exercise, Settings, …)
  data/
    plan.ts                the 14-week plan (faithful PDF export) + zones/stages/gates/glossary
    exercises.ts           exercise library (43 movements) + library groups
    safety.ts              pain traffic light, green-light checks, calf gate, red flags
  repo/LocalRepo.ts        localStorage read/write + settings defaults
  store/useStore.ts        zustand store (logs, journals, settings, set logs, pain logs, runWalkTimer)
  lib/
    dates.ts               ISO date helpers, week math (anchor 2026-08-17)
    drafts.ts              crash-safe drafts (pagehide flush, debounced save)
    haptics.ts             Vibration API wrappers (guarded)
    sound.ts               WebAudio beeps: phase/gel/start/reminder cues + primeAudio
    reminders.ts           in-app reminder scheduler (6 reminders + cab rides)
    notifications.ts       Web Notifications presets (mirrors to Amazfit via Zepp)
    gamification.ts        streaks, week consistency, 16 achievements
    runWalkTimer.ts        9:1 alarm singleton (survives navigation)
    wakeLock.ts            screen wake lock for the timer
    export.ts              CSV export
  components/              SessionCard, RunLogger, SwimLogger, StrengthLogger, MorningCheckIn,
                           DailyJournal, DailyGoals, InCabWidget, TodayRecoveryFlows,
                           SafetyWidgets, AdditiveWidgets, DateNav, RunWalkIndicator, …
  pages/                   Today, Schedule, Exercises, Recovery, Insights (incl. Race tab), Settings
```

---

## 2. Replication — run / build / test / install

### Prerequisites
- Node 20+ (`node -v`), npm.
- The PDF is not needed to run the app (data is embedded in `src/data/`).

### Commands (from `marathon-tracker/`)

| Command | What it does |
|---|---|
| `npm install` | Install deps |
| `npm run dev` | Dev server with local preview |
| `npm run build` | `tsc -b` + `vite build` → `dist/` (PWA assets + sw.js) |
| `npm run check:selectors` | Guard: no fresh-object patterns in selectors (FormChecklist reset bug class) |
| `npm run check:smoke` | jsdom end-to-end render smoke (52 checks) — see §5 |
| `npm run check:all` | selectors → smoke → build. **Run before any release.** |

### Installing on the phone (3 paths — INSTALL.md has the full guide)

- **Path A — dev preview only**: `npm run dev` + phone on same WiFi. No offline, no real PWA.
- **Path A2 — local HTTPS (recommended for offline testing)**: `npm run build` → `npm run preview -- --port 5173` (HTTPS via `preview.https` in `vite.config.ts`; mkcert CA installed on the phone) → "Install app" works offline. Do **not** use `npx serve` — its `Content-Disposition: inline` header silently kills service-worker installs on some Android Chrome versions (registered ✓, controlling ✗, 0 caches, registration dropped on each visit; bug #25).
- **Path B — permanent**: deploy `dist/` to Netlify (or any HTTPS static host). Offline + notifications need HTTPS.

### Why HTTPS matters (learned the hard way)
Offline PWA install and the Notification API both require a secure context.
Dev-over-HTTP silently disables them — that is why `vite.config.ts` has `devOptions.enabled: false`.

---

## 3. Data model (localStorage keys)

All keys are prefixed `mt.`:

| Key | Shape |
|---|---|
| `mt.runLogs` | `Record<sessionId, RunLog>` |
| `mt.swimLogs` | `Record<sessionId, SwimLog>` |
| `mt.setLogs` | `Record<sessionId, SetLog[]>` (strength sets) |
| `mt.checkIns` | `Record<date, MorningCheckIn>` |
| `mt.journals` | `Record<key, DailyJournal>` — keys: `<date>`, `done:<sessionId>`, `shin:<date>` (JSON `{ticks}`), `greenlight:<date>`, `session:<sessionId>`, `cab:<date>` (JSON `{ticks}`) |
| `mt.painLogs` | `PainLogEntry[]` |
| `mt.settings` | `Settings` (see below) |
| `mt.shoes`, `mt.substitutions`, `mt.exerciseSettings` | round-2 data |
| `mt.onboardingDone` | `"true"` |
| `mt.draft.<key>` | crash-safe drafts (run/swim/checkin/journal/shin) — saved logs always win and retire the draft |

### Settings (defaults in `LocalRepo.DEFAULT_SETTINGS`)
`startDate` (fixed 2026-08-17, disabled in UI) · `sessionTimes` (per-day AM/PM) · `darkMode` · `notificationsEnabled` · `restTimerSec` · `bodyWeightKg` · `remindersEnabled` · `weatherEnabled` · `reminders {shin 06:30, legs 20:00, weighIn 07:00, greenLight 19:00, session 18:30, sessionEnabled}` · `soundEnabled` · `cab {enabled, go 08:30, ret 18:30}` · `marathonBand?`.

**`getSettings` deep-merges nested defaults** — old stored settings (missing new fields) get defaults automatically; a shallow spread would silently disable reminders.

---

## 4. Feature inventory (complete)

### 4.1 Today page (home)
- Header: long date, `Week N · Day`, stage badges, week volume/long-run, block progress ring (`week/14`), next key-date countdown chip (10K race → decision gate → marathon, computed from anchor).
- Date navigation (`DateNav`): log/edit any day in the 14-week window; future-day hint; backfill works.
- Gamification strip: streak (run OR check-in per day, today may be pending) + `X/7 days` logged this week bar.
- **Recovery checks · due today** (`TodayRecoveryFlows`) — the document's recovery schedule, surfaced by day:
  - Pain quick-log (every day): 🟢/🟡/🔴 one-tap → `putPainLog` + notification + haptic.
  - Mobility · 10 min (Mon & Wed — PDF §07: hip flexors, calves, T-spine, glutes).
  - 10-min easy walk (before quality/long runs — PDF §07).
  - Sunday green-light checklist (Sundays only) → Recovery tab.
  - Calf-raise gate (from Week 6 — PDF §05: 25+25, ≤2 reps apart) → Recovery tab.
  - Daily shin routine → the Daily goals card below.
  (The primer warm-up is NOT here — it belongs to each strength session, so it
  lives inside the session card. Recovery checks only hold due-today hooks.)
- **Daily goals · 6 min** (`DailyGoals`): exactly the PDF's five movements with the document's doses (Tibialis 2×25 · calf 2×15/side · short-foot 2×10 · toe yoga 10 each way · ankle circles 1×). **Interactive like the cab widget**: tap a movement to expand its form and watch-fors, tick each one off, or run the guided flow. Per-date ticks (`shin:<date>`), draft-protected, reminder button. (Spine extras were removed — the PDF schedules mobility separately, Mon/Wed.)
- **In cab?** (`InCabWidget`): switch bound to `settings.cab.enabled`; flip on → the three cab exercises (Ankle Pumps 20 · Toe Circles 15 each way · Seated Heel Raises 10, 3 s lower) drop open with per-ride ticks (`cab:<date>`), edit-times link, test-nudge button.
- **9:1 quick-start** on any 9:1 session card (Sunday long runs): "Start 9:1" / "Stop" + live RUN/WALK · mm:ss · cycle — same app-wide alarm as race day, so the cue mirrors to the watch on long runs too.
- **Missed & catch-up**: last-3-days log scan — sessions you skipped earlier in the week surface as catch-up chips (with a day/kind hint), so a missed Wednesday isn't a dead entry.
- Sessions: `SessionCard` per planned session — prescribed details, "why today", done-ticks for walk/rest/mobility (with haptic), run logger (pace auto-calc, RPE, deviations, planned-pace ghost), swim logger, strength set-by-set logger (RPE, deviation flags, notes). **Strength cards carry their primer warm-up inside** (🔥 Primer warm-up · 6/4 min with move list, "Mark primer done" tick at `primer:<sessionId>`, and "▶ Run guided flow" deep-linking the flow). **The strength logger groups its exercises by document block** (`1 · Warm-up · Primer`, `2 · Main lifts`, `3 · Shin insurance` …) with a live `done/total sets` counter per block — the warm-up reads as a warm-up, the work as work.
- **Next week at a glance** — at the *bottom* of the page, just before the journal (it previews tomorrow; it doesn't gate the day): Week N banner, volume km, long-run km, key-session chips, focus text.
- Daily journal (per date, draft-protected).

### 4.2 Recovery tab (`/recovery`)
- Header + DateNav (backfill check-ins).
- Morning check-in: time-aware greeting, 7-day dot trail, RHR (baseline), sleep (target 7.5–8 h), weight (band 74–76 kg, Sundays only), mood/soreness/motivation, note. Draft-protected.
- **Cab ask prompt** (Tue–Thu, until `cab.enabled`): "You're in a cab today — set going & return times" → Settings.
- Safety widgets (today only): pain traffic light (full logger + reference + stress-fracture red flags), Sunday green-light checklist (8 checks → journal + notify), shin routine + calf gate, five named injuries.
- Additive widgets (today only): legs-elevated, etc.
- Non-today: hint card (widgets reflect live state).

### 4.3 Schedule tab
- 14 weeks, per-week sessions, stage tags, volume/long-run bars, Step-2 (70.3) blocks, adaptive-week + weekly-recap coach tools.
- Each week is a dropdown; the **weekly recap card lives inside its own week's expanded section** ("Weekly recap · Week N"), not at the top of the page.
- **Adaptive week** is collapsed to a single card — tap "Adaptive week — missed-week rule" to open the inputs + rejoin suggestion. No page real estate when unused.
- **Decision gate (band gating)**: the five marathon bands are **hidden until their time arrives** — locked card before 19 Sep ("the 10K clock decides"), only the band your 10K time points at between 19–27 Sep, and only the band your half time confirms after 27 Sep. Times auto-fill from the logged 10K/half races (`w5d5s1` / `w6d6s1`); `findBand`/`GATE_BANDS` in plan.ts.

### 4.4 Exercise library
- Search + session filter chips: All · Strength A · Strength B · Strength C · Daily shin · Mobility · In-cab · Warm-up.
- Grouped like the document: `Strength A — Lower, Posterior & Shin · Tuesday` etc., each block a **collapsible section** (1 · Primer, 2 · Main lifts, 3 · Shin insurance …) — no repeated "Strength X" fragments.
- Guided flows: Mobility · 10 min, Primer A · 6 min, Primer B · 4 min, Daily shin · 6 min (play-through with timers + SVG figures). Play runs a **live countdown** (deadline-based, no drift), a progress bar, and a "Next up" preview; deep-linkable via `?flow=`.
- Full ExerciseCard reference (setup/execution/breathing/watch-for, regression/progression, prescribed, YouTube link, custom video URL).
- Substitution library — its own **always-visible search box** ("Can't do an exercise?" card); results appear only after typing. **Two-way map**: searching an exercise returns its approved alternatives, searching an alternative says what it replaces. Alternatives that exist in the library resolve to the real exercise (name + "in library" tag) and save by real id; saved swaps are listed with a remove button.

### 4.5 Insights (incl. Race tab)
- Stats (distance, paces, compliance), **16 achievements** (first-run, streak-7, perfect-week, km-100/300/500 clubs, long-run ≥18 km, half-in-training ≥21.1 km, checkin-14/30, gate-pass, shin-week, pain-free-7, under-6:00/km, first-swim, in-band) — all computed from what is actually logged, gel testing tracker, race retrospective.
- **Weekly volume chart with a view toggle**: "All weeks" (14-week overlay bars — teal logged km on top of grey planned volume, orange long-run line, "now" marker, summary row: km logged so far / planned to date / consistency % green ≥80) ↔ **"This week"** (the current week day-by-day: planned vs logged km per weekday with the planned long run marked, today's bars highlighted with a "today" reference line, and week-specific summary chips).
- **Block scoreboard**: total km logged · longest run · runs logged · check-ins · pain-free streak · shin-routine streak.
- **Consistency heatmap**: all 14 weeks as cells shaded by days logged (grey 0 → teal 7), with week number + stage on hover.
- **Strain meter (ACWR)**: acute load = last 7 days (incl. today), chronic = the 28 days *before* today (a single run on day one reads "No load yet", not "Spike risk"); zones blue <0.8 · green 0.8–1.3 · amber ≤1.5 · red >1.5 with a zone bar.
- **Cadence trend**: avg cadence per logged run (last 12), 172/178 reference lines; empty state tells you to log cadence (spm) on ≥2 runs.
- **Pain tab**: pain log over time — severity chips (entries / amber / red), intensity line chart with amber=4 and red=7 lines, latest entries list.
- **Race tab** (`RaceCockpit`): pacing band (PDF §11), fuelling phases, **9:1 timer** (see 4.7), gel timing buttons (notification + sound + haptic), kit checklist, logistics, fuelling plan, race-week notes. The notification banner explains every failure mode (unsupported browser / non-HTTPS origin / previously blocked with re-check) so the Allow button never silently does nothing.

### 4.6 Settings
- Weekly session times (AM/PM per day) — reminders fire at these where relevant.
- Plan anchor (read-only, PDF-faithful) · body weight · default rest timer.
- Appearance (auto/light/dark).
- **Reminders & alerts**: master switch; editable times + Test buttons for shin routine, legs elevated, Sunday weigh-in, green-light, today's sessions; **cab windows** (going/return times + enable + test); **sound alerts** switch.
- Backup & restore: JSON export/import + **CSV export** (runs · check-ins · journal) and **CSV import** (auto-detects JSON vs CSV; sectioned `RUNS` / `CHECK-INS` / `JOURNAL` blocks with header rows skipped; cadence column round-trips).
- **PWA health card** (About): live service-worker state — registered? controlling? offline caches present? — with one-tap **Re-register service worker** and reload. Makes "blank screen offline" diagnosable from the phone instead of a white page.
- Danger zone (wipe) · About.

### 4.7 The 9:1 run-walk alarm (race day + long runs)
- Module singleton (`lib/runWalkTimer.ts`) + store state → survives navigation.
- RUN 9 min / WALK 1 min; cycle counter; app-wide pill (`RunWalkIndicator`).
- Every phase change: phone notification (mirrors to watch), **audio cue** (rising double beep = run, low beep = walk), vibration.
- Screen wake lock while running. Start cue + haptic on start.
- **Quick-start on 9:1 session cards** (Sunday long runs) — one tap starts the same alarm; no need to open the Race tab.

### 4.8 Reminder scheduler (`lib/reminders.ts`)
- Arms on app launch and on every settings change (App.tsx effect).
- 6 entries: shin (daily), legs (daily), weigh-in (Sun), green-light (Sun), **today's sessions** (daily, lists the day's plan titles), **in-cab ×2** (Tue–Thu at `cab.go` and `cab.ret`).
- Each fire: notification + reminder chime + haptic. Audio unlocked by the first user gesture (`primeAudio` on pointerdown/touchstart).
- `fireReminderNow(id)` for Settings test buttons.
- **Honest limitation**: cues only fire while the app is open (no push server — see INSTALL.md).

### 4.9 Crash safety (drafts)
- RunLogger, SwimLogger, MorningCheckIn, DailyJournal, DailyGoals: debounced draft to `mt.draft.<key>`, flushed on `pagehide`/`visibilitychange:hidden`, restored on mount, retired when a real log exists. This fixed the Android background-tab data-loss bug.

### 4.10 Gamification
- Streak = days with a run log OR check-in (today pending allowed); week consistency = logged days in the current Mon–Sun week. Achievements from `lib/gamification.ts` (16 — see 4.5). Newer achievements read pain logs (pain-free streak), `shin:<date>` journals (shin-week), all swim logs (`loadSwimLogsAll`), and weigh-ins (in-band); the Insights page loads those ranges on mount.

---

## 5. Test harness notes

- `tests/render-smoke.mts`: frozen clock `2026-08-17T06:30:00` (Week 1 Monday), real app mounted headlessly (jsdom) with the same localStorage repo. 52 checks: onboarding → Today (flows, chip, goals, in-cab toggle, pain quick-log, next-week-at-a-glance) → backfill navigation → 9:1 quick-start from the Sunday long-run card + timer → reminders arm/test → every route renders (Insights: toggle, scoreboard, heatmap, achievements, strain meter, cadence, pain tab; Exercises: substitution search + reverse mapping + saved swaps) → CSV import round-trip → zero runtime errors.
- jsdom lacks `Notification`, `AudioContext`, `navigator.vibrate` → all three libraries must be guarded no-ops (they are).
- **Case-sensitivity**: DOM assertions must match rendered text exactly (`Ankle Pumps` ≠ `Ankle pumps`) — this burned a check.
- esbuild bundles from the file's location, not CWD: debug files must live in `tests/` so `../src` resolves.

---

## 6. Bug learnings (what broke, why, the rule)

| # | Bug | Root cause | Fix / rule |
|---|---|---|---|
| 1 | FormChecklist ticks reset on every keystroke | zustand selectors returning fresh arrays/objects (`.map(...)`) create new identities each render | Memoize merged data (`mergedByCategory` useMemo); never construct new objects inside selectors. Guarded by `check:selectors`. |
| 2 | Reminders silently dead for existing users | `getSettings` shallow-spread; older stored `settings.reminders` lacked new fields | **Deep-merge nested defaults** in `getSettings`. Rule: nested settings objects always merge field-by-field. |
| 3 | `prescribedDrills` vanished in a refactor (TS2304) | Drills derivation deleted while duplicating a sibling line; interface declared after use (TS hoists interfaces, so only the runtime const broke) | Re-added the `useMemo`. Rule: run `tsc -b` after any refactor; `check:all` before release. |
| 4 | "settings used before initialization" crash on Insights | Selector reading `settings` before the `useStore` call in the component body | Reorder selector above usage. Rule: all store reads happen at the top of the component. |
| 5 | Unused param / dead vars fail the build | `noUnusedLocals` with a leftover `i` in a `.map`, dead `step`/`isToday` | Removed. Rule: strict TS is the linter — the build is the gate. |
| 6 | Copy bug: "Today's journal" shown on past days | Hardcoded label | Label = `Journal · {formatLongDate(date)}`. Rule: never hardcode day-sensitive strings. |
| 7 | 9:1 timer died on navigation | Timer was component state inside RacePage | Module-level singleton + store state + app-wide pill. Rule: anything that must survive navigation lives outside the component tree. |
| 8 | Data lost when Android killed the background tab | Uncommitted form state | Draft system with `pagehide`/`visibilitychange` flush; saved log always wins. |
| 9 | PWA offline silently broken over HTTP | Service workers require secure contexts; dev server previews aren't HTTPS | `devOptions.enabled: false`; documented mkcert + Netlify paths (INSTALL.md). |
| 10 | `secsLeft === 539` flake in tests | Timer asserts are timing-dependent | Assert against the frozen-clock value with a fixed sleep (1.1 s → 539). |
| 11 | Smoke check false failure on in-cab | Assertion text case mismatch (`Ankle pumps` vs rendered `Ankle Pumps`) | Assert against real `ex.name` values. Rule: verify rendered casing, don't assume. |
| 12 | Debug scripts can't resolve `../src` from `node_modules/.tmp` | esbuild resolves relative imports from the **entry file's directory** | Keep one-off debug files under `tests/`. |
| 13 | Notification/Audio/vibration crashed headless tests | Unguarded browser APIs in jsdom | All three libs are try/catch + capability-guarded no-ops. |
| 14 | Duplicate `prescribedDrills` const (build error) | Copy-paste drift in SwimLogger | Cleaned to a single source. Rule: check for duplicated symbols in grep before editing. |
| 15 | Primer warm-up dumped into "Recovery checks" | Recovery flows held *all* due items, mixing session-owned prep with recovery hooks | Primer moved inside the strength `SessionCard` (block + done-tick + deep-linked guided flow). Rule: recovery cards only hold recovery; session-owned prep lives in the session. |
| 16 | Strength logger listed warm-up flat with main lifts | All exercises rendered as one undifferentiated list | Grouped by document blocks (`1 · Warm-up · Primer`, `2 · Main lifts` …) with per-block `done/total` progress. Rule: anything that is a sequence should look like a sequence. |
| 17 | All five marathon bands shown from August | Users were planning a band before the body had agreed (PDF §02's whole point) | Bands locked until 19 Sep 10K; only the pointed/confirmed band shows after each milestone. Rule: don't show the answer before the evidence exists. |
| 18 | `showBand` unused (TS6133) | Leftover helper after gating the render by stage | Removed. Rule: the build is the linter — `check:all` catches it. |
| 19 | Controlled search input ignored in jsdom smoke | React's value tracker bypassed by plain `input.value =` | Dispatch through the native `HTMLInputElement.prototype.value` setter, then fire `input`. Rule: drive controlled inputs with the prototype setter in tests. |
| 20 | Substitution search bar vanished | "Don't show results until typing" was over-applied to the *input itself* | The search box is always visible; only the **results** hide until typing. Rule: hide results, never the affordance that produces them. |
| 21 | "Allow notifications" button did nothing | Chrome silently resolves `requestPermission()` to `denied` (insecure origin, or a remembered Deny) — the banner showed one "Allow" button for every failure mode | Banner now distinguishes: unsupported browser / needs HTTPS / blocked (with re-check) / askable. Rule: every failure mode must say *why* and what to do next. |
| 22 | CSV import wrote bogus rows | Header rows parsed as data, and the destructure assumed export column order | Skip rows whose first cell is `date`; destructure in export column order (cadence before rpe). Rule: round-trip your own export format in the smoke test. |
| 23 | Strain meter showed "Spike risk" after one run | Chronic window included today, so one run equalled acute AND chronic | Chronic = the 28 days *before* today. Rule: baselines exclude the sample being compared. |
| 24 | Installed PWA blank offline (Path A2) | Service worker not registered/controlling on the phone (cert tied to a stale IP, or storage evicted) — a silent white page | `PwaHealthCard` (Settings → About) shows registered/controlling/caches live with one-tap re-register; offline strip; INSTALL.md diagnosis flow. Rule: silent failures get a visible self-diagnosis surface. |
| 25 | SW registered but never controlling, 0 caches, registration deleted on every visit | `npx serve` sends `Content-Disposition: inline` on all responses; some Android Chrome versions reject that on service-worker scripts, so the SW script fails to evaluate — install dies before precache (no `workbox-*.js` / precache fetches ever hit the server) | Serve with `npm run preview` (vite preview over `preview.https`) — clean headers, `index.html` served directly with no 301 chain. Rule: verify served headers (`curl -skI`), not just status codes, before debugging a phone. |
| 26 | Path A2 SW install fails on Android Chrome with "An SSL certificate error occurred when fetching the script" — even a 5-line test SW with zero imports | Android Chrome runs service-worker script fetches through stricter certificate validation (Certificate Transparency) that ignores user-installed CAs; mkcert's CA is user-installed on Android, so page loads trust it but SW scripts never will. Proved with an A/B test (`/sw-min.js` downloaded 200, install rejected, no install-time fetches ever hit the server) | On Android, Path A2 is unusable for offline PWA — use Path B (Netlify, public cert). Desktop Chrome and Firefox Android work. Rule: when a platform says "SSL cert error" despite a trusted page, the cert is only half-trusted — test with a minimal SW before blaming your server. |

---

## 8. Suggested improvements (next rounds)

Ranked by user value vs effort:

1. **Push notifications (real)** — reminders currently fire only while the app is open. A free tier (ntfy.sh / FCM) + service worker would make the shin/cab/gel cues genuinely background-safe. Biggest honesty gap left.
2. **Watch companion** — the race-day 9:1 cues and gel timers currently mirror to the Amazfit only as phone notifications; a Zepp-miniapp (or WearOS complication) would put the band on the wrist.
3. **Race-day GPS pacing overlay** — live pace vs the band (4:55–5:10 / the saved gate band) on the Race tab with a 200 m GPS update; auto-advance the 9:1 phase on actual run/walk segments.
4. **Weekly recap export card** — a shareable image (volume bars + streaks + pain log) posted to Strava/WhatsApp; CSV export already exists, this makes the story visual.
5. **Supabase sync** — the store is already repo-shaped (`mt.*` localStorage keys); a sync adapter would give multi-device + backup for the PWA without a server redesign.
6. **Injury heatmap** — pain-log entries (location + intensity) plotted over the 14-week timeline to spot build-up patterns before the red flags.
7. **In-cab auto-nudge** — use the phone's own travel detection (Activity Recognition) to trigger the cab exercises when a ride actually starts, instead of clock times.
8. **Shoes module** — mileage per shoe pair with a 500 km retirement warning (plan already rotates shoes; the tracker doesn't count yet).
9. **10K/half result cards** — after 19 Sep / 27 Sep, a celebratory race-result card on Today (time, band unlocked, what changed in October) — the band gating above is the data foundation for it.
10. **Taper & race-week checklist on Today** — the kit/fuel/logistics lists live in the Race tab; surfacing the day's items on Today during race week removes the last "where do I look?" question.

---

## 7. Cross-cutting rules (the architecture contract)

1. **Plan fidelity**: no session, pace, gate or rule that isn't in the PDF. Changing `startDate` is disabled because everything (weeks, dates, gates) is anchored to it.
2. **No fresh objects from selectors** (bug #1) — always memoize derived data.
3. **Guards everywhere for browser APIs** — notifications, audio, vibration, wake lock are no-op-safe.
4. **Drafts for every form** — logs retire drafts; drafts survive tab kills.
5. **Singleton for anything app-wide** (9:1 timer, reminders).
6. **`npm run check:all` before every release** — selectors + smoke (43) + tsc + build.
7. **Documented honesty**: in-app reminders need the app open; offline needs HTTPS. Never claim otherwise.