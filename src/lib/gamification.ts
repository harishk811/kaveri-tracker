import { addDays, format, parseISO } from 'date-fns'
import type { RunLog, MorningCheckIn } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Gamification — honest metrics computed from what is actually logged.
// No fake points: a streak is days with a logged run or check-in, a week is
// consistent when the day was logged, and achievements unlock on real data.
// ─────────────────────────────────────────────────────────────────────────────

export interface DayActivity {
  date: string
  logged: boolean
}

// Mark every day in [start, end] with whether it had a run log or check-in
export const dayActivity = (
  runLogs: RunLog[],
  checkIns: MorningCheckIn[],
  start: string,
  end: string,
): DayActivity[] => {
  const logged = new Set<string>()
  for (const r of runLogs) if (r.date >= start && r.date <= end) logged.add(r.date)
  for (const c of checkIns) if (c.date >= start && c.date <= end) logged.add(c.date)
  const days: DayActivity[] = []
  let d = start
  while (d <= end) {
    days.push({ date: d, logged: logged.has(d) })
    d = format(addDays(parseISO(d), 1), 'yyyy-MM-dd')
  }
  return days
}

// Consecutive logged days ending today (today may still be pending — the
// streak survives until the day is over without a log)
export const currentStreak = (activity: DayActivity[], today: string): number => {
  let i = activity.length - 1
  if (i >= 0 && activity[i].date === today && !activity[i].logged) i--
  let streak = 0
  for (; i >= 0; i--) {
    if (activity[i].logged) streak++
    else break
  }
  return streak
}

export const maxStreak = (activity: DayActivity[]): number => {
  let best = 0
  let cur = 0
  for (const d of activity) {
    cur = d.logged ? cur + 1 : 0
    if (cur > best) best = cur
  }
  return best
}

// Days logged in the Monday–Sunday window of `weekStart`
export const weekConsistency = (activity: DayActivity[], weekStart: string): number => {
  const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
  return activity.filter((a) => a.date >= weekStart && a.date <= weekEnd && a.logged).length
}

// ── Achievements ────────────────────────────────────────────────────────────

export interface AchievementCtx {
  runLogs: RunLog[]
  checkIns: MorningCheckIn[]
  maxStreak: number
  totalKm: number
  longestRunKm: number
  marathonBand?: string
  /** Consecutive days (ending today, today may be pending) with no pain logged */
  painFreeStreak: number
  /** Consecutive days with all five shin-routine movements ticked */
  shinStreak: number
  swimCount: number
  /** Weigh-ins inside the 74–76 kg band */
  weightInBandCount: number
  /** Fastest logged run pace in seconds per km */
  bestPaceSec: number | null
}

export interface Achievement {
  id: string
  icon: string
  label: string
  desc: string
  unlocked: (ctx: AchievementCtx) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-run', icon: '🏃', label: 'First run logged', desc: 'Log any run against the plan.', unlocked: (c) => c.runLogs.length > 0 },
  { id: 'streak-7', icon: '🔥', label: '7-day streak', desc: 'Log a run or check-in for 7 days straight.', unlocked: (c) => c.maxStreak >= 7 },
  { id: 'perfect-week', icon: '✅', label: 'Perfect week', desc: 'Log something every single day of a week.', unlocked: (c) => c.maxStreak >= 7 && c.checkIns.length >= 7 && c.runLogs.length >= 3 },
  { id: 'km-100', icon: '💯', label: '100 km club', desc: 'Log 100 km of running total.', unlocked: (c) => c.totalKm >= 100 },
  { id: 'km-300', icon: '🥉', label: '300 km club', desc: 'Log 300 km of running total.', unlocked: (c) => c.totalKm >= 300 },
  { id: 'km-500', icon: '🥈', label: '500 km club', desc: 'Log 500 km of running total.', unlocked: (c) => c.totalKm >= 500 },
  { id: 'long-run', icon: '⏱', label: 'Long-run finisher', desc: 'Log a single run of 18 km or more.', unlocked: (c) => c.longestRunKm >= 18 },
  { id: 'half-training', icon: '🏁', label: 'Half in training', desc: 'Log a single run of 21.1 km or more.', unlocked: (c) => c.longestRunKm >= 21.1 },
  { id: 'checkin-14', icon: '🌅', label: 'Two weeks of check-ins', desc: 'Save 14 morning check-ins.', unlocked: (c) => c.checkIns.length >= 14 },
  { id: 'checkin-30', icon: '📅', label: 'Month of check-ins', desc: 'Save 30 morning check-ins.', unlocked: (c) => c.checkIns.length >= 30 },
  { id: 'gate', icon: '🚪', label: 'Decision gate passed', desc: 'Save your marathon band after 27 Sep.', unlocked: (c) => Boolean(c.marathonBand) },
  { id: 'shin-week', icon: '🦶', label: 'Shin week', desc: 'Full six-minute shin routine, 7 days straight.', unlocked: (c) => c.shinStreak >= 7 },
  { id: 'pain-free-7', icon: '🛡️', label: 'Pain-free week', desc: '7 consecutive days with no pain logged.', unlocked: (c) => c.painFreeStreak >= 7 },
  { id: 'speed-6', icon: '⚡', label: 'Under 6:00/km', desc: 'Log any run faster than 6:00/km.', unlocked: (c) => c.bestPaceSec !== null && c.bestPaceSec < 360 },
  { id: 'swim-first', icon: '🏊', label: 'First swim logged', desc: 'Log any swim against the plan.', unlocked: (c) => c.swimCount > 0 },
  { id: 'in-band', icon: '⚖️', label: 'In the band', desc: '4 weigh-ins inside 74–76 kg.', unlocked: (c) => c.weightInBandCount >= 4 },
]

export const unlockedCount = (ctx: AchievementCtx): number =>
  ACHIEVEMENTS.filter((a) => a.unlocked(ctx)).length