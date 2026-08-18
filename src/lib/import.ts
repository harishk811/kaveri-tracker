import { useStore } from '@/store/useStore'
import type { RunLog, MorningCheckIn, DailyJournal } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// CSV import — the mirror of lib/export.ts. Reads the same sectioned format
// (RUNS / CHECK-INS / JOURNAL) back into the store, so a CSV export from one
// device can be restored on another (or into a spreadsheet and back).
// ─────────────────────────────────────────────────────────────────────────────

const parseCsvLine = (line: string): string[] => {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQ = false
      } else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

const num = (v: string | undefined): number | undefined => {
  if (v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export interface CsvImportResult {
  runs: number
  checkIns: number
  journals: number
}

export const importCsv = (text: string): CsvImportResult => {
  const s = useStore.getState()
  let section: 'RUNS' | 'CHECK-INS' | 'JOURNAL' | null = null
  const runs: RunLog[] = []
  const checkIns: MorningCheckIn[] = []
  const journals: DailyJournal[] = []

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line === 'RUNS') { section = 'RUNS'; continue }
    if (line === 'CHECK-INS') { section = 'CHECK-INS'; continue }
    if (line === 'JOURNAL') { section = 'JOURNAL'; continue }
    if (line.startsWith('Kaveri Tracker export')) continue

    if (section === 'RUNS') {
      const c = parseCsvLine(line)
      if (c[0] === 'date') continue // header row
      const [date, sessionId, distanceKm, durationSec, avgPace, avgHr, cadence, rpe, altered, alteredReason, note] = c
      if (!date || !sessionId) continue
      runs.push({
        sessionId,
        date,
        actualDistanceKm: num(distanceKm),
        actualDurationSec: num(durationSec),
        avgPace: avgPace || undefined,
        avgHr: num(avgHr),
        avgCadence: num(cadence),
        rpe: num(rpe),
        altered: altered === 'yes',
        alteredReason: alteredReason || undefined,
        note: note || undefined,
      })
    } else if (section === 'CHECK-INS') {
      const c = parseCsvLine(line)
      if (c[0] === 'date') continue // header row
      const [date, rhr, sleepHours, weightKg, mood, soreness, motivation, note] = c
      if (!date) continue
      checkIns.push({
        date,
        rhr: num(rhr),
        sleepHours: num(sleepHours),
        weightKg: num(weightKg),
        mood: num(mood),
        soreness: num(soreness),
        motivation: num(motivation),
        note: note || undefined,
      })
    } else if (section === 'JOURNAL') {
      const c = parseCsvLine(line)
      if (c[0] === 'date') continue // header row
      const [date, text, updatedAt] = c
      if (!date || !text) continue
      journals.push({ date, text, updatedAt: updatedAt || new Date().toISOString() })
    }
  }

  void (async () => {
    for (const r of runs) await s.putRunLog(r)
    for (const c of checkIns) await s.putCheckIn(c)
    for (const j of journals) await s.putJournal(j.text, j.date)
  })()

  return { runs: runs.length, checkIns: checkIns.length, journals: journals.length }
}