# Kaveri → 70.3 Goa Tracker

A two-step training tracker PWA for the **Kaveri Trail Marathon (22 Nov 2026)** and **Ironman 70.3 Goa (2027)**. The training plan is faithful to the Two-Step Plan PDF — every pace, volume, gate, and rule preserved. The app adds tracking, prescribed-vs-actual logging, decision support, and race-day tools.

## Quick start

```bash
cd marathon-tracker
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Deploy to Netlify (free)

1. Push this folder to a GitHub repo (or drag-drop `dist/` onto Netlify).
2. If git-connecting: build command `npm run build`, publish directory `dist`.
3. The PWA is installable on Android (Add to Home Screen) and works offline.

## Features

### Round 1 (this build)

- **Today** — current week, today's sessions with tick-marks, prescribed vs actual logging, morning check-in (RHR/sleep/weight/mood/soreness/motivation), daily journal
- **Schedule** — 14-week timeline with volume bars, stage tags (Build/Deload/Peak/Taper/Race/Recovery), tap-to-explain stage meanings, day-by-day breakdown; Step 2 (70.3 Goa) Block 0–4 timeline
- **Exercise library** — all 30+ movements with 4 visual layers: custom SVG start/finish figures (grey→teal), SVG muscle-activation maps, Wikimedia Commons photos where available, and curated YouTube search links scoped to trusted coaching channels + paste-your-own-URL
- **Race cockpit** — pacing band (4 segments with paces, HR ceilings, cumulative times), interactive 9:1 run-walk alarm with screen wake-lock, gel-timing cues, race-kit checklist, race-week logistics, full fuel timeline
- **Amazfit T-Rex 3 Pro notifications** — pacing cues, 9:1 phase changes, and gel timings fire as Web Notifications that mirror to the watch via the Zepp companion app
- **Education layer** — tap-to-explain glossary (40+ terms across zones, sessions, strength, shin, gate, fuelling, recovery, swim, Step 2), "why this session today" explainers, first-run onboarding
- **Prescribed vs actual** — every set (weight/reps/RPE), run (distance/pace/HR/cadence), and swim (drills/200 m milestone) — deviations auto-flagged amber with a reason field
- **Custom session times** — set AM/PM times per day-of-week; reminders fire at your times
- **Strong/Hevy-style set logger** — set-by-set with rest timer, RPE, previous best, superset pairing, deviation notes
- **Backup & restore** — JSON export/import for cross-device sync (phone → laptop)
- **PWA** — installable, offline-capable, custom icon, dark mode

### Round 2 (also built)

- **Decision Gate calculator** — punch in 19 Sep 10K + 27 Sep half times → outputs the marathon band, run-segment pace, and exact October adjustments (Schedule → Decision support)
- **Safety widgets** — pain traffic light (tap level + location → green/amber/red action), stress-fracture red-flag card, Sunday 8-check green-light checklist (auto-suggests 30% cut if 2+ fail), daily 6-min shin routine with tick tracker, calf-raise capacity gate at Week 6 (logs L vs R asymmetry)
- **Insights page** — weekly volume vs plan (bar chart), aerobic efficiency trend (pace @ fixed HR), weight 4-week rolling avg with 74–76 kg band, RHR trend with 7-bpm alarm, sleep vs 7.5–8 h target, shoe rotation tracker with 600/800 km replacement alerts, fuel log with "nothing new after Week 12" indicator
- **7 additive widgets with alarms** — daily shin routine, in-cab movement break (Tue–Thu), pre-run warm-up walk, PM legs-elevated, Sunday weigh-in, Sunday green-light, heat/humidity on long runs (Today → Safety & recovery)
- **Guided mobility & primer flows** — interactive play-through sequences with timers + SVG figures for mobility (10 min), Strength A primer (6 min), Strength B primer (4 min), daily shin (6 min) (Library → Guided flows)
- **Taper cockpit** — Weeks 13–14 checklist, what taper feels like, stress-fracture warning (Race → Taper)
- **Race retrospective** — guided post-race reflection after 19 Sep, 27 Sep, 22 Nov; the 27 Sep half feeds the decision gate (Race → Retro)
- **Weekly recap** — Sunday plain-text summary auto-generated from logged data; copy-to-send-to-coach (Schedule → Decision support)
- **Adaptive week** — missed-week rule (Rule 10): mark a week partially done → get rejoin suggestion without panic catch-up (Schedule → Decision support)
- **Form checklist** — pre-set form cues per exercise; tick before loading (Library → exercise card)
- **Substitution library** — approved exercise swaps for when an exercise can't be done (Library → Can't do an exercise?)

## Enable Supabase (v2 cloud sync)

The app is structured so Supabase slots in without rewriting. All data access goes through a `Repository` interface; v1 uses `LocalRepo` (localStorage), v2 uses `SupabaseRepo` (cloud).

### Steps

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. **Run the schema**: open the SQL editor and paste the contents of `supabase/schema.sql`. This creates the `athletes`, `set_logs`, `run_logs`, `swim_logs`, `check_ins`, `journals`, `pain_logs`, `settings`, and `push_subscriptions` tables with row-level security.
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

## Project structure

```
marathon-tracker/
├─ src/
│  ├─ data/        # plan.ts (14 weeks), exercises.ts (30+), zones, gates, glossary, step2, fuelling
│  ├─ repo/        # Repository interface, LocalRepo (v1), SupabaseRepo (v2 stub)
│  ├─ store/       # Zustand store (thin reactive layer over repo)
│  ├─ components/  # BottomNav, SessionCard, SetRow, ExerciseCard, Timer, ZoneBadge, ProgressRing, Term, StageBadge, ExerciseFigure (SVG figures + muscle maps), RunLogger, SwimLogger, StrengthLogger, MorningCheckIn, DailyJournal, Onboarding
│  ├─ pages/       # Today, Schedule, Exercises, Race, Settings
│  ├─ lib/         # dates, notifications, wakeLock, youtube
│  └─ types/       # all domain types
├─ supabase/       # schema.sql + Edge Function stub
└─ public/         # PWA icons, manifest
```

## Notes

- The training plan is byte-for-byte faithful to the PDF. The app only presents and tracks it; it never second-guesses the coaching.
- All data stays in your browser in v1. Export to JSON for backup or moving to another device.
- Notifications mirror to the Amazfit T-Rex 3 Pro via the Zepp app's notification mirroring — no native watch app needed. Enable notification mirroring for the browser/PWA in Zepp settings.
- The 9:1 alarm uses a screen wake-lock so the timer does not sleep while the phone is in your pocket on race day.
- Before Week 1 begins: confirm with a doctor that this training load is appropriate. Everything in this plan assumes clearance has been given.

## Tech

Vite + React + TypeScript + Tailwind CSS + vite-plugin-pwa + Zustand + Recharts + framer-motion + date-fns. No backend in v1. Netlify free hosting.
