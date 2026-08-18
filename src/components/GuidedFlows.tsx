import { useState, useEffect, useRef, useCallback } from 'react'
import { getExercisesByCategory } from '@/data/exercises'
import { ExerciseCard } from './ExerciseCard'

// ─────────────────────────────────────────────────────────────────────────────────────
// GuidedFlows — interactive mobility + primer sequences with timers and SVG figures.
// A play-through mode that auto-advances through each movement.
// ─────────────────────────────────────────────────────────────────────────────────────

interface GuidedFlowsProps {
  /** Which flow to run: 'mobility' | 'primerA' | 'primerB' | 'dailyShin' */
  flow: 'mobility' | 'primerA' | 'primerB' | 'dailyShin'
}

export const GuidedFlows: React.FC<GuidedFlowsProps> = ({ flow }) => {
  const exercises = getExercisesByCategory(flow === 'mobility' ? 'mobility' : flow === 'dailyShin' ? 'dailyShin' : flow === 'primerA' ? 'primerA' : 'primerB')
  const [playing, setPlaying] = useState(false)
  const [idx, setIdx] = useState(0)
  const [showRef, setShowRef] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [deadline, setDeadline] = useState<number | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset idx when flow changes (avoids out-of-bounds on shorter flows)
  useEffect(() => {
    setIdx(0)
    setPlaying(false)
    setShowRef(null)
  }, [flow])

  const current = exercises[idx]
  const isLast = idx >= exercises.length - 1

  const clearAdvance = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  const next = useCallback(() => {
    if (isLast) {
      setPlaying(false)
      setIdx(0)
      return
    }
    setIdx((i) => i + 1)
  }, [isLast])

  // Auto-advance based on holdSeconds or a default 30s; the deadline drives
  // the live countdown so display and advance never drift apart.
  useEffect(() => {
    if (!playing) return
    const dur = current?.holdSeconds ?? 30
    const until = Date.now() + dur * 1000
    setDeadline(until)
    advanceTimerRef.current = setTimeout(() => {
      next()
    }, dur * 1000)
    return clearAdvance
  }, [playing, idx, current, next, clearAdvance])

  // 4 Hz tick while playing so the countdown and progress bar animate.
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setNowMs(Date.now()), 250)
    return () => clearInterval(t)
  }, [playing])

  const dur = current?.holdSeconds ?? 30
  const remaining = deadline !== null && playing ? Math.max(0, Math.ceil((deadline - nowMs) / 1000)) : dur
  const progress = dur > 0 ? Math.min(1, Math.max(0, (dur - remaining) / dur)) : 0
  const nextUp = playing && !isLast ? exercises[idx + 1] : null

  const stop = useCallback(() => {
    setPlaying(false)
    setDeadline(null)
    clearAdvance()
  }, [clearAdvance])

  const start = useCallback(() => {
    setPlaying(true)
    setIdx(0)
  }, [])

  useEffect(() => () => clearAdvance(), [clearAdvance])

  const titles: Record<string, string> = {
    mobility: 'Mobility flow · 10 min',
    primerA: 'Strength A primer · 6 min',
    primerB: 'Strength B primer · 4 min',
    dailyShin: 'Daily shin routine · 6 min',
  }

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{titles[flow]}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {exercises.length} movements · {playing ? `movement ${idx + 1} of ${exercises.length}` : 'tap play to start'}
            </div>
          </div>
          <div className="flex gap-1.5">
            {!playing ? (
              <button className="btn-primary text-xs" onClick={start}>▶ Play</button>
            ) : (
              <button className="btn-secondary text-xs" onClick={stop}>■ Stop</button>
            )}
            <button className="btn-ghost text-xs" onClick={() => { setPlaying(false); setIdx(0) }} disabled={playing}>↺ Reset</button>
          </div>
        </div>
      </div>

      {/* Current movement card */}
      {current && (
        <div className="card animate-fade-in" key={current.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="text-sm font-semibold">{current.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{current.muscles}</div>
            </div>
            <span className="chip bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 text-[10px]">
              {idx + 1}/{exercises.length}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 mt-2 leading-relaxed">{current.summary}</p>

          {/* Big hold timer — live countdown with progress */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 mt-3 text-center">
            <div className="text-3xl font-mono tabular-nums">{remaining}s</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {playing ? 'holding...' : 'tap play to start the timer'}
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${playing ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Next up — always shows where the flow is going */}
          {nextUp && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Next up · </span>
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200">{nextUp.name}</span>
            </div>
          )}

          {/* Cue reminder */}
          <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 p-2.5 mt-2">
            <div className="text-[10px] font-semibold text-brand-700 dark:text-brand-100 uppercase tracking-wide mb-1">Cue</div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{current.execution}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">{current.breathing}</p>
          </div>

          {/* Nav buttons */}
          <div className="flex gap-2 mt-3">
            <button className="btn-secondary flex-1 text-xs" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← Prev</button>
            <button className="btn-secondary flex-1 text-xs" onClick={() => setShowRef(showRef === current.id ? null : current.id)}>Ref card</button>
            <button className="btn-secondary flex-1 text-xs" onClick={next} disabled={isLast}>Next →</button>
          </div>
        </div>
      )}

      {/* Full reference (collapsible) */}
      {showRef && current && (
        <ExerciseCard exercise={(exercises.find((e) => e.id === showRef)) ?? current} defaultExpanded />
      )}
    </div>
  )
}
