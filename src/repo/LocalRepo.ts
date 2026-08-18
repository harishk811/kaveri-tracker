import type {
  SetLog, RunLog, SwimLog, MorningCheckIn, DailyJournal, PainLogEntry, Settings,
  Shoe, SleepLog, FuelLog, RaceRetrospective, WeeklyRecap, FormChecklistEntry, Substitution,
  ExerciseSettings,
} from '@/types'
import type { Repository, ExportPayload } from './Repository'

// ─────────────────────────────────────────────────────────────────────────────────────
// LocalRepo — localStorage implementation (v1)
// All data stays in the browser. Use export/import for backup + device sync.
// ─────────────────────────────────────────────────────────────────────────────────────

const KEYS = {
  setLogs: 'mt.setLogs',         // Record<sessionId, SetLog[]>
  runLogs: 'mt.runLogs',         // Record<sessionId, RunLog>
  swimLogs: 'mt.swimLogs',       // Record<sessionId, SwimLog>
  checkIns: 'mt.checkIns',       // Record<dateISO, MorningCheckIn>
  journals: 'mt.journals',       // Record<dateISO, DailyJournal>
  painLogs: 'mt.painLogs',       // PainLogEntry[]
  settings: 'mt.settings',
  // Round 2
  shoes: 'mt.shoes',             // Shoe[]
  sleepLogs: 'mt.sleepLogs',      // Record<dateISO, SleepLog>
  fuelLogs: 'mt.fuelLogs',       // FuelLog[]
  retrospectives: 'mt.retrospectives', // RaceRetrospective[]
  recaps: 'mt.recaps',           // WeeklyRecap[]
  formChecklists: 'mt.formChecklists', // FormChecklistEntry[]
  substitutions: 'mt.substitutions', // Substitution[]
  exerciseSettings: 'mt.exerciseSettings', // Record<exerciseId, ExerciseSettings>
} as const

const DEFAULT_SETTINGS: Settings = {
  startDate: '2026-08-17',
  sessionTimes: {
    mon: { am: '06:00' },
    tue: { pm: '17:00' },
    wed: { pm: '18:00' },
    thu: { pm: '17:00' },
    fri: { am: '06:00' },
    sat: { am: '07:00' },
    sun: { am: '06:30', pm: '17:00' },
  },
  darkMode: 'auto',
  notificationsEnabled: false,
  restTimerSec: 90,
  bodyWeightKg: 75,
  remindersEnabled: false,
  weatherEnabled: false,
  reminders: {
    shin: '06:30',
    legs: '20:00',
    weighIn: '07:00',
    greenLight: '19:00',
    session: '18:30',
    sessionEnabled: true,
  },
  soundEnabled: true,
  cab: {
    enabled: false,
    go: '08:30',
    ret: '18:30',
  },
}

// Tiny safe JSON helpers
const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const write = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('LocalRepo write failed', key, e)
  }
}

export class LocalRepo implements Repository {
  // ── Set logs ──────────────────────────────────────────────────────────────
  async getSetLogs(sessionId: string): Promise<SetLog[]> {
    const all = read<Record<string, SetLog[]>>(KEYS.setLogs, {})
    return all[sessionId] ?? []
  }

  async putSetLog(log: SetLog): Promise<void> {
    const all = read<Record<string, SetLog[]>>(KEYS.setLogs, {})
    const list = all[log.sessionId] ?? []
    const idx = list.findIndex((l) => l.setId === log.setId)
    if (idx >= 0) list[idx] = log
    else list.push(log)
    all[log.sessionId] = list
    write(KEYS.setLogs, all)
  }

  async deleteSetLog(setId: string): Promise<void> {
    const all = read<Record<string, SetLog[]>>(KEYS.setLogs, {})
    for (const sid of Object.keys(all)) {
      all[sid] = all[sid].filter((l) => l.setId !== setId)
    }
    write(KEYS.setLogs, all)
  }

  // ── Run logs ──────────────────────────────────────────────────────────────
  async getRunLog(sessionId: string): Promise<RunLog | null> {
    const all = read<Record<string, RunLog>>(KEYS.runLogs, {})
    return all[sessionId] ?? null
  }

  async putRunLog(log: RunLog): Promise<void> {
    const all = read<Record<string, RunLog>>(KEYS.runLogs, {})
    all[log.sessionId] = log
    write(KEYS.runLogs, all)
  }

  async getRunLogs(startDate: string, endDate: string): Promise<RunLog[]> {
    const all = read<Record<string, RunLog>>(KEYS.runLogs, {})
    return Object.values(all)
      .filter((r) => r.date >= startDate && r.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // ── Swim logs ─────────────────────────────────────────────────────────────
  async getSwimLog(sessionId: string): Promise<SwimLog | null> {
    const all = read<Record<string, SwimLog>>(KEYS.swimLogs, {})
    return all[sessionId] ?? null
  }

  async putSwimLog(log: SwimLog): Promise<void> {
    const all = read<Record<string, SwimLog>>(KEYS.swimLogs, {})
    all[log.sessionId] = log
    write(KEYS.swimLogs, all)
  }

  async getSwimLogs(): Promise<SwimLog[]> {
    const all = read<Record<string, SwimLog>>(KEYS.swimLogs, {})
    return Object.values(all).sort((a, b) => a.sessionId.localeCompare(b.sessionId))
  }

  // ── Morning check-ins ─────────────────────────────────────────────────────
  async getCheckIn(date: string): Promise<MorningCheckIn | null> {
    const all = read<Record<string, MorningCheckIn>>(KEYS.checkIns, {})
    return all[date] ?? null
  }

  async putCheckIn(checkIn: MorningCheckIn): Promise<void> {
    const all = read<Record<string, MorningCheckIn>>(KEYS.checkIns, {})
    all[checkIn.date] = checkIn
    write(KEYS.checkIns, all)
  }

  async getCheckIns(startDate: string, endDate: string): Promise<MorningCheckIn[]> {
    const all = read<Record<string, MorningCheckIn>>(KEYS.checkIns, {})
    return Object.values(all)
      .filter((c) => c.date >= startDate && c.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // ── Daily journal ─────────────────────────────────────────────────────────
  async getJournal(date: string): Promise<DailyJournal | null> {
    const all = read<Record<string, DailyJournal>>(KEYS.journals, {})
    return all[date] ?? null
  }

  async putJournal(journal: DailyJournal): Promise<void> {
    const all = read<Record<string, DailyJournal>>(KEYS.journals, {})
    all[journal.date] = journal
    write(KEYS.journals, all)
  }

  async getJournals(startDate: string, endDate: string): Promise<DailyJournal[]> {
    const all = read<Record<string, DailyJournal>>(KEYS.journals, {})
    return Object.values(all)
      .filter((j) => j.date >= startDate && j.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // ── Pain log ──────────────────────────────────────────────────────────────
  async getPainLogs(startDate: string, endDate: string): Promise<PainLogEntry[]> {
    const all = read<PainLogEntry[]>(KEYS.painLogs, [])
    return all
      .filter((p) => p.date >= startDate && p.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  async putPainLog(entry: PainLogEntry): Promise<void> {
    const all = read<PainLogEntry[]>(KEYS.painLogs, [])
    const idx = all.findIndex((p) => p.id === entry.id)
    if (idx >= 0) all[idx] = entry
    else all.push(entry)
    write(KEYS.painLogs, all)
  }

  async deletePainLog(id: string): Promise<void> {
    const all = read<PainLogEntry[]>(KEYS.painLogs, [])
    write(KEYS.painLogs, all.filter((p) => p.id !== id))
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings(): Promise<Settings> {
    const stored = read<Partial<Settings>>(KEYS.settings, {})
    // Deep-merge nested objects so settings saved by older app versions (or
    // partial imports) still get the new reminder/cab fields with defaults —
    // a shallow spread alone would silently disable them.
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      reminders: { ...DEFAULT_SETTINGS.reminders, ...(stored.reminders ?? {}) },
      cab: { ...DEFAULT_SETTINGS.cab, ...(stored.cab ?? {}) },
    }
  }

  async putSettings(settings: Settings): Promise<void> {
    write(KEYS.settings, settings)
  }

  // ── Shoes (Round 2) ────────────────────────────────────────────────────────────
  async getShoes(): Promise<Shoe[]> {
    return read<Shoe[]>(KEYS.shoes, [])
  }
  async putShoe(shoe: Shoe): Promise<void> {
    const all = read<Shoe[]>(KEYS.shoes, [])
    const idx = all.findIndex((s) => s.id === shoe.id)
    if (idx >= 0) all[idx] = shoe
    else all.push(shoe)
    write(KEYS.shoes, all)
  }
  async deleteShoe(id: string): Promise<void> {
    const all = read<Shoe[]>(KEYS.shoes, [])
    write(KEYS.shoes, all.filter((s) => s.id !== id))
  }

  // ── Sleep logs (Round 2) ───────────────────────────────────────────────────────
  async getSleepLog(date: string): Promise<SleepLog | null> {
    const all = read<Record<string, SleepLog>>(KEYS.sleepLogs, {})
    return all[date] ?? null
  }
  async putSleepLog(log: SleepLog): Promise<void> {
    const all = read<Record<string, SleepLog>>(KEYS.sleepLogs, {})
    all[log.date] = log
    write(KEYS.sleepLogs, all)
  }

  async getSleepLogs(startDate: string, endDate: string): Promise<SleepLog[]> {
    const all = read<Record<string, SleepLog>>(KEYS.sleepLogs, {})
    return Object.values(all)
      .filter((s) => s.date >= startDate && s.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // ── Fuel logs (Round 2) ────────────────────────────────────────────────────────
  async getFuelLogs(startDate: string, endDate: string): Promise<FuelLog[]> {
    const all = read<FuelLog[]>(KEYS.fuelLogs, [])
    return all.filter((f) => f.date >= startDate && f.date <= endDate)
  }
  async putFuelLog(log: FuelLog): Promise<void> {
    const all = read<FuelLog[]>(KEYS.fuelLogs, [])
    const idx = all.findIndex((f) => f.date === log.date && f.sessionId === log.sessionId)
    if (idx >= 0) all[idx] = log
    else all.push(log)
    write(KEYS.fuelLogs, all)
  }
  async deleteFuelLog(date: string, sessionId: string): Promise<void> {
    const all = read<FuelLog[]>(KEYS.fuelLogs, [])
    write(KEYS.fuelLogs, all.filter((f) => !(f.date === date && f.sessionId === sessionId)))
  }

  // ── Race retrospectives (Round 2) ─────────────────────────────────────────────
  async getRetrospectives(): Promise<RaceRetrospective[]> {
    return read<RaceRetrospective[]>(KEYS.retrospectives, [])
  }
  async putRetrospective(r: RaceRetrospective): Promise<void> {
    const all = read<RaceRetrospective[]>(KEYS.retrospectives, [])
    const idx = all.findIndex((x) => x.raceId === r.raceId)
    if (idx >= 0) all[idx] = r
    else all.push(r)
    write(KEYS.retrospectives, all)
  }

  // ── Weekly recaps (Round 2) ────────────────────────────────────────────────────
  async getRecaps(): Promise<WeeklyRecap[]> {
    return read<WeeklyRecap[]>(KEYS.recaps, [])
  }
  async putRecap(recap: WeeklyRecap): Promise<void> {
    const all = read<WeeklyRecap[]>(KEYS.recaps, [])
    const idx = all.findIndex((r) => r.week === recap.week)
    if (idx >= 0) all[idx] = recap
    else all.push(recap)
    write(KEYS.recaps, all)
  }

  // ── Form checklists (Round 2) ──────────────────────────────────────────────────
  async getFormChecklists(startDate: string, endDate: string): Promise<FormChecklistEntry[]> {
    const all = read<FormChecklistEntry[]>(KEYS.formChecklists, [])
    return all.filter((f) => f.date >= startDate && f.date <= endDate)
  }
  async putFormChecklist(entry: FormChecklistEntry): Promise<void> {
    const all = read<FormChecklistEntry[]>(KEYS.formChecklists, [])
    const idx = all.findIndex((f) => f.exerciseId === entry.exerciseId && f.date === entry.date)
    if (idx >= 0) all[idx] = entry
    else all.push(entry)
    write(KEYS.formChecklists, all)
  }

  // ── Substitutions (Round 2) ───────────────────────────────────────────────────
  async getSubstitutions(): Promise<Substitution[]> {
    return read<Substitution[]>(KEYS.substitutions, [])
  }
  async putSubstitution(sub: Substitution): Promise<void> {
    const all = read<Substitution[]>(KEYS.substitutions, [])
    const idx = all.findIndex((s) => s.fromExerciseId === sub.fromExerciseId && s.toExerciseId === sub.toExerciseId)
    if (idx >= 0) all[idx] = sub
    else all.push(sub)
    write(KEYS.substitutions, all)
  }
  async deleteSubstitution(fromExerciseId: string, toExerciseId: string): Promise<void> {
    const all = read<Substitution[]>(KEYS.substitutions, [])
    write(KEYS.substitutions, all.filter((s) => !(s.fromExerciseId === fromExerciseId && s.toExerciseId === toExerciseId)))
  }

  // ── Exercise settings (Round 2) ────────────────────────────────────────────────
  async getExerciseSettings(exerciseId: string): Promise<ExerciseSettings | null> {
    const all = read<Record<string, ExerciseSettings>>(KEYS.exerciseSettings, {})
    return all[exerciseId] ?? null
  }
  async putExerciseSettings(exerciseId: string, patch: Partial<ExerciseSettings>): Promise<void> {
    const all = read<Record<string, ExerciseSettings>>(KEYS.exerciseSettings, {})
    all[exerciseId] = { ...all[exerciseId], ...patch }
    write(KEYS.exerciseSettings, all)
  }

  async getExerciseSettingsAll(): Promise<Record<string, ExerciseSettings>> {
    return read<Record<string, ExerciseSettings>>(KEYS.exerciseSettings, {})
  }

  // ── Export / import ───────────────────────────────────────────────────────────
  async exportAll(): Promise<ExportPayload> {
    const setLogsMap = read<Record<string, SetLog[]>>(KEYS.setLogs, {})
    const setLogs = Object.values(setLogsMap).flat()
    const runLogs = Object.values(read<Record<string, RunLog>>(KEYS.runLogs, {}))
    const swimLogs = Object.values(read<Record<string, SwimLog>>(KEYS.swimLogs, {}))
    const checkIns = Object.values(read<Record<string, MorningCheckIn>>(KEYS.checkIns, {}))
    const journals = Object.values(read<Record<string, DailyJournal>>(KEYS.journals, {}))
    const painLogs = read<PainLogEntry[]>(KEYS.painLogs, [])
    const settings = await this.getSettings()
    const shoes = read<Shoe[]>(KEYS.shoes, [])
    const sleepLogs = Object.values(read<Record<string, SleepLog>>(KEYS.sleepLogs, {}))
    const fuelLogs = read<FuelLog[]>(KEYS.fuelLogs, [])
    const retrospectives = read<RaceRetrospective[]>(KEYS.retrospectives, [])
    const recaps = read<WeeklyRecap[]>(KEYS.recaps, [])
    const formChecklists = read<FormChecklistEntry[]>(KEYS.formChecklists, [])
    const substitutions = read<Substitution[]>(KEYS.substitutions, [])
    const exerciseSettings = read<Record<string, ExerciseSettings>>(KEYS.exerciseSettings, {})
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      setLogs, runLogs, swimLogs, checkIns, journals, painLogs, settings,
      shoes, sleepLogs, fuelLogs, retrospectives, recaps, formChecklists, substitutions, exerciseSettings,
    }
  }

  async importAll(payload: ExportPayload): Promise<void> {
    // Guard against importing a random JSON file (wrong app backup, export of
    // something else). Throws before anything is written.
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || typeof payload.version !== 'number') {
      throw new Error('Not a Kaveri Tracker backup — expected an export file from this app.')
    }
    // Rebuild maps from flat arrays
    const setLogsMap: Record<string, SetLog[]> = {}
    for (const l of payload.setLogs ?? []) {
      (setLogsMap[l.sessionId] ??= []).push(l)
    }
    write(KEYS.setLogs, setLogsMap)
    const runLogsMap: Record<string, RunLog> = {}
    for (const r of payload.runLogs ?? []) runLogsMap[r.sessionId] = r
    write(KEYS.runLogs, runLogsMap)
    const swimLogsMap: Record<string, SwimLog> = {}
    for (const s of payload.swimLogs ?? []) swimLogsMap[s.sessionId] = s
    write(KEYS.swimLogs, swimLogsMap)
    const checkInsMap: Record<string, MorningCheckIn> = {}
    for (const c of payload.checkIns ?? []) checkInsMap[c.date] = c
    write(KEYS.checkIns, checkInsMap)
    const journalsMap: Record<string, DailyJournal> = {}
    for (const j of payload.journals ?? []) journalsMap[j.date] = j
    write(KEYS.journals, journalsMap)
    write(KEYS.painLogs, payload.painLogs ?? [])
    if (payload.settings) write(KEYS.settings, payload.settings)
    // Round 2
    write(KEYS.shoes, payload.shoes ?? [])
    const sleepLogsMap: Record<string, SleepLog> = {}
    for (const s of payload.sleepLogs ?? []) sleepLogsMap[s.date] = s
    write(KEYS.sleepLogs, sleepLogsMap)
    write(KEYS.fuelLogs, payload.fuelLogs ?? [])
    write(KEYS.retrospectives, payload.retrospectives ?? [])
    write(KEYS.recaps, payload.recaps ?? [])
    write(KEYS.formChecklists, payload.formChecklists ?? [])
    write(KEYS.substitutions, payload.substitutions ?? [])
    write(KEYS.exerciseSettings, payload.exerciseSettings ?? {})
  }

  async wipe(): Promise<void> {
    for (const k of Object.values(KEYS)) localStorage.removeItem(k)
  }
}
