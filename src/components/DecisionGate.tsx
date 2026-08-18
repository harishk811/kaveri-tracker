import { useState, useMemo, useEffect } from 'react'
import { GATE_BANDS, findBand, timeToSeconds } from '@/data/plan'
import { useStore } from '@/store/useStore'
import { todayISO, formatShortDate } from '@/lib/dates'

// ─────────────────────────────────────────────────────────────────────────────────────
// DecisionGate — the 27 Sep half → marathon band calculator.
// Punch in 19 Sep 10K + 27 Sep half times → outputs the marathon band,
// run-segment pace, and the exact October adjustments from PDF Section 02.
// The five bands stay hidden until their time arrives (per the user's rule):
//   · before 19 Sep  — locked: the 10K clock decides which band is in play
//   · 19 Sep → 27 Sep — only the band your 10K time points to
//   · after 27 Sep    — only the band your half time confirms
// Times auto-fill from the logged 10K race (w5d5s1) and half (w6d6s1) if logged.
// ─────────────────────────────────────────────────────────────────────────────────────

// Anchor-derived key dates (plan anchor 2026-08-17): 10K = week 5 Saturday,
// decision gate = week 6 Sunday.
const TENK_DATE = '2026-09-19'
const GATE_DATE = '2026-09-27'

const TENK_RACE_SESSION = 'w5d5s1'
const HALF_RACE_SESSION = 'w6d6s1'

type GateStage = 'locked' | 'tenk' | 'gate'

// The band the 10K clock points at, from PDF Section 02's early warning:
// sub-58:00 → 4:30 in play · 58–1:05 → the statistically expected band ·
// over 1:05 → the half target moves down a band.
const bandFor10K = (tenKSec: number): (typeof GATE_BANDS)[number] | null => {
  if (!isFinite(tenKSec)) return null
  if (tenKSec < 58 * 60) return GATE_BANDS[0]
  if (tenKSec > 65 * 60) return GATE_BANDS[3]
  return GATE_BANDS[2]
}

// Seconds → "M:SS" or "H:MM:SS"
const formatSeconds = (sec: number): string => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

export const DecisionGate: React.FC = () => {
  const [tenK, setTenK] = useState('')
  const [half, setHalf] = useState('')
  const saveSettings = useStore((s) => s.saveSettings)
  const settings = useStore((s) => s.settings)
  const runLogsBySession = useStore((s) => s.runLogsBySession)
  const loadRunLog = useStore((s) => s.loadRunLog)

  // Auto-fill from the logged race results (if the race was logged).
  useEffect(() => {
    void loadRunLog(TENK_RACE_SESSION)
    void loadRunLog(HALF_RACE_SESSION)
  }, [loadRunLog])
  useEffect(() => {
    const sec = runLogsBySession[TENK_RACE_SESSION]?.actualDurationSec
    if (sec) setTenK((cur) => cur || formatSeconds(sec))
  }, [runLogsBySession[TENK_RACE_SESSION]?.actualDurationSec])
  useEffect(() => {
    const sec = runLogsBySession[HALF_RACE_SESSION]?.actualDurationSec
    if (sec) setHalf((cur) => cur || formatSeconds(sec))
  }, [runLogsBySession[HALF_RACE_SESSION]?.actualDurationSec])

  const today = todayISO()
  const stage: GateStage = today < TENK_DATE ? 'locked' : today < GATE_DATE ? 'tenk' : 'gate'

  const halfSec = timeToSeconds(half)
  const tenKSec = timeToSeconds(tenK)
  const band = useMemo(() => (isFinite(halfSec) ? findBand(halfSec) : null), [halfSec])
  const tenKBand = useMemo(() => bandFor10K(tenKSec), [tenKSec])

  const earlyWarning = useMemo(() => {
    if (!isFinite(tenKSec)) return null
    if (tenKSec < 58 * 60) return { ok: true, msg: 'Sub-58:00 — the 4:30 band is genuinely in play.' }
    if (tenKSec > 65 * 60) return { ok: false, msg: 'Over 1:05 — the half target moves down a band before you start it.' }
    return { ok: true, msg: 'In the 58:00–1:05 window — run the half at true effort and see.' }
  }, [tenKSec])

  const setBand = () => {
    if (band) void saveSettings({ marathonBand: band.marathonBand })
  }

  return (
    <div className="space-y-3">
      <div className="card bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="text-xs text-brand-100 uppercase tracking-wide">Decision gate</div>
        <div className="text-xl font-bold mt-0.5">27 Sep → Marathon band</div>
        <div className="text-[11px] text-brand-100 mt-1 leading-relaxed">
          Race the half honestly. Read the clock. Take the band it gives you. Sub-2:10 and 4:30 is live. That is the deal.
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="chip bg-white/15 text-white text-[10px]">10K · {formatShortDate(TENK_DATE)}</span>
          <span className="chip bg-white/15 text-white text-[10px]">Half · {formatShortDate(GATE_DATE)}</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="card space-y-3">
        <div className="text-sm font-semibold">Enter your times</div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            19 Sep 10K (M:SS or H:MM:SS){stage === 'locked' && ' · unlocks the bands'}
          </div>
          <input
            type="text" value={tenK} onChange={(e) => setTenK(e.target.value)}
            placeholder="e.g. 58:30"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono"
          />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">27 Sep Half (H:MM:SS)</div>
          <input
            type="text" value={half} onChange={(e) => setHalf(e.target.value)}
            placeholder="e.g. 2:10:00"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono"
          />
        </div>
      </div>

      {/* 10K early warning */}
      {earlyWarning && (
        <div className={`card ${earlyWarning.ok ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          <div className={`text-xs font-semibold ${earlyWarning.ok ? 'text-green-700 dark:text-green-200' : 'text-amber-700 dark:text-amber-200'}`}>
            10K early warning
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">{earlyWarning.msg}</p>
        </div>
      )}

      {/* Result */}
      {band && (
        <div className="card space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Your marathon band</div>
              <div className="text-lg font-bold text-brand-700 dark:text-brand-100">{band.marathonBand}</div>
            </div>
            <button className="btn-primary text-xs" onClick={setBand}>Save band</button>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Run-segment pace</div>
              <div className="text-sm font-mono font-semibold text-brand-700 dark:text-brand-200">{band.runPace}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">What October looks like</div>
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{band.october}</div>
            </div>
          </div>
        </div>
      )}

      {/* Band reference — hidden until its time arrives */}
      {stage === 'locked' && (
        <div className="card">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">The five bands stay locked until your 10K</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                The 10K clock on {formatShortDate(TENK_DATE)} decides which band is in play — the half on {formatShortDate(GATE_DATE)} confirms it. Racing with all five bands open is how pace plans get made before the body agrees.
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'tenk' && (
        <div className="card">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            The band your 10K points to
          </div>
          {tenKBand ? (
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-500 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold">{tenKBand.halfRange}</div>
                <span className="chip bg-brand-600 text-white text-[10px]">in play</span>
              </div>
              <div className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 font-mono">{tenKBand.marathonBand}</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{tenKBand.runPace}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{tenKBand.october}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                The half on {formatShortDate(GATE_DATE)} confirms — or moves — this band.
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter your 10K time above — or log the 10K race on the Today page and it fills in automatically — to see the single band it opens.
            </div>
          )}
        </div>
      )}

      {stage === 'gate' && (
        <div className="card">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Your band from the half
          </div>
          {band ? (
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-500 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold">{band.halfRange}</div>
                <span className="chip bg-brand-600 text-white text-[10px]">confirmed</span>
              </div>
              <div className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 font-mono">{band.marathonBand}</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{band.runPace}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{band.october}</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter your half time above — or log the half race on the Today page and it fills in automatically — to see the band it confirms.
            </div>
          )}
        </div>
      )}

      {settings?.marathonBand && (
        <div className="card bg-green-50 dark:bg-green-900/20">
          <div className="text-xs text-green-700 dark:text-green-200">
            ✓ Saved marathon band: <span className="font-semibold">{settings.marathonBand}</span>
          </div>
        </div>
      )}
    </div>
  )
}