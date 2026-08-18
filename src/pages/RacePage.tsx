import { useState } from 'react'
import { PACING_BAND, RACE_KIT_CHECKLIST, RACE_WEEK_LOGISTICS, RACE_DAY_FUEL } from '@/data/plan'
import { formatDuration } from '@/lib/dates'
import { notifyPacingCue, notifyGelTime, requestNotificationPermission, notificationPermission, notificationsSupported } from '@/lib/notifications'
import { startRunWalkTimer, stopRunWalkTimer } from '@/lib/runWalkTimer'
import { playGelCue } from '@/lib/sound'
import { hapticTick } from '@/lib/haptics'
import { useStore } from '@/store/useStore'
import { RaceRetrospectiveForm } from '@/components/CoachTools'

// ─────────────────────────────────────────────────────────────────────────────
// RacePage — race-day cockpit: pacing band, 9:1 alarm, kit checklist,
// race-week logistics, fuel timeline, taper mode, retrospective, and
// Amazfit-mirroring notifications. The cockpit is embedded in the Insights
// Race tab; RacePage is the standalone shell for direct visits.
// ─────────────────────────────────────────────────────────────────────────────

export const RacePage: React.FC = () => (
  <div className="p-4 pt-safe-top space-y-4">
    <RaceCockpit />
  </div>
)

// Notification request can only succeed inside a real user gesture AND a
// secure context (HTTPS or localhost) AND a "default" permission state.
// Chrome silently resolves "denied" — never re-prompts — so the plain button
// used to look like it "did nothing".
const secureContext = (): boolean =>
  typeof window !== 'undefined' && typeof window.isSecureContext === 'boolean' && window.isSecureContext

export const RaceCockpit: React.FC = () => {
  const [perm, setPerm] = useState<NotificationPermission>(notificationPermission())
  const [tab, setTab] = useState<'pacing' | 'alarm' | 'kit' | 'fuel' | 'taper' | 'retro'>('pacing')
  const [testFired, setTestFired] = useState(false)

  const askPermission = async () => {
    const p = await requestNotificationPermission()
    setPerm(p)
  }

  const fireTest = () => {
    notifyPacingCue('0–10 km', '7:05–7:15/km', '155 bpm')
    setTestFired(true)
    setTimeout(() => setTestFired(false), 3000)
  }

  const banner = (() => {
    if (!notificationsSupported()) {
      return {
        title: 'Notifications not supported here',
        body: 'This browser does not expose the Notification API. Use Chrome, Edge, or Samsung Internet, ideally as an installed PWA.',
        cta: null as React.ReactNode,
      }
    }
    if (!secureContext()) {
      return {
        title: 'Notifications need HTTPS',
        body: 'Browsers only allow notification permission on a secure origin. Serve this app over HTTPS (or use localhost / the installed PWA) and reload, then allow here.',
        cta: null as React.ReactNode,
      }
    }
    if (perm === 'denied') {
      return {
        title: 'Notifications are blocked',
        body: 'Your browser remembered a "Deny". Clicking Allow again does nothing — open the site-settings (the lock/globe icon in the address bar), set Notifications to Allow or Ask, then reload and tap Allow here.',
        cta: <button className="btn-secondary text-xs" onClick={() => setPerm(notificationPermission())}>Re-check permission</button>,
      }
    }
    return {
      title: 'Enable watch notifications',
      body: 'Allow notifications so pacing cues, the 9:1 alarm, and gel timings mirror to your Amazfit T-Rex 3 Pro via the Zepp app.',
      cta: (
        <button className="btn-primary mt-2 text-xs" onClick={askPermission}>
          Allow notifications
        </button>
      ),
    }
  })()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="text-xs text-brand-100 uppercase tracking-wide">Race day · 22 Nov 2026</div>
        <div className="text-xl font-bold mt-0.5">Kaveri Trail Marathon</div>
        <div className="text-xs text-brand-100 mt-1">6:15 a.m. start · 6-hour cutoff · canal bund, Srirangapatna</div>
      </div>

      {/* Notification permission banner — every failure mode says why, so the
          button never silently "does nothing" */}
      {perm !== 'granted' && (
        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⌚</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {banner.title}
              </div>
              <div className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
                {banner.body}
              </div>
              {banner.cta}
            </div>
          </div>
        </div>
      )}

      {perm === 'granted' && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-200">✓ Notifications enabled</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pacing cues will mirror to your watch. In Zepp: enable notification mirroring for this PWA.
              </div>
            </div>
            <button className="btn-secondary text-xs" onClick={fireTest}>
              {testFired ? '✓ Sent' : 'Test cue'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-2">
        <div className="grid grid-cols-6 gap-1">
          <TabBtn active={tab === 'pacing'} onClick={() => setTab('pacing')}>Pacing</TabBtn>
          <TabBtn active={tab === 'alarm'} onClick={() => setTab('alarm')}>9:1</TabBtn>
          <TabBtn active={tab === 'kit'} onClick={() => setTab('kit')}>Kit</TabBtn>
          <TabBtn active={tab === 'fuel'} onClick={() => setTab('fuel')}>Fuel</TabBtn>
          <TabBtn active={tab === 'taper'} onClick={() => setTab('taper')}>Taper</TabBtn>
          <TabBtn active={tab === 'retro'} onClick={() => setTab('retro')}>Retro</TabBtn>
        </div>
      </div>

      {tab === 'pacing' && <PacingBand />}
      {tab === 'alarm' && <RunWalk9to1 />}
      {tab === 'kit' && <KitAndLogistics />}
      {tab === 'fuel' && <FuelTimeline />}
      {tab === 'taper' && <TaperCockpit />}
      {tab === 'retro' && <RetrospectiveSection />}
    </div>
  )
}

// ── Pacing band ───────────────────────────────────────────────────────────────

const PacingBand: React.FC = () => (
  <div className="space-y-2">
    <div className="card">
      <div className="text-sm font-semibold mb-1">Pacing band</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Working band 4:55–5:10. The decision gate replaces this on 27 September. Run 9:1 from km 1 — set the interval alarm and obey it even when it feels ridiculous at km 3.
      </div>
    </div>

    {PACING_BAND.map((seg, i) => (
      <div key={i} className="card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">{seg.segment}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{seg.execution}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-mono font-semibold text-brand-700 dark:text-brand-200">{seg.paceRange}</div>
            {seg.hrCeiling > 0 && <div className="text-[10px] text-slate-500 dark:text-slate-400">HR ≤ {seg.hrCeiling}</div>}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">cum {seg.cumulative}</div>
          </div>
        </div>
      </div>
    ))}

    <div className="card bg-brand-50 dark:bg-brand-900/30">
      <div className="text-xs font-semibold text-brand-700 dark:text-brand-100 uppercase tracking-wide mb-1">The 9:1 rule</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
        Nine minutes running, one minute of brisk walking, from the very first kilometre — not from the point of fatigue. Set the interval alarm before the start and obey it even when it feels ridiculous at km 3. Every walk break resets heart rate, lets a gel go down properly, pumps the lower legs, and briefly unloads the tibia. Skipping the early ones to "bank time" is the most common way a first marathon falls apart — and it is exactly the pattern in the November 2025 splits.
      </p>
    </div>
  </div>
)

// ── 9:1 Run-walk alarm ────────────────────────────────────────────────────────

const RunWalk9to1: React.FC = () => {
  // Driven by the app-wide singleton (lib/runWalkTimer) so the alarm keeps
  // running — and keeps cueing the watch — even if you leave this tab.
  const t = useStore((s) => s.runWalkTimer)
  const isRun = t.phase === 'run'
  const totalSecs = isRun ? 540 : 60
  const progress = 1 - t.secsLeft / totalSecs

  return (
    <div className="space-y-3">
      <div className="card text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          9:1 Run-walk alarm
        </div>

        {/* Big phase display */}
        <div className={`rounded-2xl p-6 mb-3 transition ${
          isRun ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
        }`}>
          <div className={`text-4xl font-bold ${isRun ? 'text-green-700 dark:text-green-200' : 'text-blue-700 dark:text-blue-200'}`}>
            {isRun ? 'RUN' : 'WALK'}
          </div>
          <div className="text-2xl font-mono tabular-nums mt-2">
            {formatDuration(t.secsLeft)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Cycle {t.cycle + 1} · {isRun ? 'then 1 min walk' : 'then 9 min run'}
          </div>
          {/* Progress ring */}
          <svg width="120" height="120" className="mx-auto mt-3 -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-slate-800" />
            <circle
              cx="60" cy="60" r="50" fill="none" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 50}
              strokeDashoffset={2 * Math.PI * 50 * (1 - progress)}
              className={isRun ? 'stroke-green-600' : 'stroke-blue-600'}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        </div>

        <div className="flex gap-2">
          {!t.running ? (
            <button className="btn-primary flex-1" onClick={startRunWalkTimer}>Start 9:1 alarm</button>
          ) : (
            <button className="btn-secondary flex-1" onClick={stopRunWalkTimer}>Stop</button>
          )}
        </div>

        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
          A cue fires at every phase change (RUN → WALK → RUN…) — both on-screen and as a phone notification that mirrors to your Amazfit. The screen wake-lock keeps the timer alive while the phone is in your pocket, and the alarm keeps running even if you leave this tab.
        </div>
      </div>

      <div className="card">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Gel timings during the race
        </div>
        <div className="space-y-1.5">
          {[30, 75, 120, 165, 210, 255].map((m) => (
            <button
              key={m}
              className="w-full flex items-center justify-between text-xs rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5"
              onClick={() => { notifyGelTime(m); playGelCue(); hapticTick() }}
            >
              <span>Minute {m}</span>
              <span className="text-brand-700 dark:text-brand-200">→ Send gel cue to watch</span>
            </button>
          ))}
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          65 g carbs per hour (race rate). Drink at every station regardless of thirst.
        </div>
      </div>
    </div>
  )
}

// ── Kit & logistics ───────────────────────────────────────────────────────────

const KitAndLogistics: React.FC = () => {
  const [kitChecked, setKitChecked] = useState<boolean[]>(() => RACE_KIT_CHECKLIST.map(() => false))
  const kitDone = kitChecked.filter(Boolean).length

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Race kit checklist</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{kitDone}/{RACE_KIT_CHECKLIST.length}</div>
        </div>
        <div className="space-y-1.5">
          {RACE_KIT_CHECKLIST.map((item, i) => (
            <label key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={kitChecked[i]}
                onChange={(e) => setKitChecked((arr) => arr.map((v, j) => j === i ? e.target.checked : v))}
                className="mt-0.5"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-2">Race-week logistics</div>
        <div className="space-y-2">
          {RACE_WEEK_LOGISTICS.map((item, i) => (
            <div key={i} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
              <span className="text-brand-700 dark:text-brand-200">▸</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-amber-50 dark:bg-amber-900/20">
        <div className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Nothing new after Week 12</div>
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          After the Week 12 dress rehearsal, shoes, socks, gels, and breakfast are frozen. No experiments. Race-day disaster stories are almost all "I tried a new gel" or "I wore new socks". Test everything by Week 12, then change nothing.
        </p>
      </div>
    </div>
  )
}

// ── Fuel timeline ─────────────────────────────────────────────────────────────

const FuelTimeline: React.FC = () => (
  <div className="space-y-3">
    <div className="card">
      <div className="text-sm font-semibold mb-2">Carb load · Thu–Sat</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{RACE_DAY_FUEL.thursdayToSaturday}</p>
    </div>

    <div className="card">
      <div className="text-sm font-semibold mb-1">Race morning · 3:00 a.m.</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{RACE_DAY_FUEL.raceMorning3am}</p>
    </div>

    <div className="card">
      <div className="text-sm font-semibold mb-1">Pre-start · 5:45 a.m.</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{RACE_DAY_FUEL.raceMorning545}</p>
    </div>

    <div className="card">
      <div className="text-sm font-semibold mb-1">During the race</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{RACE_DAY_FUEL.duringRace}</p>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mt-2">{RACE_DAY_FUEL.fluidPerHour}</p>
    </div>

    <div className="card">
      <div className="text-sm font-semibold mb-1">After long runs & races</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{RACE_DAY_FUEL.postLongRun}</p>
    </div>

    <div className="card">
      <div className="text-sm font-semibold mb-1">Before bed</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{RACE_DAY_FUEL.beforeBed}</p>
    </div>

    <div className="card bg-brand-50 dark:bg-brand-900/30">
      <div className="text-xs font-semibold text-brand-700 dark:text-brand-100 uppercase tracking-wide mb-2">
        Daily targets
      </div>
      <div className="space-y-1.5 text-xs">
        <Row label="Protein" value={RACE_DAY_FUEL.dailyProtein} />
        <Row label="Carbohydrate" value={RACE_DAY_FUEL.dailyCarb} />
        <Row label="Fluid" value={RACE_DAY_FUEL.dailyFluid} />
        <Row label="Creatine" value={RACE_DAY_FUEL.creatine} />
      </div>
    </div>
  </div>
)

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="font-semibold text-slate-600 dark:text-slate-300 min-w-[80px]">{label}:</span>
    <span className="text-slate-700 dark:text-slate-200 flex-1">{value}</span>
  </div>
)

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-lg py-2 text-xs font-medium transition ${
      active ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
)

// ── Taper cockpit (Round 2) ───────────────────────────────────────────────────────

const TaperCockpit: React.FC = () => (
  <div className="space-y-3">
    <div className="card">
      <div className="text-sm font-semibold mb-1">Taper · Weeks 13–14</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Volume comes down sharply so you arrive at race day with fitness stored and fatigue shed. You cannot gain fitness now — only lose it. Restlessness is normal.
      </div>
    </div>

    <div className="card bg-purple-50 dark:bg-purple-900/20">
      <div className="text-xs font-semibold text-purple-700 dark:text-purple-200 mb-1">What taper feels like</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
        Restless and "too fresh". Legs feel springy on easy runs. You will want to do more — do not. Taper tantrums (feeling anxious and sluggish) are normal.
      </p>
    </div>

    <div className="card">
      <div className="text-sm font-semibold mb-2">Taper checklist</div>
      <div className="space-y-1.5">
        {[
          'Monday rest + mobility only (Week 13)',
          'Gym: Tuesday only — 20 min, 2 sets main lifts, normal weight (Week 14)',
          'Carb load Thursday–Saturday: 525–675 g/day, low fibre Saturday',
          'Travel to Srirangapatna Saturday, not race morning',
          '2 km shakeout on arrival, feet up by 9 p.m.',
          'Dinner: familiar, low fibre, eaten early. No experiments.',
          'Alarm 3:00 a.m. for breakfast, back to bed until 4:30 if possible',
          'Compression socks on before leaving the room',
        ].map((item, i) => (
          <label key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input type="checkbox" />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>

    <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
      <div className="text-xs font-semibold text-amber-700 dark:text-amber-200 mb-1">
        ⚠ Stress-fracture warning signs override taper
      </div>
      <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
        Pain pinpoint on bone, worsens as you run, hurts at rest/night, or on hopping — stop and get imaging. Not rest and hope.
      </p>
    </div>
  </div>
)

// ── Retrospective section (Round 2) ───────────────────────────────────────────

const RetrospectiveSection: React.FC = () => (
  <div className="space-y-3">
    <div className="card">
      <div className="text-sm font-semibold mb-1">Race retrospective</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        After each race: 19 Sep 10K, 27 Sep half, 22 Nov marathon. Time, splits, what worked, what failed, fueling, pain. The 27 Sep half feeds the decision gate automatically.
      </div>
    </div>

    <RaceRetrospectiveForm
      raceId="10k-19sep"
      raceName="10K · 19 Sep 2026"
      raceDate="2026-09-19"
    />
    <RaceRetrospectiveForm
      raceId="half-27sep"
      raceName="Wipro Bengaluru Half · 27 Sep 2026"
      raceDate="2026-09-27"
      isGate
    />
    <RaceRetrospectiveForm
      raceId="kaveri-22nov"
      raceName="Kaveri Trail Marathon · 22 Nov 2026"
      raceDate="2026-11-22"
    />
  </div>
)
