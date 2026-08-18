import { useState, useEffect, useMemo } from 'react'
import type { Session, SetLog, Exercise } from '@/types'
import { useStore } from '@/store/useStore'
import { getExercisesForSlot, CATEGORY_LABELS } from '@/data/exercises'
import { ExerciseCard } from './ExerciseCard'
import { Timer } from './Timer'

// ─────────────────────────────────────────────────────────────────────────────
// StrengthLogger — Strong/Hevy-style set-by-set logger for a strength session.
// For each exercise in the slot, shows prescribed sets × reps and an editable
// set table where you log actual weight, reps, RPE, mark done, and start a
// rest timer. Deviations from prescribed auto-flag amber with a note field.
// Supersets (A1/A2) are shown paired with a shared rest timer.
// Exercises are grouped into the session's blocks — Warm-up · Primer, Main
// lifts, Shin insurance / Arms / Core / Plyometrics — so the warm-up reads
// as a warm-up and the work as work, like the library page.
// ─────────────────────────────────────────────────────────────────────────────

interface StrengthLoggerProps {
  session: Session
}

// Block order inside each strength session, matching the document/library.
const SLOT_BLOCKS: Record<'A' | 'B' | 'C', Exercise['category'][]> = {
  A: ['primerA', 'mainA', 'shinA'],
  B: ['primerB', 'mainB', 'armsB', 'coreB'],
  C: ['plyoC', 'durabilityC'],
}

const blockLabel = (cat: Exercise['category']): string =>
  cat.startsWith('primer') ? 'Warm-up · Primer' : CATEGORY_LABELS[cat]

export const StrengthLogger: React.FC<StrengthLoggerProps> = ({ session }) => {
  const slot = session.strength?.slot
  const exercises = useMemo(() => (slot ? getExercisesForSlot(slot) : []), [slot])
  const setLogsBySession = useStore((s) => s.setLogsBySession)
  const setLogs = useMemo(() => setLogsBySession[session.id] ?? [], [setLogsBySession, session.id])
  const putSetLog = useStore((s) => s.putSetLog)
  const deleteSetLog = useStore((s) => s.deleteSetLog)

  const [activeTimer, setActiveTimer] = useState<number | null>(null)
  const [expandedEx, setExpandedEx] = useState<string | null>(null)
  const [showExerciseRef, setShowExerciseRef] = useState<string | null>(null)

  // Group the slot's exercises into their document blocks, in order.
  const grouped = useMemo(() => {
    if (!slot) return []
    return SLOT_BLOCKS[slot]
      .map((cat) => ({ cat, list: exercises.filter((e) => e.category === cat) }))
      .filter((g) => g.list.length > 0)
  }, [slot, exercises])

  if (!slot || exercises.length === 0) return null

  // Build set rows: for each exercise, prescribed sets × reps becomes a row template
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
        Log your sets
      </div>

      {grouped.map((g, gi) => {
        const totalInGroup = g.list.reduce((sum, ex) => sum + (ex.prescribed[0]?.sets ?? 0), 0)
        const doneInGroup = setLogs.filter((l) => l.done && g.list.some((e) => e.id === l.exerciseId)).length
        const groupComplete = totalInGroup > 0 && doneInGroup >= totalInGroup
        return (
          <div key={g.cat} className="space-y-2">
            {/* Block header — Warm-up · Primer, Main lifts, … */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                {gi + 1} · {blockLabel(g.cat)}
              </div>
              <span className={`text-[10px] font-mono ${groupComplete ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                {groupComplete ? '✓ ' : ''}{doneInGroup}/{totalInGroup} sets
              </span>
            </div>

            {g.list.map((ex) => {
              const prescribedSets = ex.prescribed[0]?.sets ?? 3
              const prescribedReps = ex.prescribed[0]?.reps ?? '8'
              const existingLogs = setLogs.filter((l) => l.exerciseId === ex.id)
              const isExpanded = expandedEx === ex.id
              const isSuperset = ex.supersetWith
              const partner = isSuperset ? exercises.find((e) => e.id === ex.supersetWith) : null

              return (
          <div key={ex.id} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Exercise header */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50">
              <button className="flex-1 text-left" onClick={() => setExpandedEx(isExpanded ? null : ex.id)}>
                <div className="text-sm font-medium">{ex.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Prescribed: {prescribedSets} × {prescribedReps}
                  {ex.prescribed[0]?.cue ? ` (${ex.prescribed[0].cue})` : ''}
                  {isSuperset && partner && <span className="ml-2 text-brand-700 dark:text-brand-200">⇆ superset with {partner.name}</span>}
                </div>
              </button>
              <button
                className="btn-ghost text-xs px-2"
                onClick={() => setShowExerciseRef(showExerciseRef === ex.id ? null : ex.id)}
              >
                Ref
              </button>
            </div>

            {/* Reference card */}
            {showExerciseRef === ex.id && (
              <div className="p-3 bg-white dark:bg-slate-900 animate-slide-up">
                <ExerciseCard exercise={ex} showPrescribed={false} defaultExpanded />
              </div>
            )}

            {/* Set rows */}
            {isExpanded && (
              <div className="p-3 space-y-2 animate-slide-up">
                {Array.from({ length: prescribedSets }).map((_, i) => {
                  const setIdx = i + 1
                  const log = existingLogs.find((l) => l.setIndex === setIdx)
                  const setId = log?.setId ?? `${session.id}|${ex.id}|${setIdx}`
                  return (
                    <SetRow
                      key={setIdx}
                      setIndex={setIdx}
                      prescribedReps={prescribedReps}
                      existing={log}
                      restSeconds={ex.restSeconds ?? 90}
                      onDone={(actual) => {
                        void putSetLog({
                          setId,
                          exerciseId: ex.id,
                          sessionId: session.id,
                          setIndex: setIdx,
                          prescribedReps,
                          actualReps: actual.actualReps,
                          actualWeight: actual.actualWeight,
                          rpe: actual.rpe,
                          done: true,
                          note: actual.note,
                          loggedAt: new Date().toISOString(),
                        })
                        setActiveTimer(ex.restSeconds ?? 90)
                      }}
                      onUpdate={(actual) => {
                        void putSetLog({
                          setId,
                          exerciseId: ex.id,
                          sessionId: session.id,
                          setIndex: setIdx,
                          prescribedReps,
                          ...actual,
                          done: log?.done ?? false,
                          loggedAt: log?.loggedAt ?? new Date().toISOString(),
                        })
                      }}
                      onDelete={() => void deleteSetLog(setId, session.id)}
                    />
                  )
                })}

                {/* Active rest timer */}
                {activeTimer !== null && (
                  <Timer
                    seconds={activeTimer}
                    label="Rest"
                    resetKey={activeTimer}
                    onFinish={() => setActiveTimer(null)}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
      </div>
    )
  })}

      {/* Session note */}
      <SessionNoteField sessionId={session.id} />
    </div>
  )
}

// ── SetRow ─────────────────────────────────────────────────────────────────────

interface SetRowProps {
  setIndex: number
  prescribedReps: string
  existing?: SetLog
  restSeconds: number
  onDone: (a: { actualReps?: number; actualWeight?: number; rpe?: number; note?: string }) => void
  onUpdate: (a: Partial<SetLog>) => void
  onDelete: () => void
}

const SetRow: React.FC<SetRowProps> = ({ setIndex, prescribedReps, existing, onDone, onUpdate, onDelete }) => {
  const [reps, setReps] = useState<string>(existing?.actualReps?.toString() ?? '')
  const [weight, setWeight] = useState<string>(existing?.actualWeight?.toString() ?? '')
  const [rpe, setRpe] = useState<string>(existing?.rpe?.toString() ?? '')
  const [note, setNote] = useState<string>(existing?.note ?? '')
  const [showNote, setShowNote] = useState(false)

  useEffect(() => {
    setReps(existing?.actualReps?.toString() ?? '')
    setWeight(existing?.actualWeight?.toString() ?? '')
    setRpe(existing?.rpe?.toString() ?? '')
    setNote(existing?.note ?? '')
  }, [existing?.setId, existing?.actualReps, existing?.actualWeight, existing?.rpe, existing?.note])

  // Parse prescribed reps to a target number for deviation check
  const targetReps = parseInt(prescribedReps.split('/')[0] ?? '0', 10) || 0
  const actualRepsNum = parseInt(reps, 10)
  const deviation = reps !== '' && targetReps > 0 && actualRepsNum < targetReps
  const done = existing?.done ?? false

  return (
    <div className={`rounded-lg border p-2.5 transition ${
      done
        ? deviation
          ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700'
          : 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500 w-5">{setIndex}</span>
        <input
          type="number" inputMode="decimal" placeholder="kg"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); onUpdate({ actualWeight: e.target.value ? Number(e.target.value) : undefined }) }}
          className="w-16 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
        />
        <span className="text-[10px] text-slate-400">×</span>
        <input
          type="number" inputMode="numeric" placeholder={`reps (${prescribedReps})`}
          value={reps}
          onChange={(e) => { setReps(e.target.value); onUpdate({ actualReps: e.target.value ? Number(e.target.value) : undefined }) }}
          className="w-24 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
        />
        <select
          value={rpe}
          onChange={(e) => { setRpe(e.target.value); onUpdate({ rpe: e.target.value ? Number(e.target.value) : undefined }) }}
          className="w-14 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 py-1 text-xs"
        >
          <option value="">RPE</option>
          {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          className={`ml-auto tap-target rounded-lg px-3 text-sm font-medium ${
            done ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          onClick={() => onDone({
            actualReps: reps ? Number(reps) : undefined,
            actualWeight: weight ? Number(weight) : undefined,
            rpe: rpe ? Number(rpe) : undefined,
            note: note || undefined,
          })}
          aria-label={done ? 'Done' : 'Mark done'}
        >
          {done ? '✓' : '✓'}
        </button>
      </div>
      {deviation && done && (
        <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>⚠ {actualRepsNum} &lt; {targetReps} prescribed</span>
          {!showNote && (
            <button className="underline" onClick={() => setShowNote(true)}>add note</button>
          )}
        </div>
      )}
      {showNote && (
        <input
          type="text" placeholder="Note (e.g. shins tight, dropped volume)"
          value={note}
          onChange={(e) => { setNote(e.target.value); onUpdate({ note: e.target.value || undefined }) }}
          className="mt-2 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
        />
      )}
      {done && (
        <button onClick={onDelete} className="mt-1 text-[10px] text-slate-400 hover:text-red-500">Delete set</button>
      )}
    </div>
  )
}

// ── Session note ──────────────────────────────────────────────────────────────

const SessionNoteField: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  // Reuse the journal store for per-session notes, keyed by sessionId
  const journal = useStore((s) => s.journalsByDate[`session:${sessionId}`])
  const putJournal = useStore((s) => s.putJournal)
  const [text, setText] = useState(journal?.text ?? '')

  useEffect(() => { setText(journal?.text ?? '') }, [journal?.text])

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
        Session notes
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => void putJournal(text, `session:${sessionId}`)}
        placeholder="How did the session feel overall?"
        rows={2}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />
    </div>
  )
}
