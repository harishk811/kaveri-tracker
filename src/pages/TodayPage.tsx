import { useEffect, useMemo, useState } from 'react'
import { differenceInCalendarDays, addDays, format, parseISO } from 'date-fns'
import { getSessionsForDate, PLAN, DAY_NAMES_FULL } from '@/data/plan'
import { todayISO, formatLongDate, formatShortDate, weekOfPlan, weekStartDate } from '@/lib/dates'
import { dayActivity, currentStreak, weekConsistency } from '@/lib/gamification'
import { SessionCard } from '@/components/SessionCard'
import { DailyGoals } from '@/components/DailyGoals'
import { DailyJournal } from '@/components/DailyJournal'
import { DateNav } from '@/components/DateNav'
import { ProgressRing } from '@/components/ProgressRing'
import { StageBadge } from '@/components/StageBadge'
import { TodayRecoveryFlows } from '@/components/TodayRecoveryFlows'
import { InCabWidget } from '@/components/InCabWidget'
import { useStore } from '@/store/useStore'
import type { StageTag, RunLog, MorningCheckIn as MorningCheckInType, Session } from '@/types'
import { Link } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// Today page — the home screen. Shows the current week, the day's sessions
// with tick-marks, morning check-in, daily journal, and a header with overall
// block progress. Date navigation (‹ date ›) lets you log or edit any day in
// the 14-week window — missed a run yesterday? Go back and log it.
// ─────────────────────────────────────────────────────────────────────────────

const kindIcon: Record<Session['kind'], string> = {
  run: '🏃',
  strength: '🏋️',
  swim: '🏊',
  walk: '🚶',
  rest: '😴',
  race: '🏁',
  mobility: '🧘',
}

export const TodayPage: React.FC = () => {
  const settings = useStore((s) => s.settings)
  const startDate = settings?.startDate ?? '2026-08-17'
  const planEnd = format(addDays(parseISO(startDate), 97), 'yyyy-MM-dd') // Week 14 Sunday
  const today = todayISO()
  const [selected, setSelected] = useState(today)
  // Defensive clamp into the plan window (state never leaves it via the UI,
  // but settings could theoretically load after first render)
  const viewDate = selected < startDate ? startDate : selected > planEnd ? planEnd : selected

  const todayDate = new Date(`${viewDate}T12:00:00`)
  const week = weekOfPlan(viewDate)
  const sessions = useMemo(() => getSessionsForDate(todayDate), [viewDate])
  const planWeek = PLAN.find((w) => w.week === week)
  const dayIdx = (todayDate.getDay() + 6) % 7

  // Gamification data — streak + week consistency from run logs & check-ins
  const runLogsBySession = useStore((s) => s.runLogsBySession)
  const checkInsByDate = useStore((s) => s.checkInsByDate)
  const loadRunLogsRange = useStore((s) => s.loadRunLogsRange)
  const loadCheckInsRange = useStore((s) => s.loadCheckInsRange)
  useEffect(() => {
    void loadRunLogsRange(startDate, today)
    void loadCheckInsRange(startDate, today)
  }, [startDate, today, loadRunLogsRange, loadCheckInsRange])
  const activity = useMemo(
    () => dayActivity(
      Object.values(runLogsBySession).filter((r): r is RunLog => r !== null),
      Object.values(checkInsByDate).filter((c): c is MorningCheckInType => c !== null),
      startDate,
      today,
    ),
    [runLogsBySession, checkInsByDate, startDate, today],
  )
  const streak = currentStreak(activity, today)
  const weekLogged = weekConsistency(activity, weekStartDate(weekOfPlan(today)))

  // Next week at a glance — the week ahead starts planned, not discovered.
  const nextWeek = useMemo(
    () => (week >= 1 && week < PLAN.length ? PLAN.find((w) => w.week === week + 1) ?? null : null),
    [week],
  )

  // Missed & catch-up — plan sessions from the last 3 days with no log at all.
  const swimLogsBySession = useStore((s) => s.swimLogsBySession)
  const setLogsBySession = useStore((s) => s.setLogsBySession)
  const journalsByDate = useStore((s) => s.journalsByDate)
  const loadSetLogs = useStore((s) => s.loadSetLogs)
  const loadSwimLog = useStore((s) => s.loadSwimLog)
  const loadJournal = useStore((s) => s.loadJournal)
  useEffect(() => {
    for (let i = 1; i <= 3; i++) {
      const d = format(addDays(parseISO(today), -i), 'yyyy-MM-dd')
      for (const s of getSessionsForDate(new Date(`${d}T12:00:00`))) {
        if (s.kind === 'strength') void loadSetLogs(s.id)
        else if (s.kind === 'swim') void loadSwimLog(s.id)
        else if (s.kind === 'walk' || s.kind === 'rest' || s.kind === 'mobility') void loadJournal(`done:${s.id}`)
      }
    }
  }, [today, loadSetLogs, loadSwimLog, loadJournal])

  const missed = useMemo(() => {
    const out: { session: Session; dayName: string }[] = []
    for (let i = 1; i <= 3; i++) {
      const d = format(addDays(parseISO(today), -i), 'yyyy-MM-dd')
      const dayName = DAY_NAMES_FULL[(new Date(`${d}T12:00:00`).getDay() + 6) % 7]
      for (const s of getSessionsForDate(new Date(`${d}T12:00:00`))) {
        if (s.kind === 'rest') continue
        const logged =
          ((s.kind === 'run' || s.kind === 'race') && runLogsBySession[s.id]) ||
          (s.kind === 'swim' && swimLogsBySession[s.id]) ||
          (s.kind === 'strength' && (setLogsBySession[s.id]?.length ?? 0) > 0) ||
          ((s.kind === 'walk' || s.kind === 'mobility') && Boolean(journalsByDate[`done:${s.id}`]?.text))
        if (!logged) out.push({ session: s, dayName })
      }
    }
    return out
  }, [today, runLogsBySession, swimLogsBySession, setLogsBySession, journalsByDate])

  // Block progress: days elapsed / 98 total — real today, not the viewed date
  const blockProgress = useMemo(() => {
    const start = new Date('2026-08-17T00:00:00')
    const daysElapsed = differenceInCalendarDays(new Date(), start)
    return Math.max(0, Math.min(1, daysElapsed / 98))
  }, [])

  // Next key date countdown (10K race → decision gate → marathon), relative to
  // the plan anchor so it stays correct for any start date.
  const nextKeyDate = useMemo(() => {
    const anchor = parseISO(startDate)
    const todayD = new Date(`${today}T12:00:00`)
    const candidates = [
      { label: '10K race', date: addDays(anchor, 33) },
      { label: 'Decision gate', date: addDays(anchor, 41) },
      { label: 'Kaveri Marathon', date: addDays(anchor, 97) },
    ]
    let best: { label: string; date: Date; days: number } | null = null
    for (const c of candidates) {
      const days = differenceInCalendarDays(c.date, todayD)
      if (days < 0) continue
      if (!best || days < best.days) best = { label: c.label, date: c.date, days }
    }
    return best
  }, [startDate, today])

  if (week === 0) {
    return (
      <div className="p-4 pt-safe-top">
        <div className="card text-center py-8">
          <div className="text-4xl mb-3">📅</div>
          <div className="text-lg font-semibold mb-1">The plan starts 17 August 2026</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Come back on Week 1 Monday to start tracking.
          </div>
        </div>
      </div>
    )
  }

  if (week > 14) {
    return (
      <div className="p-4 pt-safe-top">
        <div className="card text-center py-8">
          <div className="text-4xl mb-3">🏁</div>
          <div className="text-lg font-semibold mb-1">The Kaveri block is done</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Step 2 (70.3 Goa) begins in December. See the Step 2 tab in the Schedule.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pt-safe-top space-y-4">
      {/* Header — date, week, block progress */}
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {formatLongDate(viewDate)}
            </div>
            <div className="text-2xl font-bold mt-0.5">
              Week {week} · {DAY_NAMES_FULL[dayIdx]}
            </div>
            {planWeek && (
              <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                {planWeek.stageTags.map((t: StageTag) => <StageBadge key={t} tag={t} small />)}
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                  {planWeek.volumeKm} km · long run {planWeek.longRunKm} km
                </span>
              </div>
            )}
          </div>
          <ProgressRing progress={blockProgress} size={64} strokeWidth={6}
            label={`${week}/14`}
            sublabel="weeks"
          />
        </div>

        {/* Date navigation — log or edit any day in the plan window */}
        <DateNav viewDate={viewDate} startDate={startDate} planEnd={planEnd} today={today} onChange={setSelected} />
        {planWeek && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold">This week's focus:</span> {planWeek.focus}
            </div>
          </div>
        )}
        {nextKeyDate && (
          <div className="mt-2 flex gap-1.5">
            <span className="chip bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 text-[10px]">
              🏁 {nextKeyDate.label} · {formatShortDate(format(nextKeyDate.date, 'yyyy-MM-dd'))} · in {nextKeyDate.days} day{nextKeyDate.days === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* Gamification strip — streak + week consistency */}
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-lg font-bold leading-tight">{streak}<span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">day streak</span></div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {streak > 0 ? 'Keep it alive — log a run or check-in today.' : 'Log a run or check-in today to start one.'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold leading-tight">{weekLogged}<span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">/7 days</span></div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">logged this week</div>
            <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-200 dark:bg-slate-800 ml-auto overflow-hidden">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${(weekLogged / 7) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recovery checks — due-today guided flows (per the document's schedule) */}
      <TodayRecoveryFlows
        week={week}
        dayIdx={dayIdx}
        qualityRun={sessions.some(
          (s) =>
            s.kind === 'run' &&
            (s.run?.zone === 'steady' || s.run?.zone === 'threshold' || s.run?.zone === 'mp' || s.run?.zone === '10k' || s.run?.zone === 'half' || s.run?.zone === 'raceMarathon' ||
              Boolean(s.run?.runWalk91 || s.run?.mpBlock || s.run?.thresholdBlock || s.run?.strides)),
        )}
      />

      {/* In cab? — toggle opens the cab exercises for the ride */}
      <InCabWidget />

      {/* Missed & catch-up — unlogged sessions from the last 3 days */}
      {missed.length > 0 && (
        <div className="card">
          <div className="text-sm font-semibold mb-2">Missed & catch-up</div>
          <div className="space-y-1.5">
            {missed.map((m) => (
              <div key={m.session.id} className="flex items-center gap-2 text-xs">
                <span className="text-base">{kindIcon[m.session.kind]}</span>
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  {m.dayName} · {m.session.title}
                </span>
                <Link to="/" className="ml-auto chip bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200 text-[10px]">
                  catch up
                </Link>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
            Missed a session? Log it from the day it happened — the week stays honest.
          </div>
        </div>
      )}

      {/* Sessions */}
      <div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">
          Sessions · {DAY_NAMES_FULL[dayIdx]}
        </div>
        {sessions.length === 0 ? (
          <div className="card text-center py-6">
            <div className="text-3xl mb-2">😌</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">No sessions scheduled for this day.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => <SessionCard key={s.id} session={s} date={viewDate} />)}
          </div>
        )}
      </div>

      {/* Daily goals — 6-min shin routine + spine extras, under the sessions */}
      <DailyGoals date={viewDate} />

      {/* Next week at a glance — volume, long run and the key sessions ahead.
          At the bottom, before the journal: it previews tomorrow, it doesn't
          gate the day. */}
      {nextWeek && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Next week at a glance</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Week {nextWeek.week}{dayIdx === 6 ? ' · starts tomorrow' : ''}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="chip bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 text-[10px]">
              {nextWeek.volumeKm} km volume
            </span>
            <span className="chip bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 text-[10px]">
              long run {nextWeek.longRunKm} km
            </span>
            {nextWeek.sessions.filter((s) => s.keySession).map((s) => (
              <span key={s.id} className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                {s.title}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 mt-2">{nextWeek.focus}</div>
        </div>
      )}

      {/* Daily journal */}
      <DailyJournal date={viewDate} />
    </div>
  )
}