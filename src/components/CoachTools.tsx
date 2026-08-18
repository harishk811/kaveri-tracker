import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { PLAN } from '@/data/plan'
import { EXERCISES } from '@/data/exercises'
import { todayISO, weekStartDate, formatShortDate } from '@/lib/dates'
import type { RaceRetrospective, Exercise, RunLog, MorningCheckIn } from '@/types'
import { notify } from '@/lib/notifications'

// ─────────────────────────────────────────────────────────────────────────────────────
// RaceRetrospective — guided post-race reflection. After 19 Sep, 27 Sep, 22 Nov:
// time, splits, what worked, what failed, fueling, pain. Feeds the decision gate
// automatically for the 27 Sep half.
// ─────────────────────────────────────────────────────────────────────────────────────

interface RetrospectiveProps {
  raceId: string
  raceName: string
  raceDate: string
  /** If this is the 27 Sep half, the result feeds the decision gate */
  isGate?: boolean
}

export const RaceRetrospectiveForm: React.FC<RetrospectiveProps> = ({ raceId, raceName, raceDate, isGate }) => {
  const retrospectives = useStore((s) => s.retrospectives)
  const loadRetrospectives = useStore((s) => s.loadRetrospectives)
  const putRetrospective = useStore((s) => s.putRetrospective)

  // Load retrospectives once on mount so existing entries appear
  useEffect(() => { void loadRetrospectives() }, [loadRetrospectives])

  const existing = retrospectives.find((r) => r.raceId === raceId)
  const [finishTime, setFinishTime] = useState(existing?.finishTime ?? '')
  const [whatWorked, setWhatWorked] = useState(existing?.whatWorked ?? '')
  const [whatFailed, setWhatFailed] = useState(existing?.whatFailed ?? '')
  const [fuelingNotes, setFuelingNotes] = useState(existing?.fuelingNotes ?? '')
  const [painNotes, setPainNotes] = useState(existing?.painNotes ?? '')
  const [gateBand, setGateBand] = useState(existing?.gateBand ?? '')
  const [overallNotes, setOverallNotes] = useState(existing?.overallNotes ?? '')
  const [saved, setSaved] = useState(false)

  const save = () => {
    const r: RaceRetrospective = {
      raceId,
      raceName,
      date: raceDate,
      finishTime,
      whatWorked,
      whatFailed,
      fuelingNotes,
      painNotes,
      gateBand: isGate ? gateBand : undefined,
      overallNotes,
    }
    void putRetrospective(r)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="card space-y-3">
      <div className="text-sm font-semibold">{raceName} · {formatShortDate(raceDate)}</div>

      <div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">Finish time (H:MM:SS)</div>
        <input
          type="text" value={finishTime} onChange={(e) => setFinishTime(e.target.value)}
          placeholder="e.g. 2:08:45"
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono"
        />
      </div>

      {isGate && (
        <div>
          <div className="text-[10px] text-brand-700 dark:text-brand-200 uppercase tracking-wide">This feeds the decision gate</div>
          <input
            type="text" value={gateBand} onChange={(e) => setGateBand(e.target.value)}
            placeholder="e.g. 4:30 — target live"
            className="w-full rounded-md border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1.5 text-sm font-mono"
          />
        </div>
      )}

      <textarea
        value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)}
        placeholder="What worked? (pacing, fuel, mindset)"
        rows={2}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />
      <textarea
        value={whatFailed} onChange={(e) => setWhatFailed(e.target.value)}
        placeholder="What failed? (went out too fast, stomach, cramps)"
        rows={2}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />
      <textarea
        value={fuelingNotes} onChange={(e) => setFuelingNotes(e.target.value)}
        placeholder="Fueling notes (gels, timing, stomach)"
        rows={2}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />
      <textarea
        value={painNotes} onChange={(e) => setPainNotes(e.target.value)}
        placeholder="Pain notes (where, when, how bad)"
        rows={2}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />
      <textarea
        value={overallNotes} onChange={(e) => setOverallNotes(e.target.value)}
        placeholder="Overall — what to remember for next time"
        rows={3}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />

      <button className="btn-primary w-full" onClick={save}>
        {saved ? '✓ Saved' : 'Save retrospective'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────────────
// WeeklyRecapCard — Sunday evening plain-text summary you can read or send to a coach.
// ─────────────────────────────────────────────────────────────────────────────────────

export const WeeklyRecapCard: React.FC<{ week: number }> = ({ week }) => {
  const recaps = useStore((s) => s.recaps)
  const putRecap = useStore((s) => s.putRecap)
  const checkInsByDate = useStore((s) => s.checkInsByDate)
  const runLogsBySession = useStore((s) => s.runLogsBySession)
  // Filter nulls (values can be null when a session has no log yet)
  const checkIns = useMemo(
    () => Object.values(checkInsByDate).filter((c): c is MorningCheckIn => c !== null),
    [checkInsByDate],
  )
  const runLogs = useMemo(
    () => Object.values(runLogsBySession).filter((r): r is RunLog => r !== null),
    [runLogsBySession],
  )
  const weekEnd = weekStartDate(week + 1)

  // Load the week's (and earlier) check-ins + run logs on mount so the recap
  // is correct even if those days were never opened this session.
  const settings = useStore((s) => s.settings)
  const loadCheckInsRange = useStore((s) => s.loadCheckInsRange)
  const loadRunLogsRange = useStore((s) => s.loadRunLogsRange)
  useEffect(() => {
    const start = settings?.startDate ?? todayISO()
    void loadCheckInsRange(start, weekEnd)
    void loadRunLogsRange(start, weekEnd)
  }, [settings?.startDate, weekEnd, loadCheckInsRange, loadRunLogsRange])

  const existing = recaps.find((r) => r.week === week)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // Auto-generate the summary from logged data
  const generated = useMemo(() => {
    if (!week || week > 14) return null
    const planWeek = PLAN.find((w) => w.week === week)
    if (!planWeek) return null
    const weekStart = weekStartDate(week)
    const weeksRuns = runLogs.filter((r) => r.date >= weekStart && r.date < weekEnd)
    const weeksCheckIns = checkIns.filter((c) => c.date >= weekStart && c.date < weekEnd).sort((a, b) => a.date.localeCompare(b.date))
    const totalKm = weeksRuns.reduce((s, r) => s + (r.actualDistanceKm ?? 0), 0)
    const plannedKm = planWeek.volumeKm
    const avgRhr = weeksCheckIns.filter((c): c is MorningCheckIn => c.rhr !== undefined).map((c) => c.rhr!)
    const rhrBaseline = avgRhr.length > 0 ? Math.min(...avgRhr) : undefined
    const rhrTrend = rhrBaseline !== undefined ? avgRhr.filter((r) => r > rhrBaseline + 7).length : 0
    const weights = weeksCheckIns.filter((c): c is MorningCheckIn => c.weightKg !== undefined).map((c) => c.weightKg!)
    const avgWeight = weights.length > 0 ? weights.reduce((s, w) => s + w, 0) / weights.length : undefined

    return `Week ${week} recap — ending ${formatShortDate(weekEnd)}

Volume: ${totalKm.toFixed(1)} km / ${plannedKm} km planned (${totalKm >= plannedKm ? 'on plan' : `${((totalKm / plannedKm) * 100).toFixed(0)}% of plan`})
Runs completed: ${weeksRuns.length}
Avg RHR: ${avgRhr.length > 0 ? Math.round(avgRhr.reduce((s, r) => s + r, 0) / avgRhr.length) : 'no data'}${rhrTrend > 0 ? ` · ⚠ ${rhrTrend} days >7 bpm over baseline` : ''}
Weight avg: ${avgWeight ? avgWeight.toFixed(1) + ' kg' : 'no data'} ${avgWeight && (avgWeight < 74 || avgWeight > 76) ? '⚠ outside 74–76 band' : '✓ in band'}

${notes || '(add your notes here)'}`
  }, [week, weekEnd, runLogs, checkIns, notes])

  const save = () => {
    if (!week) return
    void putRecap({
      week,
      weekEnding: weekEnd,
      volumeKm: '',
      volumeVsPlan: '',
      weightTrend: '',
      rhrTrend: '',
      amberFlags: '',
      notes,
      generatedAt: new Date().toISOString(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const copy = async () => {
    if (generated) {
      try {
        await navigator.clipboard.writeText(generated)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
        notify({ title: 'Recap copied', body: 'Paste into a message to your coach.', tag: 'recap' })
      } catch { /* ignore */ }
    }
  }

  if (!week || week > 14) return null

  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Weekly recap · Week {week}</div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          Sunday evening — read it, or copy it to send to a coach.
        </div>
      </div>

      {generated && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
          <pre className="text-[11px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">{generated}</pre>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Add anything the summary does not capture..."
          rows={2}
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
        />
        <div className="flex gap-2">
          <button className="btn-primary flex-1 text-xs" onClick={save}>{saved ? '✓ Saved' : 'Save'}</button>
          <button className="btn-secondary flex-1 text-xs" onClick={copy} disabled={!generated}>{copied ? '✓ Copied' : 'Copy summary'}</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────────────
// AdaptiveWeek — the missed-week rule. Mark a week partially done → suggests how to
// rejoin without panic catch-up (PDF Rule 10).
// ─────────────────────────────────────────────────────────────────────────────────────

export const AdaptiveWeekCard: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [missedWeek, setMissedWeek] = useState<number | ''>('')
  const [sessionsMissed, setSessionsMissed] = useState<number | ''>('')
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const computeSuggestion = () => {
    if (!missedWeek || missedWeek < 1 || missedWeek > 13) {
      setSuggestion('Enter a week between 1 and 13.')
      return
    }
    // Rule 10: reduce and rejoin, never make up. The plan pushes back 1 week.
    // The 2-session threshold decides whether the target band survives.
    const withinWindow = sessionsMissed === '' || sessionsMissed <= 2
    const note = sessionsMissed === ''
      ? ''
      : ` You missed ${sessionsMissed} session${sessionsMissed === 1 ? '' : 's'}.`
    setSuggestion(
      `Week ${missedWeek} partially missed. Treat this week as Week ${missedWeek} again — push everything back 1 week. ` +
      `Week ${missedWeek + 1} becomes what Week ${missedWeek} was meant to be, and so on.` + note +
      (withinWindow
        ? ` You're within the 2-session window — the marathon on 22 Nov stays where it is.`
        : ` You've missed more than 2 sessions — hold the rejoin week, but review whether the target band is still realistic before the next block.`) +
      ` Do NOT run a catch-up week — one panicked catch-up week ends the block. ` +
      `The four deloads absorb two lost weeks; trust them.`
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-800/60 transition"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Adaptive week — missed-week rule"
      >
        <div>
          <div className="text-sm font-semibold">Adaptive week — missed-week rule</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Illness, work, travel — reduce and rejoin, never make up.
          </div>
        </div>
        <span className={`text-slate-400 text-sm transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-slide-up">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Week missed (1–13)</div>
            <input
              type="number" inputMode="numeric" min="1" max="13"
              value={missedWeek} onChange={(e) => setMissedWeek(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 9"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Sessions missed (optional)</div>
            <input
              type="number" inputMode="numeric" min="0" max="14"
              value={sessionsMissed} onChange={(e) => setSessionsMissed(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 3"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
            />
          </div>
          <button className="btn-primary w-full" onClick={computeSuggestion} disabled={!missedWeek}>Get rejoin suggestion</button>
          {suggestion && (
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 p-2.5 animate-slide-up">
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────────────
// FormChecklistCard — pre-set form cues per exercise. Tick before loading.
// ─────────────────────────────────────────────────────────────────────────────────────

export const FormChecklistCard: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const formChecklists = useStore((s) => s.formChecklists)
  const putFormChecklist = useStore((s) => s.putFormChecklist)
  const today = todayISO()
  const existing = formChecklists.find((f) => f.exerciseId === exercise.id && f.date === today)

  // Build 3-4 cues from the exercise setup/execution/breathing/watchFor
  const cues = useMemo(() => [
    stripToCue(exercise.setup),
    stripToCue(exercise.execution),
    stripToCue(exercise.breathing),
    stripToCue(exercise.watchFor),
  ], [exercise])

  const [ticks, setTicks] = useState<boolean[]>(() =>
    existing?.cuesChecked ? cues.map((c) => existing.cuesChecked.includes(c)) : cues.map(() => false)
  )
  // Sync ticks when exercise changes (cues may change length)
  useEffect(() => {
    setTicks(existing?.cuesChecked ? cues.map((c) => existing.cuesChecked.includes(c)) : cues.map(() => false))
  }, [exercise, existing, cues])

  const [formScore, setFormScore] = useState(existing?.formScore?.toString() ?? '')

  const allTicked = ticks.every(Boolean)

  const save = () => {
    void putFormChecklist({
      exerciseId: exercise.id,
      date: today,
      cuesChecked: cues.filter((_, i) => ticks[i]),
      formScore: formScore ? Number(formScore) : undefined,
    })
  }

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 mt-2">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
        Form checklist · {exercise.name}
      </div>
      <div className="space-y-1.5">
        {cues.map((c, i) => (
          <label key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={ticks[i]}
              onChange={(e) => setTicks((arr) => arr.map((v, j) => j === i ? e.target.checked : v))}
              className="mt-0.5"
            />
            <span>{c}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <select
          value={formScore} onChange={(e) => setFormScore(e.target.value)}
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
        >
          <option value="">Self-score form (1–5)</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button className="btn-secondary flex-1 text-xs" onClick={save} disabled={!allTicked}>
          {allTicked ? '✓ Save' : 'Tick all to save'}
        </button>
      </div>
    </div>
  )
}

const stripToCue = (s: string): string => {
  // Take the first sentence or first 80 chars of a cue
  const firstSentence = s.split('.')[0]
  return firstSentence.length > 80 ? firstSentence.slice(0, 77) + '...' : firstSentence
}

// ─────────────────────────────────────────────────────────────────────────────────────
// SubstitutionLibrary — approved exercise swaps for when an exercise can't be done.
// Two-way map: searching an exercise returns its alternatives; searching an
// alternative returns the exercise it replaces ("x → y" works both directions).
// Results only appear once the user types; the search box itself is always
// visible. Alternatives that exist in the library resolve to the real exercise
// (name + "in library" tag) and are saved by their real id.
// ─────────────────────────────────────────────────────────────────────────────────────

// Static substitution map from the PDF + common strength-training knowledge
const SUBSTITUTIONS: { from: string; to: string[]; reason: string }[] = [
  { from: 'nordic-ham-curl', to: ['swiss-ball-ham-curl (already in plan)', 'slider-curl', 'glute-ham-raise'], reason: 'No Nordic setup available' },
  { from: 'bulgarian-split-squat', to: ['reverse lunge', 'step-up', 'goblet-back-squat (more weight)'], reason: 'Balance or knee issue' },
  { from: 'lat-pulldown', to: ['pull-ups (if strong enough)', 'band-assisted pull-ups', 'chest-supported-row (static hold)'], reason: 'No cable machine' },
  { from: 'straight-arm-pulldown', to: ['band-pull-aparts (already in primer)', 'dumbbell pullover'], reason: 'No cable machine' },
  { from: 'face-pull', to: ['band-pull-aparts', 'prone Y-T-W raise'], reason: 'No rope attachment' },
  { from: 'db-overhead-press', to: ['pike push-up (bodyweight)', 'landmine press'], reason: 'Shoulder mobility limited' },
  { from: 'incline-db-press', to: ['flat dumbbell press', 'push-up'], reason: 'No incline bench' },
  { from: 'romanian-deadlift', to: ['single-leg RDL', 'glute bridge', 'good morning'], reason: 'Lower back sensitivity' },
  { from: 'goblet-back-squat', to: ['box squat', 'split squat (bodyweight)', 'leg press'], reason: 'Knee sensitivity' },
  { from: 'single-leg-calf-raise', to: ['seated-calf-raise-soleus (already in plan)', 'double-leg calf raise'], reason: 'Balance or ankle issue' },
]

// Resolve an alternative string to a real library exercise when one exists —
// "chest-supported-row (static hold)" → the chest-supported-row card.
const resolveToEx = (raw: string): Exercise | null => {
  const base = raw.split(' (')[0].trim().toLowerCase()
  return (
    EXERCISES.find((e) => e.id === base) ??
    EXERCISES.find((e) => e.name.toLowerCase() === base) ??
    EXERCISES.find((e) => e.name.toLowerCase().includes(base) && base.length >= 4) ??
    null
  )
}

export const SubstitutionLibrary: React.FC = () => {
  const [q, setQ] = useState('')
  const [savedFlash, setSavedFlash] = useState<Set<string>>(new Set())
  const putSubstitution = useStore((s) => s.putSubstitution)
  const deleteSubstitution = useStore((s) => s.deleteSubstitution)
  const substitutions = useStore((s) => s.substitutions)
  const loadSubstitutions = useStore((s) => s.loadSubstitutions)

  useEffect(() => { void loadSubstitutions() }, [loadSubstitutions])

  const resolved = useMemo(
    () => SUBSTITUTIONS.map((s) => {
      const fromEx = EXERCISES.find((e) => e.id === s.from) ?? null
      return { ...s, fromEx, tos: s.to.map((raw) => ({ raw, ex: resolveToEx(raw) })) }
    }),
    [],
  )

  const ql = q.trim().toLowerCase()

  // Forward map: the exercise the user searched, with its alternatives.
  const results = useMemo(() => {
    if (!ql) return []
    return resolved.filter((s) => {
      const fromText = `${s.fromEx?.name ?? ''} ${s.fromEx?.muscles ?? ''} ${s.fromEx?.summary ?? ''} ${s.from}`.toLowerCase()
      return fromText.includes(ql) || s.tos.some((t) => t.raw.toLowerCase().includes(ql)) || s.reason.toLowerCase().includes(ql)
    })
  }, [ql, resolved])

  // Reverse map: alternatives that matched — so searching "pull-ups" says what it replaces.
  const reverseHits = useMemo(() => {
    if (!ql) return []
    return resolved.filter((s) => s.tos.some((t) => t.raw.toLowerCase().includes(ql)))
  }, [ql, resolved])

  const saved = useMemo(
    () => substitutions.map((sub) => ({
      ...sub,
      fromEx: EXERCISES.find((e) => e.id === sub.fromExerciseId) ?? null,
      toEx: EXERCISES.find((e) => e.id === sub.toExerciseId) ?? null,
    })),
    [substitutions],
  )

  const save = (from: string, to: string, reason: string) => {
    const key = `${from}|${to}`
    void putSubstitution({ fromExerciseId: from, toExerciseId: to, reason, context: 'manual' })
    setSavedFlash((prev) => new Set(prev).add(key))
    window.setTimeout(() => setSavedFlash((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    }), 1500)
  }

  const suggestions = ['lat pulldown', 'pull-ups', 'Nordic curl', 'RDL', 'calf raise']

  return (
    <div className="card space-y-3">
      <div>
        <div className="text-sm font-semibold">Can't do an exercise?</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Approved swaps from the plan's rehab logic — search the exercise <em>or</em> its swap; both sides of the map work.
        </div>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search an exercise or its swap…"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      />

      {!ql && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setQ(s)} className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {s}
            </button>
          ))}
        </div>
      )}

      {ql && results.length === 0 && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-500 dark:text-slate-400">
          No approved alternatives match "{q.trim()}" — the library's own exercises usually cover it.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Alternatives for your search
          </div>
          {results.map((s) => (
            <div key={s.from} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
              <div className="text-sm font-medium">{s.fromEx?.name ?? s.from}</div>
              <div className="text-[11px] text-amber-700 dark:text-amber-200 mt-0.5">{s.reason}</div>
              <div className="mt-1.5 space-y-1">
                {s.tos.map((t) => {
                  const key = `${s.from}|${t.ex?.id ?? t.raw.split(' (')[0].trim()}`
                  const flash = savedFlash.has(key)
                  return (
                    <div key={t.raw} className="flex items-center gap-2">
                      <span className="text-slate-400">→</span>
                      <span className="text-xs text-slate-700 dark:text-slate-200">{t.ex?.name ?? t.raw}</span>
                      {t.ex && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200">
                          in library
                        </span>
                      )}
                      <button
                        className="ml-auto btn-ghost text-[10px]"
                        onClick={() => save(s.from, t.ex?.id ?? t.raw.split(' (')[0].trim(), s.reason)}
                      >
                        {flash ? 'Saved ✓' : 'Use this'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Reverse mapping — the searched term was an alternative */}
          {reverseHits.some((s) => s.tos.some((t) => t.raw.toLowerCase().includes(ql))) && (
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-2.5 text-xs text-slate-600 dark:text-slate-300">
              "{q.trim()}" is an approved swap for{' '}
              {reverseHits.map((s, i) => (
                <span key={s.from}>
                  {i > 0 && ' and '}
                  <strong>{s.fromEx?.name ?? s.from}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {saved.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Your saved swaps
          </div>
          <div className="space-y-1">
            {saved.map((sub) => (
              <div key={`${sub.fromExerciseId}|${sub.toExerciseId}`} className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-300">{sub.fromEx?.name ?? sub.fromExerciseId}</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-600 dark:text-slate-300">{sub.toEx?.name ?? sub.toExerciseId}</span>
                <span className="text-[9px] text-slate-400 truncate">{sub.reason}</span>
                <button
                  aria-label={`Remove swap ${sub.fromExerciseId} → ${sub.toExerciseId}`}
                  className="ml-auto text-slate-400 hover:text-red-500 px-1"
                  onClick={() => void deleteSubstitution(sub.fromExerciseId, sub.toExerciseId)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
