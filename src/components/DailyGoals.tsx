import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { todayISO, formatLongDate } from '@/lib/dates'
import { getExercisesByCategory } from '@/data/exercises'
import { notifyShinRoutine } from '@/lib/notifications'
import { saveDraft, loadDraft, clearDraft, registerDraftFlush } from '@/lib/drafts'
import { hapticTick, hapticDone } from '@/lib/haptics'

// ─────────────────────────────────────────────────────────────────────────────
// DailyGoals — the document's six-minute daily lower-leg routine: five
// movements, every morning, barefoot, before the day starts. Doses match the
// plan table exactly (2 × 25, 2 × 15/side, …). Interactive like the cab
// widget: tap a movement to open its form and watch-fors, tick each one off,
// or run the guided flow. Persisted per date under the journal key
// `shin:<date>` with crash-safe drafts.
// Mobility (hip flexors, calves, T-spine, glutes) is NOT part of this card —
// the document schedules that separately on Mondays & Wednesdays, so it lives
// in the "Recovery checks · due today" flows instead.
// ─────────────────────────────────────────────────────────────────────────────

// The five document movements, in order, straight from the exercise library.
const SHIN_MOVES = getExercisesByCategory('dailyShin')

// "2 × 25" / "1 × 10 each way · 5 s each" — the dose line for a row.
const doseOf = (ex: (typeof SHIN_MOVES)[number]): string => {
  const p = ex.prescribed[0]
  if (!p) return ''
  const base = `${p.sets} × ${p.reps}`
  return p.cue ? `${base} · ${p.cue}` : base
}

const rowTitle = (ex: (typeof SHIN_MOVES)[number]): string =>
  ex.name.replace(/ \(daily\)$/, '')

interface DailyGoalsDraft {
  ticks: boolean[]
}

export const DailyGoals: React.FC<{ date?: string }> = ({ date: dateProp }) => {
  const date = dateProp ?? todayISO()
  const existing = useStore((s) => s.journalsByDate[`shin:${date}`])
  const loadJournal = useStore((s) => s.loadJournal)
  const putJournal = useStore((s) => s.putJournal)

  const [openEx, setOpenEx] = useState<number | null>(null)

  const savedTicks = useMemo(() => {
    if (!existing?.text) return null
    try {
      const parsed = JSON.parse(existing.text) as { ticks?: boolean[] }
      return Array.isArray(parsed.ticks) ? parsed.ticks : null
    } catch {
      return null
    }
  }, [existing?.text])

  // Draft restore — toggles are cheap, but a killed tab shouldn't lose the
  // three you already ticked this morning.
  const draftKey = `shin-draft:${date}`
  const draft = useMemo(() => loadDraft<DailyGoalsDraft>(draftKey), [draftKey])

  // Migration-safe init: older saves held 9 ticks (5 shin + 4 spine extras);
  // the spine extras were removed to match the document, keep the first five.
  const initTicks = (): boolean[] => {
    const src = savedTicks ?? draft?.ticks ?? []
    if (src.length >= SHIN_MOVES.length) return src.slice(0, SHIN_MOVES.length)
    return [...src, ...Array(SHIN_MOVES.length - src.length).fill(false)]
  }
  const [ticks, setTicks] = useState<boolean[]>(initTicks)

  useEffect(() => { void loadJournal(`shin:${date}`) }, [date, loadJournal])
  useEffect(() => {
    if (existing) {
      setTicks(initTicks())
      clearDraft(draftKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, savedTicks, draftKey])

  const draftRef = useRef<DailyGoalsDraft>({ ticks })
  draftRef.current = { ticks }
  useEffect(() => {
    const t = setTimeout(() => saveDraft(draftKey, draftRef.current), 300)
    return () => clearTimeout(t)
  }, [ticks, draftKey])
  useEffect(() => registerDraftFlush(() => saveDraft(draftKey, draftRef.current)), [draftKey])

  const shinDone = ticks.filter(Boolean).length
  const allDone = shinDone === SHIN_MOVES.length

  const toggle = (i: number) => {
    const next = ticks.map((v, j) => (j === i ? !v : v))
    setTicks(next)
    void putJournal(JSON.stringify({ ticks: next }), `shin:${date}`)
    const nowAll = next.every(Boolean)
    if (nowAll) hapticDone()
    else hapticTick()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold">Daily goals · 6 min</div>
        {allDone && <span className="chip bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200">✓ done</span>}
      </div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
        {formatLongDate(date)} · the six-minute daily lower-leg routine — every morning, barefoot, before the day starts.
      </div>

      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        Shin routine · {shinDone}/{SHIN_MOVES.length}
      </div>
      <div className="space-y-1.5">
        {SHIN_MOVES.map((ex, i) => (
          <div key={ex.id} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-start gap-2.5 p-2.5">
              <input type="checkbox" checked={ticks[i]} onChange={() => toggle(i)} className="mt-1" aria-label={`Tick ${rowTitle(ex)}`} />
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => setOpenEx(openEx === i ? null : i)}
                aria-label={`Expand ${rowTitle(ex)}`}
              >
                <span className={`block text-sm font-medium ${ticks[i] ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {rowTitle(ex)}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">{doseOf(ex)}</span>
              </button>
              <button
                className={`text-slate-400 text-xs mt-1 transition-transform ${openEx === i ? 'rotate-180' : ''}`}
                onClick={() => setOpenEx(openEx === i ? null : i)}
                aria-label={`Details for ${rowTitle(ex)}`}
              >
                ▾
              </button>
            </div>
            {openEx === i && (
              <div className="px-3 pb-3 space-y-1.5 animate-slide-up">
                <p className="text-[11px] text-slate-600 dark:text-slate-300">{ex.summary}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Do:</span> {ex.execution}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Watch for:</span> {ex.watchFor}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <div className="mt-2 text-[11px] text-green-700 dark:text-green-200 font-medium">
          ✓ Routine complete for {formatLongDate(date)} — shins guarded for the day.
        </div>
      )}

      <div className="mt-3 space-y-2">
        <Link to="/exercises?flow=dailyShin" className="btn-secondary w-full text-xs">
          ▶ Play guided flow · 6 min
        </Link>
        <button className="btn-ghost w-full text-xs" onClick={() => notifyShinRoutine()}>
          ⏰ Set daily reminder
        </button>
      </div>
    </div>
  )
}
