import { useStore } from '@/store/useStore'
import {
  notifyShinRoutine, notifyLegsElevated, notifyWeighIn, notifyGreenLight, notifyInCabBreak, notifySessionReminder,
} from '@/lib/notifications'
import { hapticAlert } from '@/lib/haptics'
import { playReminderCue, primeAudio } from '@/lib/sound'
import { getSessionsForDate } from '@/data/plan'
import type { Settings } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Reminders — in-app scheduler. Each reminder fires while the app is open
// (notifications require the app to be running; a fully closed app needs a
// push server — see INSTALL.md). All times are editable in Settings.
// Re-scheduled on every settings change and app launch.
// ─────────────────────────────────────────────────────────────────────────────

interface Reminder {
  id: string
  getTime: (s: Settings) => string | null
  matchesDay: (dayIdx: number) => boolean
  fire: () => void
}

// Every fire: prime audio (user may have interacted since), chime, buzz
const cue = (): void => {
  primeAudio()
  playReminderCue()
  hapticAlert()
}

const REMINDERS: Reminder[] = [
  {
    id: 'shin',
    getTime: (s) => s.reminders.shin,
    matchesDay: () => true,
    fire: () => { notifyShinRoutine(); cue() },
  },
  {
    id: 'legs',
    getTime: (s) => s.reminders.legs,
    matchesDay: () => true,
    fire: () => { notifyLegsElevated(); cue() },
  },
  {
    id: 'weigh-in',
    getTime: (s) => s.reminders.weighIn,
    matchesDay: (d) => d === 0, // Sunday
    fire: () => { notifyWeighIn(); cue() },
  },
  {
    id: 'green-light',
    getTime: (s) => s.reminders.greenLight,
    matchesDay: (d) => d === 0, // Sunday
    fire: () => { notifyGreenLight(); cue() },
  },
  {
    // Today's sessions nudge — fires once a day with whatever the plan has today
    id: 'session',
    getTime: (s) => (s.reminders.sessionEnabled ? s.reminders.session : null),
    matchesDay: () => getSessionsForDate(new Date()).length > 0,
    fire: () => {
      const titles = getSessionsForDate(new Date()).map((s) => s.title)
      if (titles.length === 0) return
      notifySessionReminder(`Today: ${titles.length} session${titles.length > 1 ? 's' : ''}`, titles.join(' · '))
      cue()
    },
  },
  {
    // In-cab exercises — going to office (Tue–Thu)
    id: 'in-cab-go',
    getTime: (s) => (s.cab.enabled ? s.cab.go : null),
    matchesDay: (d) => d >= 1 && d <= 3, // Tue–Thu
    fire: () => { notifyInCabBreak(); cue() },
  },
  {
    // In-cab exercises — returning from office (Tue–Thu)
    id: 'in-cab-return',
    getTime: (s) => (s.cab.enabled ? s.cab.ret : null),
    matchesDay: (d) => d >= 1 && d <= 3,
    fire: () => { notifyInCabBreak(); cue() },
  },
  {
    // Test-only entry (never scheduled) so Settings can preview the in-cab nudge
    id: 'in-cab',
    getTime: () => null,
    matchesDay: () => false,
    fire: () => { notifyInCabBreak(); cue() },
  },
]

let timers: ReturnType<typeof setTimeout>[] = []

const clearTimers = (): void => {
  for (const t of timers) clearTimeout(t)
  timers = []
}

const minutesFromNow = (hours: number, mins: number): number => {
  const now = new Date()
  const target = new Date(now)
  target.setHours(hours, mins, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  return (target.getTime() - now.getTime()) / 60000
}

export const rescheduleReminders = (): void => {
  clearTimers()
  const s = useStore.getState().settings
  if (!s?.remindersEnabled) return
  for (const rem of REMINDERS) {
    const t = rem.getTime(s)
    if (!t) continue
    const [h, m] = t.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) continue
    const dayIdx = new Date().getDay()
    if (!rem.matchesDay(dayIdx)) continue
    const waitMs = minutesFromNow(h, m) * 60000
    if (waitMs > 24 * 3600 * 1000) continue // time already passed today; tomorrow's pass recomputes on next launch
    timers.push(setTimeout(() => {
      rem.fire()
      // Next week's occurrence (or tomorrow for daily ones) is picked up on
      // the next app launch / settings change; keep the day alive meanwhile.
      rescheduleReminders()
    }, waitMs))
  }
}

// Also used by the Settings page to preview a reminder without waiting
export const fireReminderNow = (id: string): void => {
  const rem = REMINDERS.find((r) => r.id === id)
  if (rem) rem.fire()
}