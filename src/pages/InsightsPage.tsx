import { useState, useEffect, useMemo } from 'react'
import {
  ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar, Cell,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { PLAN } from '@/data/plan'
import { todayISO, weekStartDate, weekOfPlan, formatShortDate } from '@/lib/dates'
import { ACHIEVEMENTS, unlockedCount, dayActivity, maxStreak, weekConsistency, type AchievementCtx } from '@/lib/gamification'
import { RaceCockpit } from '@/pages/RacePage'
import { addDays, format, parseISO } from 'date-fns'
import type { MorningCheckIn, Shoe, RunLog, SwimLog } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────────────
// InsightsPage — metrics, charts, trends. Round 2.
//   - Weekly volume vs plan
//   - Weight 4-week rolling average vs the 74-76 kg band
//   - Resting HR trend with 7-bpm alarm line
//   - Sleep hours vs 7.5-8 h target
//   - Aerobic efficiency (pace at fixed HR over time)
//   - Shoe rotation with 600/800 km replacement alerts
//   - Fuel log with "nothing new after Week 12" indicator
// ─────────────────────────────────────────────────────────────────────────────────────

export const InsightsPage: React.FC = () => {
  const [tab, setTab] = useState<'overview' | 'body' | 'shoes' | 'fuel' | 'race' | 'pain'>('overview')
  // checkIns are loaded on demand; charts handle empty state gracefully
  const checkInMap = useStore((s) => s.checkInsByDate)
  const checkIns = useMemo(
    () => Object.values(checkInMap).filter((c): c is MorningCheckIn => c !== null),
    [checkInMap],
  )

  const runLogsBySession = useStore((s) => s.runLogsBySession)
  const runLogs = useMemo(
    () => Object.values(runLogsBySession).filter((r): r is RunLog => r !== null),
    [runLogsBySession],
  )
  const swimLogsBySession = useStore((s) => s.swimLogsBySession)
  const painLogs = useStore((s) => s.painLogs)
  const journalsByDate = useStore((s) => s.journalsByDate)
  const settings = useStore((s) => s.settings)
  const achievementCtx: AchievementCtx = useMemo(() => {
    const totalKm = runLogs.reduce((sum, r) => sum + (r.actualDistanceKm ?? 0), 0)
    const paceSecs = runLogs.map((r) => parsePace(r.avgPace ?? '')).filter((p) => p > 0)
    return {
      runLogs,
      checkIns,
      maxStreak: 0, // computed below from the activity timeline
      totalKm,
      longestRunKm: runLogs.reduce((m, r) => Math.max(m, r.actualDistanceKm ?? 0), 0),
      marathonBand: settings?.marathonBand,
      painFreeStreak: 0, // computed below once pain logs are loaded
      shinStreak: 0, // computed below from shin journals
      swimCount: Object.values(swimLogsBySession).filter((s): s is SwimLog => s !== null).length,
      weightInBandCount: checkIns.filter((c) => c.weightKg !== null && c.weightKg !== undefined && c.weightKg >= 74 && c.weightKg <= 76).length,
      bestPaceSec: paceSecs.length > 0 ? Math.min(...paceSecs) : null,
    }
  }, [runLogs, checkIns, settings?.marathonBand, swimLogsBySession])

  // Load the whole plan window on mount so charts show data even if the user
  // navigates straight here without visiting Today first.
  const loadCheckInsRange = useStore((s) => s.loadCheckInsRange)
  const loadRunLogsRange = useStore((s) => s.loadRunLogsRange)
  const loadSleepLogsRange = useStore((s) => s.loadSleepLogsRange)
  const loadFuelLogs = useStore((s) => s.loadFuelLogs)
  const loadPainLogs = useStore((s) => s.loadPainLogs)
  const loadSwimLogsAll = useStore((s) => s.loadSwimLogsAll)
  const loadShinJournalsRange = useStore((s) => s.loadShinJournalsRange)
  useEffect(() => {
    if (!settings?.startDate) return
    const end = format(addDays(settings.startDate, 97), 'yyyy-MM-dd')
    void loadCheckInsRange(settings.startDate, end)
    void loadRunLogsRange(settings.startDate, end)
    void loadSleepLogsRange(settings.startDate, end)
    void loadFuelLogs(settings.startDate, end)
    void loadPainLogs(settings.startDate, end)
    void loadSwimLogsAll()
    void loadShinJournalsRange(settings.startDate, end)
  }, [settings?.startDate, loadCheckInsRange, loadRunLogsRange, loadSleepLogsRange, loadFuelLogs, loadPainLogs, loadSwimLogsAll, loadShinJournalsRange])

  // maxStreak from the same timeline the Today page uses
  const maxStreakVal = useMemo(() => {
    if (!settings?.startDate) return 0
    const end = todayISO()
    return maxStreak(dayActivity(runLogs, checkIns, settings.startDate, end))
  }, [runLogs, checkIns, settings?.startDate])

  // Consecutive days without a pain log (today may still be pending)
  const painFreeStreakVal = useMemo(() => {
    if (!settings?.startDate) return 0
    const painDates = new Set(painLogs.map((p) => p.date))
    let d = todayISO()
    if (!painDates.has(d)) d = format(addDays(parseISO(d), -1), 'yyyy-MM-dd')
    let streak = 0
    while (d >= settings.startDate) {
      if (painDates.has(d)) break
      streak++
      d = format(addDays(parseISO(d), -1), 'yyyy-MM-dd')
    }
    return streak
  }, [painLogs, settings?.startDate])

  // Consecutive days with all five shin movements ticked (today may be pending)
  const shinStreakVal = useMemo(() => {
    if (!settings?.startDate) return 0
    let d = todayISO()
    if (!journalsByDate[`shin:${d}`]) d = format(addDays(parseISO(d), -1), 'yyyy-MM-dd')
    let streak = 0
    while (d >= settings.startDate) {
      const j = journalsByDate[`shin:${d}`]
      let allDone = false
      if (j?.text) {
        try {
          const parsed = JSON.parse(j.text) as { ticks?: boolean[] }
          allDone = Array.isArray(parsed.ticks) && parsed.ticks.length >= 5 && parsed.ticks.every(Boolean)
        } catch {
          allDone = false
        }
      }
      if (!allDone) break
      streak++
      d = format(addDays(parseISO(d), -1), 'yyyy-MM-dd')
    }
    return streak
  }, [journalsByDate, settings?.startDate])

  const ctx: AchievementCtx = useMemo(
    () => ({ ...achievementCtx, maxStreak: maxStreakVal, painFreeStreak: painFreeStreakVal, shinStreak: shinStreakVal }),
    [achievementCtx, maxStreakVal, painFreeStreakVal, shinStreakVal],
  )

  return (
    <div className="p-4 pt-safe-top space-y-4">
      <div className="card">
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Insights</div>
        <div className="text-xl font-bold mt-0.5">Trends & metrics</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Round 2 — the numbers that tell you whether the plan is working.
        </div>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-6 gap-1">
          <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabBtn>
          <TabBtn active={tab === 'body'} onClick={() => setTab('body')}>Body</TabBtn>
          <TabBtn active={tab === 'shoes'} onClick={() => setTab('shoes')}>Shoes</TabBtn>
          <TabBtn active={tab === 'fuel'} onClick={() => setTab('fuel')}>Fuel</TabBtn>
          <TabBtn active={tab === 'pain'} onClick={() => setTab('pain')}>Pain</TabBtn>
          <TabBtn active={tab === 'race'} onClick={() => setTab('race')}>Race</TabBtn>
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <AchievementsCard ctx={ctx} />
          <Overview
            checkIns={checkIns}
            score={{
              totalKm: ctx.totalKm,
              longestRunKm: ctx.longestRunKm,
              runs: runLogs.length,
              checkIns: checkIns.length,
              painFreeStreak: painFreeStreakVal,
              shinStreak: shinStreakVal,
            }}
          />
        </>
      )}
      {tab === 'body' && <BodyMetrics checkIns={checkIns} />}
      {tab === 'shoes' && <ShoeTracker />}
      {tab === 'fuel' && <FuelLog />}
      {tab === 'pain' && <PainTrend />}
      {tab === 'race' && <RaceCockpit />}
    </div>
  )
}

// ── Achievements — gamified milestones from real logged data ─────────────────

const AchievementsCard: React.FC<{ ctx: AchievementCtx }> = ({ ctx }) => {
  const unlocked = unlockedCount(ctx)
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Achievements</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {unlocked}/{ACHIEVEMENTS.length} unlocked — earned by logging, not points.
          </div>
        </div>
        <div className="text-2xl">🏆</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const done = a.unlocked(ctx)
          return (
            <div
              key={a.id}
              title={a.desc}
              className={`rounded-lg p-2 text-center border ${done
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-50'}`}
            >
              <div className={`text-xl ${done ? '' : 'grayscale'}`}>{a.icon}</div>
              <div className="text-[9px] leading-tight mt-1 text-slate-600 dark:text-slate-300">{a.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Overview — weekly volume vs plan ───────────────────────────────────────────────

interface OverviewScore {
  totalKm: number
  longestRunKm: number
  runs: number
  checkIns: number
  painFreeStreak: number
  shinStreak: number
}

const Overview: React.FC<{ checkIns: MorningCheckIn[]; score: OverviewScore }> = ({ checkIns, score }) => {
  const [view, setView] = useState<'weeks' | 'thisWeek'>('weeks')
  const runLogsBySession = useStore((s) => s.runLogsBySession)
  const runLogs = useMemo(
    () => Object.values(runLogsBySession).filter((r): r is RunLog => r !== null),
    [runLogsBySession],
  )
  const volumeData = useMemo(() => PLAN.map((w) => {
    const ws = weekStartDate(w.week)
    const we = weekStartDate(w.week + 1)
    const actual = runLogs
      .filter((r) => r.date >= ws && r.date < we)
      .reduce((s, r) => s + (r.actualDistanceKm ?? 0), 0)
    return {
      week: `W${w.week}`,
      planned: w.volumeKm,
      actual: Math.round(actual * 10) / 10,
      longRun: w.longRunKm,
    }
  }), [runLogs])

  const currentWeek = useMemo(() => {
    const w = weekOfPlan(todayISO())
    return w && w >= 1 && w <= PLAN.length ? w : null
  }, [])

  // Up to the current week: what has been logged vs what was planned.
  const progress = useMemo(() => {
    const upto = currentWeek ?? PLAN.length
    const planned = PLAN.slice(0, upto).reduce((s, w) => s + w.volumeKm, 0)
    const logged = volumeData.slice(0, upto).reduce((s, w) => s + w.actual, 0)
    return { planned, logged, pct: planned > 0 ? Math.round((logged / planned) * 100) : 0 }
  }, [volumeData, currentWeek])

  // This week, day by day: planned vs logged with the long run marked.
  const dayData = useMemo(() => {
    if (currentWeek === null) return []
    const planWeek = PLAN[currentWeek - 1]
    const ws = weekStartDate(currentWeek)
    const today = todayISO()
    return Array.from({ length: 7 }, (_, day) => {
      const date = format(addDays(parseISO(ws), day), 'yyyy-MM-dd')
      const planned = planWeek.sessions
        .filter((s) => s.day === day && s.run)
        .reduce((sum, s) => sum + (s.run?.distanceKm ?? 0), 0)
      const longRun = planWeek.sessions
        .filter((s) => s.day === day && s.run)
        .reduce((m, s) => Math.max(m, s.run?.distanceKm ?? 0), 0)
      const actual = runLogs
        .filter((r) => r.date === date)
        .reduce((sum, r) => sum + (r.actualDistanceKm ?? 0), 0)
      return {
        day: format(addDays(parseISO(ws), day), 'EEE'),
        date: format(addDays(parseISO(ws), day), 'd MMM'),
        planned: Math.round(planned * 10) / 10,
        actual: Math.round(actual * 10) / 10,
        longRun: longRun > 5 ? longRun : null,
        isToday: date === today,
      }
    })
  }, [runLogs, currentWeek])

  const weekProgress = useMemo(() => {
    const planned = dayData.reduce((s, d) => s + d.planned, 0)
    const logged = dayData.reduce((s, d) => s + d.actual, 0)
    return { planned, logged, pct: planned > 0 ? Math.round((logged / planned) * 100) : 0 }
  }, [dayData])

  const todayIdx = dayData.findIndex((d) => d.isToday)

  // 14-week consistency heatmap — one cell per week, days logged.
  const heatmap = useMemo(() => {
    const start = weekStartDate(1)
    const act = dayActivity(runLogs, checkIns, start, todayISO())
    return PLAN.map((w) => ({
      week: w.week,
      days: weekConsistency(act, weekStartDate(w.week)),
      stage: w.stageTags[0] ?? '',
    }))
  }, [runLogs, checkIns])

  const chip = (value: number, unit: string, label: string, ok?: boolean) => (
    <div className={`rounded-xl p-2.5 text-center ${ok !== undefined ? (ok ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20') : 'bg-slate-50 dark:bg-slate-800/50'}`}>
      <div className="text-lg font-bold tabular-nums">{value}<span className="text-[10px] text-slate-400 ml-0.5">{unit}</span></div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* ── Volume: all weeks ↔ this week ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Weekly volume — logged vs planned</div>
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-medium">
            <button
              onClick={() => setView('weeks')}
              aria-pressed={view === 'weeks'}
              className={`px-2.5 py-1 rounded-md transition-colors ${view === 'weeks' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
            >
              All weeks
            </button>
            <button
              onClick={() => setView('thisWeek')}
              aria-pressed={view === 'thisWeek'}
              className={`px-2.5 py-1 rounded-md transition-colors ${view === 'thisWeek' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
            >
              This week
            </button>
          </div>
        </div>

        {view === 'weeks' ? (
          <>
            {/* At-a-glance summary */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {chip(progress.logged, 'km', 'logged so far')}
              {chip(progress.planned, 'km', 'planned to date')}
              {chip(progress.pct, '%', 'consistency', progress.pct >= 80)}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-teal-500 inline-block" /> Logged km</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" /> Planned volume</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-orange-500 inline-block" /> Long run</span>
              <span className="ml-auto">Four deloads · peak 50 km (W11)</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volumeData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="planned" name="Planned km" stackId="v" fill="#cbd5e1" radius={[0, 0, 0, 0]} barSize={14} />
                  <Bar dataKey="actual" name="Logged km" stackId="v" fill="#0d9488" radius={[3, 3, 0, 0]} barSize={14} />
                  <Line type="monotone" dataKey="longRun" name="Planned long run" stroke="#f97316" strokeWidth={2} dot={{ r: 2.5 }} />
                  {currentWeek !== null && (
                    <ReferenceLine x={`W${currentWeek}`} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'now', fontSize: 9, fill: '#6366f1', position: 'insideTopLeft' }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {chip(weekProgress.logged, 'km', 'logged this week')}
              {chip(weekProgress.planned, 'km', 'planned this week')}
              {chip(weekProgress.pct, '%', 'on track', weekProgress.pct >= 80)}
            </div>
            <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-teal-500 inline-block" /> Logged km</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" /> Planned volume</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-orange-500 inline-block" /> Long run</span>
              {todayIdx >= 0 && <span className="ml-auto">▲ today</span>}
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dayData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} labelFormatter={(_, p) => p?.[0]?.payload?.date ?? ''} />
                  <Bar dataKey="planned" name="Planned km" stackId="v" fill="#cbd5e1" barSize={16}>
                    {dayData.map((d) => <Cell key={d.day} fill={d.isToday ? '#94a3b8' : '#cbd5e1'} />)}
                  </Bar>
                  <Bar dataKey="actual" name="Logged km" stackId="v" radius={[3, 3, 0, 0]} barSize={16}>
                    {dayData.map((d) => <Cell key={d.day} fill={d.isToday ? '#115e59' : '#0d9488'} />)}
                  </Bar>
                  <Line type="monotone" dataKey="longRun" name="Planned long run" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  {todayIdx >= 0 && (
                    <ReferenceLine x={dayData[todayIdx].day} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'today', fontSize: 9, fill: '#6366f1', position: 'insideTopLeft' }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* ── Block scoreboard ── */}
      <StrainMeter runLogs={runLogs} />
      <div className="card">
        <div className="text-sm font-semibold mb-2">Block scoreboard</div>
        <div className="grid grid-cols-3 gap-2">
          <ScoreTile icon="📏" value={`${Math.round(score.totalKm)}`} unit="km" label="total logged" />
          <ScoreTile icon="⏱" value={`${score.longestRunKm}`} unit="km" label="longest run" />
          <ScoreTile icon="🏃" value={`${score.runs}`} unit="" label="runs logged" />
          <ScoreTile icon="🌅" value={`${score.checkIns}`} unit="" label="check-ins" />
          <ScoreTile icon="🛡️" value={`${score.painFreeStreak}`} unit="d" label="pain-free streak" />
          <ScoreTile icon="🦶" value={`${score.shinStreak}`} unit="d" label="shin routine streak" />
        </div>
      </div>

      {/* ── 14-week consistency heatmap ── */}
      <div className="card">
        <div className="text-sm font-semibold mb-1">Consistency heatmap</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
          Days with a run log or check-in, per week of the plan. Full row = honest week.
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
          {heatmap.map((h) => (
            <div key={h.week} title={`Week ${h.week} (${h.stage}) — ${h.days}/7 days logged`} className="text-center">
              <div className={`rounded-md h-7 flex items-center justify-center text-[9px] font-semibold ${h.days === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                : h.days <= 3 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200'
                : h.days <= 5 ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-200'
                : h.days >= 7 ? 'bg-teal-500 text-white'
                : 'bg-teal-300 dark:bg-teal-600 text-teal-900 dark:text-teal-50'}`}>
                {h.days}
              </div>
              <div className="text-[8px] text-slate-400 mt-0.5">W{h.week}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-2">Aerobic efficiency trend</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
          Pace at a fixed HR (145 bpm) over the block. If your easy pace at 145 bpm drops, the plan is working. (Requires logged runs with HR + pace.)
        </div>
        <AerobicEfficiencyChart checkIns={checkIns} />
      </div>

      {/* Cadence trend — the plan's #1 shin defence, made visible */}
      <CadenceTrend runLogs={runLogs} />
    </div>
  )
}

// ── Strain meter (ACWR) — acute vs chronic load ─────────────────────────────────

const StrainMeter: React.FC<{ runLogs: RunLog[] }> = ({ runLogs }) => {
  const acwr = useMemo(() => {
    const today = todayISO()
    const sum = (from: string, to: string) =>
      runLogs.filter((r) => r.date >= from && r.date <= to).reduce((s, r) => s + (r.actualDistanceKm ?? 0), 0)
    const acute = sum(format(addDays(parseISO(today), -6), 'yyyy-MM-dd'), today)
    // Chronic baseline = the 28 days BEFORE today — a single run today must not
    // spike the ratio into "Spike risk" on a fresh plan.
    const chronic = sum(format(addDays(parseISO(today), -28), 'yyyy-MM-dd'), format(addDays(parseISO(today), -1), 'yyyy-MM-dd'))
    const chronicWeek = (chronic / 28) * 7
    const ratio = chronicWeek > 0 ? acute / chronicWeek : 0
    return { acute, chronicWeek, ratio }
  }, [runLogs])

  const zone =
    acwr.ratio === 0
      ? { label: 'No load yet', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', note: 'Log runs and the meter wakes up.' }
      : acwr.ratio < 0.8
      ? { label: 'Undertraining', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20', note: 'Below 0.8 — the load is dropping. Fine during deloads, wasteful otherwise.' }
      : acwr.ratio <= 1.3
      ? { label: 'Sweet spot', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20', note: 'Between 0.8 and 1.3 — load is building at the right rate.' }
      : acwr.ratio <= 1.5
      ? { label: 'Caution', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', note: 'Above 1.3 — the week is spiking vs the month. Hold volume flat.' }
      : { label: 'Spike risk', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', note: 'Above 1.5 — this is where shin splints get manufactured. Take an easy day.' }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold">Strain meter (ACWR)</div>
        <span className={`chip ${zone.bg} ${zone.color} text-[10px]`}>{zone.label}</span>
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
        Acute load (last 7 days) vs chronic load (last 4 weeks). The ratio that protects the tibia.
      </div>
      <div className="flex items-end gap-2 mb-3">
        <div className={`text-3xl font-bold tabular-nums ${zone.color}`}>{acwr.ratio > 0 ? acwr.ratio.toFixed(2) : '—'}</div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 pb-1">
          {Math.round(acwr.acute)} km this week · {Math.round(acwr.chronicWeek)} km chronic/week
        </div>
      </div>
      {/* Zone bar — green sweet spot with amber/red spike zones to the right */}
      <div className="h-2.5 rounded-full overflow-hidden flex mb-2">
        <div className="bg-blue-400 w-1/3" />
        <div className="bg-green-500 w-[23%]" />
        <div className="bg-amber-400 w-[7%]" />
        <div className="bg-red-500 w-[13%]" />
        <div className="bg-slate-200 dark:bg-slate-700 flex-1" />
      </div>
      <div className="flex justify-between text-[9px] text-slate-400">
        <span>0.5</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2.0+</span>
      </div>
      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">{zone.note}</div>
    </div>
  )
}

// ── Cadence trend — avg cadence per logged run ─────────────────────────────────

const CadenceTrend: React.FC<{ runLogs: RunLog[] }> = ({ runLogs }) => {
  const data = useMemo(
    () =>
      runLogs
        .filter((r) => r.avgCadence && r.avgCadence > 0)
        .map((r) => ({ date: formatShortDate(r.date), cadence: r.avgCadence! }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-12),
    [runLogs],
  )

  if (data.length < 2) {
    return (
      <div className="card">
        <div className="text-sm font-semibold mb-2">Cadence trend</div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Log cadence (spm) on at least 2 runs to see the trend. Target band 172–178.
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Cadence trend</div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">Target 172–178 spm</div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <YAxis domain={['dataMin - 8', 'dataMax + 8']} tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <ReferenceLine y={172} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '172', fontSize: 9 }} />
            <ReferenceLine y={178} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '178', fontSize: 9 }} />
            <Line type="monotone" dataKey="cadence" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Cadence (spm)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Pain trend — pain-log entries over time ────────────────────────────────────

const PainTrend: React.FC = () => {
  const painLogs = useStore((s) => s.painLogs)
  const sorted = useMemo(() => [...painLogs].sort((a, b) => a.date.localeCompare(b.date)), [painLogs])
  const data = useMemo(
    () => sorted.map((p) => ({ date: formatShortDate(p.date), intensity: p.intensity, location: p.location, type: p.type, light: p.light })),
    [sorted],
  )
  const red = sorted.filter((p) => p.light === 'red').length
  const amber = sorted.filter((p) => p.light === 'amber').length
  const latest = sorted[sorted.length - 1]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
          <div className="text-lg font-bold tabular-nums">{sorted.length}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">pain entries</div>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-2.5 text-center">
          <div className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-200">{amber}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">amber flags</div>
        </div>
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-2.5 text-center">
          <div className="text-lg font-bold tabular-nums text-red-700 dark:text-red-200">{red}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">red flags</div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-2">Pain log over time</div>
        {data.length === 0 ? (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
            No pain logged — that's the best chart in the app. Log from Today's recovery checks when anything shows up.
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: unknown, n: unknown) => [`${v}/10`, n as string]} labelFormatter={(_l: unknown, p) => `${p?.[0]?.payload?.location ?? ''} · ${p?.[0]?.payload?.type ?? ''}`} />
                <ReferenceLine y={4} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'amber', fontSize: 9 }} />
                <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'red', fontSize: 9 }} />
                <Line type="monotone" dataKey="intensity" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Intensity" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="card">
          <div className="text-sm font-semibold mb-2">
            Latest {Math.min(10, sorted.length)} {sorted.length > 10 ? 'of ' + sorted.length : ''} entries
          </div>
          <div className="space-y-1.5">
            {[...sorted].reverse().slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className={`chip text-[9px] ${p.light === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200' : p.light === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'}`}>
                  {p.light}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{formatShortDate(p.date)} · {p.location} · {p.type}</span>
                <span className="ml-auto font-mono tabular-nums text-slate-500 dark:text-slate-400">{p.intensity}/10</span>
              </div>
            ))}
          </div>
          {latest && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              Latest: {latest.location} · {latest.type} · {latest.intensity}/10 on {formatShortDate(latest.date)}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ScoreTile: React.FC<{ icon: string; value: string; unit: string; label: string }> = ({ icon, value, unit, label }) => (
  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
    <div className="text-base">{icon}</div>
    <div className="text-sm font-bold tabular-nums mt-0.5">{value}<span className="text-[9px] text-slate-400 ml-0.5">{unit}</span></div>
    <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{label}</div>
  </div>
)

// ── Aerobic efficiency — derived from logged runs ───────────────────────────────────

const AerobicEfficiencyChart: React.FC<{ checkIns: MorningCheckIn[] }> = ({ checkIns: _checkIns }) => {
  const runLogsBySession = useStore((s) => s.runLogsBySession)
  const runLogs = useMemo(
    () => Object.values(runLogsBySession).filter((r): r is RunLog => r !== null),
    [runLogsBySession],
  )

  const data = useMemo(() => {
    // Normalise every run to pace at a fixed HR of 145 bpm so runs of
    // different efforts are comparable: paceAt145 = actualPace × avgHr ÷ 145.
    return runLogs
      .filter((r) => r.avgHr && r.avgPace && r.actualDistanceKm && r.actualDistanceKm >= 5)
      .map((r) => {
        const paceSec = parsePace(r.avgPace!)
        return {
          date: formatShortDate(r.date),
          paceAtHr: r.avgHr ? Math.round((paceSec * r.avgHr) / 145) : null,
          hr: r.avgHr,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12)
  }, [runLogs])

  if (data.length < 2) {
    return (
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Log at least 2 runs with avg HR + pace to see the trend.
      </div>
    )
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="paceAtHr" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} name="Pace @ 145 bpm (sec/km)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const parsePace = (pace: string): number => {
  // "M:SS/km" → seconds per km
  const m = pace.match(/(\d+):(\d+)/)
  if (!m) return 0
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

// ── Body metrics — weight + RHR + sleep ───────────────────────────────────────────

const BodyMetrics: React.FC<{ checkIns: MorningCheckIn[] }> = ({ checkIns }) => {
  const sorted = useMemo(() => [...checkIns].sort((a, b) => a.date.localeCompare(b.date)), [checkIns])
  const last12 = sorted.slice(-12)

  const weightData = last12.map((c) => ({ date: formatShortDate(c.date), weight: c.weightKg ?? null }))
  const rhrData = last12.map((c) => ({ date: formatShortDate(c.date), rhr: c.rhr ?? null }))
  const sleepData = last12.map((c) => ({ date: formatShortDate(c.date), sleep: c.sleepHours ?? null }))

  return (
    <div className="space-y-3">
      {/* Weight with 74-76 band */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Weight (kg)</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Target band 74–76 kg · 4-wk rolling avg</div>
        </div>
        {weightData.some((d) => d.weight !== null) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis domain={[70, 80]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <ReferenceLine y={74} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '74', fontSize: 9 }} />
                <ReferenceLine y={76} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '76', fontSize: 9 }} />
                <Line type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart label="Log weight on Sunday check-ins to see the trend." />
        )}
        <div className="text-[10px] text-amber-700 dark:text-amber-200 mt-2">
          Weight falling &gt;1 kg in a fortnight = muscle spent as fuel. Add 300–400 kcal/day.
        </div>
      </div>

      {/* RHR with 7-bpm alarm */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Resting HR (bpm)</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">+7 bpm × 2 days = rest day</div>
        </div>
        {rhrData.some((d) => d.rhr !== null) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rhrData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="rhr" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart label="Log RHR on morning check-ins to see the trend." />
        )}
        <div className="text-[10px] text-amber-700 dark:text-amber-200 mt-2">
          A rise of more than 7 bpm above baseline for two consecutive mornings = take an unplanned easy day.
        </div>
      </div>

      {/* Sleep with 7.5-8 h target */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Sleep (hours)</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Target 7.5–8 h</div>
        </div>
        {sleepData.some((d) => d.sleep !== null) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis domain={[5, 10]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <ReferenceLine y={7.5} stroke="#22c55e" strokeDasharray="4 4" />
                <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="sleep" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart label="Log sleep hours on morning check-ins to see the trend." />
        )}
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
          Sleep is a programmed variable, not a lifestyle preference. Most muscle repair happens overnight.
        </div>
      </div>
    </div>
  )
}

const EmptyChart: React.FC<{ label: string }> = ({ label }) => (
  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
    {label}
  </div>
)

// ── Shoe tracker ─────────────────────────────────────────────────────────────────

const ShoeTracker: React.FC = () => {
  const shoes = useStore((s) => s.shoes)
  const loadShoes = useStore((s) => s.loadShoes)
  const putShoe = useStore((s) => s.putShoe)
  const deleteShoe = useStore((s) => s.deleteShoe)
  const [name, setName] = useState('')
  const [km, setKm] = useState('')

  useEffect(() => { void loadShoes() }, [loadShoes])

  const addShoe = () => {
    if (!name) return
    void putShoe({
      id: `shoe-${Date.now()}`,
      name,
      km: Number(km) || 0,
      addedAt: new Date().toISOString(),
    })
    setName('')
    setKm('')
  }

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-sm font-semibold mb-1">Shoe rotation</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Rotate two pairs. Replace at 600–800 km. Never run one direction along a cambered road edge — turn around halfway.
        </div>
      </div>

      <div className="card space-y-2">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Add a pair</div>
        <div className="flex gap-2">
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Brooks Adrenaline 22"
            className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
          <input
            type="number" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)}
            placeholder="km on them"
            className="w-24 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
          <button className="btn-primary" onClick={addShoe} disabled={!name}>Add</button>
        </div>
      </div>

      {shoes.length > 0 ? (
        <div className="space-y-2">
          {shoes.map((shoe) => (
            <ShoeRow key={shoe.id} shoe={shoe} onAddKm={(delta) => {
              void putShoe({ ...shoe, km: shoe.km + delta })
            }} onDelete={() => void deleteShoe(shoe.id)} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-4 text-xs text-slate-500 dark:text-slate-400">
          No shoes added yet.
        </div>
      )}
    </div>
  )
}

const ShoeRow: React.FC<{
  shoe: Shoe
  onAddKm: (delta: number) => void
  onDelete: () => void
}> = ({ shoe, onAddKm, onDelete }) => {
  const [addKm, setAddKm] = useState('')
  const putShoe = useStore((s) => s.putShoe)
  const pct = Math.min(100, (shoe.km / 800) * 100)
  const status = shoe.km >= 800 ? 'replace now' : shoe.km >= 600 ? 'replace soon' : 'ok'
  const statusColor = shoe.km >= 800 ? 'red' : shoe.km >= 600 ? 'amber' : 'green'
  const [retired, setRetired] = useState(shoe.retired ?? false)

  const retire = () => {
    setRetired(true)
    void putShoe({ ...shoe, retired: true })
  }

  return (
    <div className={`card ${retired ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{shoe.name}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {shoe.km} km {retired && '· retired'}
          </div>
        </div>
        <span className={`chip text-[10px] ${
          statusColor === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' :
          statusColor === 'amber' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
          'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
        }`}>
          {status}
        </span>
      </div>
      {/* Wear bar */}
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-2">
        <div className={`h-full rounded-full ${
          statusColor === 'red' ? 'bg-red-500' :
          statusColor === 'amber' ? 'bg-amber-500' :
          'bg-green-500'
        }`} style={{ width: `${pct}%` }} />
      </div>
      {/* Quick add km */}
      {!retired && (
        <div className="flex gap-1.5 mt-2">
          <input
            type="number" inputMode="decimal" value={addKm} onChange={(e) => setAddKm(e.target.value)}
            placeholder="+ km after today's run"
            className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
          />
          <button className="btn-secondary text-xs" onClick={() => {
            const n = Number(addKm)
            if (n > 0) { onAddKm(n); setAddKm('') }
          }}>+ Add</button>
          <button className="btn-ghost text-xs" onClick={retire}>Retire</button>
        </div>
      )}
      <button onClick={onDelete} className="text-[10px] text-slate-400 hover:text-red-500 mt-1">Delete</button>
    </div>
  )
}

// ── Fuel log ───────────────────────────────────────────────────────────────────────

const FuelLog: React.FC = () => {
  const fuelLogs = useStore((s) => s.fuelLogs)
  const loadFuelLogs = useStore((s) => s.loadFuelLogs)
  const putFuelLog = useStore((s) => s.putFuelLog)
  const [brand, setBrand] = useState('')
  const [count, setCount] = useState('1')
  const [timing, setTiming] = useState('')
  const [tested, setTested] = useState(false)

  useEffect(() => {
    const end = todayISO()
    const start = weekStartDate(1)
    void loadFuelLogs(start, end)
  }, [loadFuelLogs])

  const addFuel = () => {
    if (!brand) return
    void putFuelLog({
      date: todayISO(),
      sessionId: 'manual',
      brand,
      count: Number(count) || 1,
      timing: timing || 'unspecified',
      testedOnLongRun: tested,
    })
    setBrand('')
    setCount('1')
    setTiming('')
    setTested(false)
  }

  // Brands tested on long runs (the "nothing new after Week 12" indicator)
  const testedBrands = new Set(fuelLogs.filter((f) => f.testedOnLongRun).map((f) => f.brand))

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-sm font-semibold mb-1">Fuel log</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Log each gel brand tested on long runs. The "nothing new after Week 12" rule means everything you will use on race day must be tested by then.
        </div>
      </div>

      <div className="card space-y-2">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Log a test</div>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
            placeholder="Brand / gel name"
            className="col-span-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
          <input
            type="number" inputMode="numeric" min="1" value={count} onChange={(e) => setCount(e.target.value)}
            placeholder="count"
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
        <input
          type="text" value={timing} onChange={(e) => setTiming(e.target.value)}
          placeholder="Timing (e.g. min 45, every 30 min)"
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={tested} onChange={(e) => setTested(e.target.checked)} />
          Tested on a Week 9, 11, 12 long run
        </label>
        <button className="btn-primary w-full" onClick={addFuel} disabled={!brand}>Add</button>
      </div>

      {fuelLogs.length > 0 ? (
        <div className="space-y-2">
          {[...fuelLogs].reverse().map((f) => (
            <div key={`${f.date}-${f.sessionId}-${f.brand}`} className="card flex items-center justify-between gap-2 py-2.5">
              <div>
                <div className="text-sm font-medium">{f.brand}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {f.count} × {f.timing} {f.testedOnLongRun && '· ✓ tested on long run'}
                </div>
              </div>
              <span className={`chip text-[10px] ${f.testedOnLongRun ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {f.testedOnLongRun ? 'tested' : 'pending'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-4 text-xs text-slate-500 dark:text-slate-400">
          No fuel logged yet. Start practising on the Week 3 long run.
        </div>
      )}

      <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-200">Nothing new after Week 12</div>
        <div className="text-[11px] text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
          After the Week 12 dress rehearsal, shoes, socks, gels, and breakfast are frozen. {testedBrands.size > 0 ? `${testedBrands.size} brand(s) tested.` : 'No brands tested yet.'}
        </div>
      </div>
    </div>
  )
}

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
