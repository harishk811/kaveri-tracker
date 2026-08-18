import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { todayISO } from '@/lib/dates'
import { CALF_RAISE_GATE } from '@/data/safety'
import { hapticTick } from '@/lib/haptics'
import { notify } from '@/lib/notifications'
import type { PainLogEntry } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// TodayRecoveryFlows — the document's recovery schedule surfaced on Today, so
// nothing is missed:
//   · pain traffic-light quick-log — every day
//   · six-minute lower-leg routine — every day (tracked in the Daily goals
//     card directly below)
//   · mobility 10 min — Mondays & Wednesdays (hip flexors, calves, T-spine,
//     glutes — document Section 07)
//   · 10-min easy walk — before every quality & long run (Section 07)
//   · Sunday green-light checklist — Sundays only
//   · calf-raise capacity gate — from its week onward
// The primer warm-up lives inside each strength session card (it belongs to
// the session, not to recovery). The full versions live on the Recovery /
// Exercises tabs; these are the due-today hooks.
// ─────────────────────────────────────────────────────────────────────────────

interface TodayRecoveryFlowsProps {
  week: number
  /** 0 = Monday … 6 = Sunday */
  dayIdx: number
  /** Any session today is a quality or long run (needs the 10-min walk) */
  qualityRun: boolean
}

const QUICK_LEVELS: Array<{ key: 'green' | 'amber' | 'red'; emoji: string; label: string; intensity: number }> = [
  { key: 'green', emoji: '🟢', label: 'No pain', intensity: 0 },
  { key: 'amber', emoji: '🟡', label: 'Mild · 1–5', intensity: 4 },
  { key: 'red', emoji: '🔴', label: 'Hurts · 6+', intensity: 7 },
]

export const TodayRecoveryFlows: React.FC<TodayRecoveryFlowsProps> = ({ week, dayIdx, qualityRun }) => {
  const painLogs = useStore((s) => s.painLogs)
  const putPainLog = useStore((s) => s.putPainLog)
  const loadPainLogs = useStore((s) => s.loadPainLogs)
  const startDate = useStore((s) => s.settings?.startDate) ?? '2026-08-17'
  const [justLogged, setJustLogged] = useState<string | null>(null)

  useEffect(() => {
    const today = todayISO()
    void loadPainLogs(startDate, today)
  }, [startDate, loadPainLogs])

  const today = todayISO()
  const loggedToday = painLogs.filter((p) => p.date === today)
  const gateDue = week >= CALF_RAISE_GATE.week
  const isSunday = dayIdx === 6
  const isMonWed = dayIdx === 0 || dayIdx === 2

  const quickLog = (level: (typeof QUICK_LEVELS)[number]) => {
    const entry: PainLogEntry = {
      id: `pain-${Date.now()}`,
      date: today,
      location: 'quick check',
      intensity: level.intensity,
      type: 'dull',
      light: level.key,
    }
    void putPainLog(entry)
    hapticTick()
    setJustLogged(level.key)
    setTimeout(() => setJustLogged(null), 1500)
    notify({
      title: `Pain quick-log · ${level.key.toUpperCase()}`,
      body: level.label,
      tag: 'pain-log',
    })
  }

  return (
    <div className="card">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
        Recovery checks · due today
      </div>

      {/* Pain quick-log */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium">Pain check</div>
          <div className="text-[10px] text-slate-400 truncate">
            {loggedToday.length > 0
              ? `Logged today (${loggedToday.map((p) => p.light.toUpperCase()).join(' · ')})`
              : 'Any pain? One tap logs it.'}
          </div>
        </div>
        <div className="flex gap-1.5">
          {QUICK_LEVELS.map((l) => (
            <button
              key={l.key}
              onClick={() => quickLog(l)}
              aria-label={`Log pain: ${l.label}`}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition ${
                justLogged === l.key
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              {l.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Mobility — Mondays & Wednesdays (document Section 07) */}
      {isMonWed && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-base">🧘</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">Mobility · 10 min</div>
            <div className="text-[10px] text-slate-400">Hip flexors · calves · T-spine · glutes — the commute makes hip flexors the priority</div>
          </div>
          <Link to="/exercises" className="btn-ghost text-xs px-2">Run</Link>
        </div>
      )}

      {/* 10-min easy walk — before quality & long runs (document Section 07) */}
      {qualityRun && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-base">🚶</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">10-min easy walk</div>
            <div className="text-[10px] text-slate-400">Before the session — cold tissue is where lower-leg problems start</div>
          </div>
        </div>
      )}

      {/* Sunday green-light checklist */}
      {isSunday && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-base">✅</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">Sunday green-light checklist</div>
            <div className="text-[10px] text-slate-400">8 checks before the week ahead · tonight</div>
          </div>
          <Link to="/recovery" className="btn-ghost text-xs px-2">Open</Link>
        </div>
      )}

      {/* Calf-raise capacity gate */}
      {gateDue && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-base">🦵</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">Calf-raise gate</div>
            <div className="text-[10px] text-slate-400">
              {CALF_RAISE_GATE.description} · {CALF_RAISE_GATE.actionIfFailed}
            </div>
          </div>
          <Link to="/recovery" className="btn-ghost text-xs px-2">Test</Link>
        </div>
      )}

      {/* Shin routine — tracked below */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-base">🦶</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium">Daily shin routine · 6 min</div>
          <div className="text-[10px] text-slate-400">Tick the 5 movements off below</div>
        </div>
        <span className="text-slate-300 dark:text-slate-600">↓</span>
      </div>
    </div>
  )
}