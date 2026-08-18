import { format, parseISO, differenceInCalendarDays, addDays, eachDayOfInterval, isValid } from 'date-fns'

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers — anchored to the plan start date (Week 1 Monday = 2026-08-17)
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_START_ISO = '2026-08-17'  // Week 1 Monday

export const todayISO = (): string => format(new Date(), 'yyyy-MM-dd')

export const parseISODate = (iso: string): Date => parseISO(iso)

export const formatLongDate = (iso: string): string => {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'EEEE, d MMMM yyyy') : iso
}

export const formatShortDate = (iso: string): string => {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'd MMM') : iso
}

export const dayOfWeek = (iso: string): number => {
  const d = parseISO(iso)
  // PDF uses Mon=0 … Sun=6; date-fns uses Sun=0 … Sat=6
  return (d.getDay() + 6) % 7
}

// Which week (1–14) of the plan is this date in? 0 = before, 15 = after.
export const weekOfPlan = (iso: string, startDate: string = PLAN_START_ISO): number => {
  const start = parseISO(startDate)
  const d = parseISO(iso)
  const diff = differenceInCalendarDays(d, start)
  if (diff < 0) return 0
  return Math.min(15, Math.floor(diff / 7) + 1)
}

// Get the Monday ISO date for a given plan week (1–14)
export const weekStartDate = (week: number, startDate: string = PLAN_START_ISO): string => {
  const start = parseISO(startDate)
  return format(addDays(start, (week - 1) * 7), 'yyyy-MM-dd')
}

// Range of ISO dates for a plan week
export const weekDates = (week: number, startDate: string = PLAN_START_ISO): string[] => {
  const start = parseISO(startDate)
  const ws = addDays(start, (week - 1) * 7)
  return eachDayOfInterval({ start: ws, end: addDays(ws, 6) }).map((d) => format(d, 'yyyy-MM-dd'))
}

// Format seconds as M:SS or H:MM:SS
export const formatDuration = (sec: number): string => {
  if (!isFinite(sec) || sec < 0) return '--'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec %  3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// Format seconds as pace (sec/km) → "M:SS/km"
export const formatPace = (secPerKm: number): string => {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '--'
  const m = Math.floor(secPerKm / 60)
  const s = Math.floor(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

// Convert "H:MM:SS" or "M:SS" to seconds
export const timeStringToSeconds = (t: string): number => {
  const parts = t.split(':').map((p) => parseInt(p, 10))
  if (parts.some(isNaN)) return NaN
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return NaN
}

// Day names matching the plan (Mon=0)
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
