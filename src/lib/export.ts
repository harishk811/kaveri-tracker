import { useStore } from '@/store/useStore'

// ─────────────────────────────────────────────────────────────────────────────
// CSV export — run logs, check-ins and journals as a spreadsheet-friendly
// CSV file, built from the same payload the JSON backup uses.
// ─────────────────────────────────────────────────────────────────────────────

const csvEscape = (v: unknown): string => {
  const s = v === undefined || v === null ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const rows = (header: string[], data: Array<Array<unknown>>): string =>
  [header.map(csvEscape).join(','), ...data.map((r) => r.map(csvEscape).join(','))].join('\n')

export const downloadCsv = (): void => {
  const s = useStore.getState()
  const settings = s.settings
  const start = settings?.startDate ?? '2026-08-17'

  const runs: Array<Array<unknown>> = []
  for (const log of Object.values(s.runLogsBySession)) {
    if (!log) continue
    runs.push([log.date, log.sessionId, log.actualDistanceKm ?? '', log.actualDurationSec ?? '', log.avgPace ?? '', log.avgHr ?? '', log.avgCadence ?? '', log.rpe ?? '', log.altered ? 'yes' : '', log.alteredReason ?? '', log.note ?? ''])
  }
  runs.sort((a, b) => String(a[0]).localeCompare(String(b[0])))

  const checkIns: Array<Array<unknown>> = []
  for (const ci of Object.values(s.checkInsByDate)) {
    if (!ci) continue
    checkIns.push([ci.date, ci.rhr ?? '', ci.sleepHours ?? '', ci.weightKg ?? '', ci.mood ?? '', ci.soreness ?? '', ci.motivation ?? '', ci.note ?? ''])
  }
  checkIns.sort((a, b) => String(a[0]).localeCompare(String(b[0])))

  const journals: Array<Array<unknown>> = []
  for (const j of Object.values(s.journalsByDate)) {
    if (!j) continue
    journals.push([j.date, j.text.replace(/\n/g, ' '), j.updatedAt ?? ''])
  }
  journals.sort((a, b) => String(a[0]).localeCompare(String(b[0])))

  const csv = [
    'Kaveri Tracker export · plan start ' + start,
    '',
    'RUNS',
    rows(['date', 'session', 'distance_km', 'duration_sec', 'avg_pace', 'avg_hr', 'avg_cadence', 'rpe', 'altered', 'altered_reason', 'note'], runs),
    '',
    'CHECK-INS',
    rows(['date', 'rhr', 'sleep_hours', 'weight_kg', 'mood', 'soreness', 'motivation', 'note'], checkIns),
    '',
    'JOURNAL',
    rows(['date', 'text', 'updated_at'], journals),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kaveri-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}