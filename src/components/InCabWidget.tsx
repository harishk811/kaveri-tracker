import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { todayISO, formatLongDate } from '@/lib/dates'
import { getExercisesByCategory } from '@/data/exercises'
import { fireReminderNow } from '@/lib/reminders'
import { hapticTick, hapticDone } from '@/lib/haptics'

// ─────────────────────────────────────────────────────────────────────────────
// InCabWidget — the "In cab?" toggle on the Today page. Flip it on and the
// cab exercises (ankle pumps · toe circles · seated heel raises) drop open
// for that ride, with per-item ticks persisted per date (`cab:<date>`). The
// setting doubles as the master switch for the scheduled in-cab nudges
// (going & return times, editable in Settings).
// ─────────────────────────────────────────────────────────────────────────────

const CAB_EXERCISES = getExercisesByCategory('inCab')

export const InCabWidget: React.FC = () => {
  const settings = useStore((s) => s.settings)
  const cab = settings?.cab ?? { enabled: false, go: '08:30', ret: '18:30' }
  const saveSettings = useStore((s) => s.saveSettings)
  const putJournal = useStore((s) => s.putJournal)
  const loadJournal = useStore((s) => s.loadJournal)

  const date = todayISO()
  const existing = useStore((s) => s.journalsByDate[`cab:${date}`])

  const savedTicks = useMemo(() => {
    if (!existing?.text) return null
    try {
      const parsed = JSON.parse(existing.text) as { ticks?: boolean[] }
      return Array.isArray(parsed.ticks) ? parsed.ticks : null
    } catch {
      return null
    }
  }, [existing?.text])

  const [ticks, setTicks] = useState<boolean[]>(() =>
    savedTicks ?? Array(CAB_EXERCISES.length).fill(false))

  useEffect(() => { void loadJournal(`cab:${date}`) }, [date, loadJournal])
  useEffect(() => {
    if (existing) setTicks(savedTicks ?? Array(CAB_EXERCISES.length).fill(false))
  }, [existing, savedTicks])

  const done = ticks.filter(Boolean).length

  const toggleCab = (v: boolean) => {
    void saveSettings({ cab: { ...cab, enabled: v } })
    hapticTick()
  }

  const toggleTick = (i: number) => {
    const next = ticks.map((x, j) => (j === i ? !x : x))
    setTicks(next)
    void putJournal(JSON.stringify({ ticks: next }), `cab:${date}`)
    if (next.every(Boolean)) hapticDone()
    else hapticTick()
  }

  return (
    <div className={`card ${cab.enabled ? 'border-brand-200 dark:border-brand-800' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">🚕</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">In cab today?</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {cab.enabled
              ? `On — nudge fires at ${cab.go} (going) and ${cab.ret} (returning) on office days`
              : 'Flip it on during a ride and the cab exercises drop open below'}
          </div>
        </div>
        <button
          role="switch"
          aria-checked={cab.enabled}
          aria-label="In cab today"
          onClick={() => toggleCab(!cab.enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${cab.enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${cab.enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {cab.enabled && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-slide-up">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Cab exercises · {formatLongDate(date)} · {done}/{CAB_EXERCISES.length}
          </div>
          {CAB_EXERCISES.map((ex, i) => (
            <label key={ex.id} className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" checked={ticks[i]} onChange={() => toggleTick(i)} className="mt-0.5" />
              <div className="flex-1">
                <div className={`font-medium ${ticks[i] ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {ex.name} · {ex.prescribed[0]?.sets} × {ex.prescribed[0]?.reps}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{ex.execution}</div>
              </div>
            </label>
          ))}
          <div className="flex items-center gap-2">
            <Link to="/settings" className="btn-ghost text-[10px] px-2">Edit times</Link>
            <button className="btn-ghost text-[10px] px-2" onClick={() => fireReminderNow('in-cab')}>
              Test nudge
            </button>
            <Link to="/exercises" className="text-[10px] text-brand-700 dark:text-brand-200 ml-auto">Full details →</Link>
          </div>
        </div>
      )}
    </div>
  )
}