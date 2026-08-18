import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@/types'
import { useStore } from '@/store/useStore'
import { getExercisesForSlot, getExercisesByCategory } from '@/data/exercises'
import { ZoneBadge } from './ZoneBadge'
import { StageBadge } from './StageBadge'
import { Term } from './Term'
import { ProgressRing } from './ProgressRing'
import { RunLogger } from './RunLogger'
import { SwimLogger } from './SwimLogger'
import { StrengthLogger } from './StrengthLogger'
import { hapticTick } from '@/lib/haptics'
import { startRunWalkTimer, stopRunWalkTimer } from '@/lib/runWalkTimer'
import { formatDuration } from '@/lib/dates'

// ─────────────────────────────────────────────────────────────────────────────
// SessionCard — a single session on the Today page. Shows title, zone, stage,
// "why today" explainer, prescribed details, and completion tracking.
// Tapping opens the session runner (logger). Strength sessions carry their
// primer warm-up inside the card — it belongs to the session, not to the
// recovery checks list.
// ─────────────────────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: Session
  date: string
}

// RunWalk9to1Quick — one-tap start/stop of the app-wide 9:1 alarm from any
// 9:1 session (long runs from Week 1, races). The pill indicator stays on
// screen app-wide while it runs.
const RunWalk9to1Quick: React.FC = () => {
  const t = useStore((s) => s.runWalkTimer)
  const isRun = t.phase === 'run'
  return (
    <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-2.5">
      <div className="flex items-center gap-2">
        <span className="text-base">⏱</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">9:1 run-walk alarm</div>
          {t.running && (
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              <span className={`font-mono font-bold ${isRun ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                {isRun ? 'RUN' : 'WALK'}
              </span>
              {' · '}
              <span className="font-mono tabular-nums">{formatDuration(t.secsLeft)}</span>
              {' · cycle '}{t.cycle + 1}
            </div>
          )}
        </div>
        {!t.running ? (
          <button className="btn-primary text-xs px-3 py-1.5" onClick={startRunWalkTimer}>Start 9:1</button>
        ) : (
          <button className="btn-secondary text-xs px-3 py-1.5" onClick={stopRunWalkTimer}>Stop</button>
        )}
      </div>
    </div>
  )
}

const kindIcon: Record<Session['kind'], string> = {
  run: '🏃',
  strength: '🏋️',
  swim: '🏊',
  walk: '🚶',
  rest: '😴',
  race: '🏁',
  mobility: '🧘',
}

// Primer blocks — the warm-up that opens each strength session (document
// Section 03 / exercise library): A is 6 minutes, B is 4 minutes, C has none.
const PRIMER_A = getExercisesByCategory('primerA')
const PRIMER_B = getExercisesByCategory('primerB')

// PrimerSection — the "do this before the session" warm-up with its moves,
// a done-tick and a one-tap route into the guided flow.
const PrimerSection: React.FC<{ slot: 'A' | 'B' | 'C'; sessionId: string }> = ({ slot, sessionId }) => {
  if (slot === 'C') return null
  const moves = slot === 'A' ? PRIMER_A : PRIMER_B
  const flow = slot === 'A' ? 'primerA' : 'primerB'
  const minutes = slot === 'A' ? 6 : 4
  const journalKey = `primer:${sessionId}`

  const primerJournal = useStore((s) => s.journalsByDate[journalKey])
  const putJournal = useStore((s) => s.putJournal)
  const loadJournal = useStore((s) => s.loadJournal)
  const done = Boolean(primerJournal?.text)

  useEffect(() => { void loadJournal(journalKey) }, [journalKey, loadJournal])

  return (
    <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-brand-700 dark:text-brand-100">
          🔥 Primer warm-up · {minutes} min
        </div>
        <button
          onClick={() => { void putJournal(done ? '' : '1', journalKey); hapticTick() }}
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
            done
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
              : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {done ? '✓ Primer done' : 'Mark primer done'}
        </button>
      </div>
      <p className="text-[11px] text-slate-600 dark:text-slate-300">
        Do this before the session — {moves.map((m) => m.name).join(' · ')}
      </p>
      <Link to={`/exercises?flow=${flow}`} className="btn-secondary text-xs w-full">
        ▶ Run guided flow · {minutes} min
      </Link>
    </div>
  )
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, date }) => {
  const [open, setOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)

  // Load any saved log for this session
  const setLogsBySession = useStore((s) => s.setLogsBySession)
  const setLogs = useMemo(() => setLogsBySession[session.id] ?? [], [setLogsBySession, session.id])
  const runLog = useStore((s) => s.runLogsBySession[session.id])
  const swimLog = useStore((s) => s.swimLogsBySession[session.id])
  const loadSetLogs = useStore((s) => s.loadSetLogs)
  const loadRunLog = useStore((s) => s.loadRunLog)
  const loadSwimLog = useStore((s) => s.loadSwimLog)
  const loadJournal = useStore((s) => s.loadJournal)

  // Manual done-tick for sessions without a logger (walk / rest / mobility)
  const doneJournal = useStore((s) => s.journalsByDate[`done:${session.id}`])
  const putJournal = useStore((s) => s.putJournal)
  const isManualKind = session.kind === 'walk' || session.kind === 'rest' || session.kind === 'mobility'
  const done = Boolean(doneJournal?.text)

  useEffect(() => {
    if (session.kind === 'strength') void loadSetLogs(session.id)
    if (session.kind === 'run' || session.kind === 'race') void loadRunLog(session.id)
    if (session.kind === 'swim') void loadSwimLog(session.id)
    if (isManualKind) void loadJournal(`done:${session.id}`)
  }, [session.id, session.kind, loadSetLogs, loadRunLog, loadSwimLog, isManualKind, loadJournal])

  // Compute completion
  const completed = computeCompletion(session, setLogs, runLog, swimLog, done)
  const isKey = session.keySession

  return (
    <div className={`card ${isKey ? 'ring-2 ring-brand-500/40' : ''}`}>
      {/* Header */}
      <button
        className="w-full flex items-start gap-3 text-left rounded-xl active:bg-slate-50 dark:active:bg-slate-800/60 transition"
        onClick={() => setOpen((o) => !o)}
      >
        <ProgressRing progress={completed} size={44} strokeWidth={4}
          label={completed >= 1 ? '✓' : `${Math.round(completed * 100)}%`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{kindIcon[session.kind]}</span>
            <span className="text-sm font-semibold leading-tight">{session.title}</span>
            {isKey && (
              <span className="chip bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 text-[10px]">
                Key session
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{session.purpose}</div>
          <div className="flex gap-1.5 mt-2 flex-wrap items-center">
            {session.stageTags.map((t) => <StageBadge key={t} tag={t} small />)}
            {session.run && <ZoneBadge zone={session.run.zone} compact />}
          </div>
        </div>
        <span className={`text-slate-400 text-sm mt-1 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Expanded — prescribed details + why today + logger */}
      {open && (
        <div className="mt-3 space-y-3 animate-slide-up">
          {/* Primer warm-up — inside the strength session it belongs to */}
          {session.kind === 'strength' && session.strength && (
            <PrimerSection slot={session.strength.slot} sessionId={session.id} />
          )}
          {/* Manual done-tick for sessions without a logger */}
          {isManualKind && (
            <button
              className={`w-full rounded-xl p-2.5 text-xs font-medium transition ${
                done
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
              onClick={() => { void putJournal(done ? '' : '1', `done:${session.id}`); hapticTick() }}
            >
              {done ? '✓ Done — tap to undo' : 'Mark done'}
            </button>
          )}
          {/* Prescribed details */}
          {session.run && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Prescribed
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Detail label="Distance" value={`${session.run.distanceKm} km`} />
                <Detail label="Pace" value={session.run.pace} />
                {session.run.hrCeiling && <Detail label="HR ceiling" value={`${session.run.hrCeiling} bpm`} />}
                {session.run.cadence && <Detail label="Cadence" value={session.run.cadence} />}
                {session.run.runWalk91 && <Detail label="Run-walk" value="9:1 from km 1" />}
                {session.run.carbsPerHour && <Detail label="Carbs" value={session.run.carbsPerHour} />}
              </div>
              {session.run.thresholdBlock && (
                <div className="text-xs text-slate-700 dark:text-slate-200 pt-1">
                  <Term term="Threshold">Threshold</Term> blocks: <span className="font-mono">{session.run.thresholdBlock}</span>
                </div>
              )}
              {session.run.mpBlock && (
                <div className="text-xs text-slate-700 dark:text-slate-200 pt-1">
                  <Term term="Marathon Pace">MP</Term> block: last <span className="font-mono">{session.run.mpBlock.distanceKm} km</span> at <span className="font-mono">{session.run.mpBlock.pace}</span>
                </div>
              )}
              {session.run.strides && (
                <div className="text-xs text-slate-700 dark:text-slate-200 pt-1">
                  <Term term="Strides">Strides</Term>: <span className="font-mono">{session.run.strides}</span>
                </div>
              )}
              <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 italic">{session.run.notes}</div>
            </div>
          )}

          {/* 9:1 alarm quick-start — the plan runs 9:1 from km 1 on every
              long run, so the alarm belongs on the session, not just race day */}
          {session.run?.runWalk91 && <RunWalk9to1Quick />}

          {session.swim && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Prescribed
              </div>
              <Detail label="Distance" value={session.swim.distance} />
              <Detail label="Type" value={session.swim.type === 'technique' ? 'Technique' : 'Recovery flush'} />
              <div className="text-xs text-slate-700 dark:text-slate-200 pt-1">
                Drills: <span className="font-mono">{session.swim.drills}</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 italic">
                Goal: {session.swim.goal}
              </div>
            </div>
          )}

          {session.strength && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Prescribed
              </div>
              <Detail label="Slot" value={session.strength.name} />
              <Detail label="When" value={session.strength.when} />
              <Link to="/exercises" className="btn-secondary text-xs w-full mt-2">
                View exercise library →
              </Link>
            </div>
          )}

          {/* Why today explainer */}
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 p-3">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setWhyOpen((o) => !o)}
            >
              <div className="text-xs font-semibold text-brand-700 dark:text-brand-100 uppercase tracking-wide">
                Why this session today
              </div>
              <span className="text-brand-700 dark:text-brand-200 text-xs">{whyOpen ? '−' : '+'}</span>
            </button>
            {whyOpen && (
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mt-2 animate-slide-up">
                {session.whyToday}
              </p>
            )}
          </div>

          {/* Logger — prescribed vs actual */}
          {session.kind === 'run' && <RunLogger session={session} date={date} existing={runLog ?? undefined} />}
          {session.kind === 'race' && <RunLogger session={session} date={date} existing={runLog ?? undefined} isRace />}
          {session.kind === 'swim' && <SwimLogger session={session} date={date} existing={swimLog ?? undefined} />}
          {session.kind === 'strength' && <StrengthLogger session={session} />}
        </div>
      )}
    </div>
  )
}

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] text-slate-500 dark:text-slate-400">{label}</div>
    <div className="font-mono text-xs text-slate-800 dark:text-slate-100">{value}</div>
  </div>
)

// Compute 0–1 completion based on what is logged
function computeCompletion(
  session: Session,
  setLogs: { done: boolean }[],
  runLog: { actualDistanceKm?: number; actualDurationSec?: number } | null | undefined,
  swimLog: { actualDistance?: string } | null | undefined,
  done: boolean,
): number {
  if (session.kind === 'rest' || session.kind === 'mobility' || session.kind === 'walk') {
    // No logger for these — tracked via the manual done-tick
    return done ? 1 : 0
  }
  if (session.kind === 'strength') {
    // Count done sets vs total prescribed sets for the slot
    const slot = session.strength?.slot
    const totalPrescribed = slot
      ? getExercisesForSlot(slot).reduce((sum, ex) => sum + (ex.prescribed[0]?.sets ?? 0), 0)
      : 8
    const doneCount = setLogs.filter((s) => s.done).length
    if (doneCount === 0 || totalPrescribed === 0) return 0
    return Math.min(1, doneCount / totalPrescribed)
  }
  if (session.kind === 'run' || session.kind === 'race') {
    if (!runLog) return 0
    if (runLog.actualDistanceKm && runLog.actualDurationSec) return 1
    if (runLog.actualDistanceKm || runLog.actualDurationSec) return 0.5
    return 0
  }
  if (session.kind === 'swim') {
    if (!swimLog) return 0
    if (swimLog.actualDistance) return 1
    return 0
  }
  return 0
}
