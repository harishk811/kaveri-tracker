import type {
  SetLog, RunLog, SwimLog, MorningCheckIn, DailyJournal, PainLogEntry, Settings,
  Shoe, SleepLog, FuelLog, RaceRetrospective, WeeklyRecap, FormChecklistEntry, Substitution, ExerciseSettings,
} from '@/types'

// ─────────────────────────────────────────────────────────────────────────────────────
// Repository interface — abstracts all data access.
// v1: LocalRepo (localStorage). v2: SupabaseRepo (cloud sync).
// Swap by flipping the export in index.ts.
// ─────────────────────────────────────────────────────────────────────────────────────

export interface Repository {
  // Set logs (gym)
  getSetLogs(sessionId: string): Promise<SetLog[]>
  putSetLog(log: SetLog): Promise<void>
  deleteSetLog(setId: string): Promise<void>

  // Run logs
  getRunLog(sessionId: string): Promise<RunLog | null>
  putRunLog(log: RunLog): Promise<void>

  // Swim logs
  getSwimLog(sessionId: string): Promise<SwimLog | null>
  putSwimLog(log: SwimLog): Promise<void>
  getSwimLogs(): Promise<SwimLog[]>

  // Morning check-ins
  getCheckIn(date: string): Promise<MorningCheckIn | null>
  putCheckIn(checkIn: MorningCheckIn): Promise<void>
  getCheckIns(startDate: string, endDate: string): Promise<MorningCheckIn[]>

  // Daily journal
  getJournal(date: string): Promise<DailyJournal | null>
  putJournal(journal: DailyJournal): Promise<void>
  getJournals(startDate: string, endDate: string): Promise<DailyJournal[]>

  // Pain log
  getPainLogs(startDate: string, endDate: string): Promise<PainLogEntry[]>
  putPainLog(entry: PainLogEntry): Promise<void>
  deletePainLog(id: string): Promise<void>

  // Settings
  getSettings(): Promise<Settings>
  putSettings(settings: Settings): Promise<void>

  // ── Round 2 ────────────────────────────────────────────────────────────────────
  // Shoes
  getShoes(): Promise<Shoe[]>
  putShoe(shoe: Shoe): Promise<void>
  deleteShoe(id: string): Promise<void>
  // Sleep logs
  getSleepLog(date: string): Promise<SleepLog | null>
  putSleepLog(log: SleepLog): Promise<void>
  // Fuel logs
  getFuelLogs(startDate: string, endDate: string): Promise<FuelLog[]>
  putFuelLog(log: FuelLog): Promise<void>
  deleteFuelLog(date: string, sessionId: string): Promise<void>
  // Race retrospectives
  getRetrospectives(): Promise<RaceRetrospective[]>
  putRetrospective(r: RaceRetrospective): Promise<void>
  // Weekly recaps
  getRecaps(): Promise<WeeklyRecap[]>
  putRecap(recap: WeeklyRecap): Promise<void>
  // Form checklists
  getFormChecklists(startDate: string, endDate: string): Promise<FormChecklistEntry[]>
  putFormChecklist(entry: FormChecklistEntry): Promise<void>
  // Substitutions
  getSubstitutions(): Promise<Substitution[]>
  putSubstitution(sub: Substitution): Promise<void>
  deleteSubstitution(fromExerciseId: string, toExerciseId: string): Promise<void>
  // Exercise settings (custom video URLs, notes)
  getExerciseSettings(exerciseId: string): Promise<ExerciseSettings | null>
  putExerciseSettings(exerciseId: string, patch: Partial<ExerciseSettings>): Promise<void>
  // Bulk reads for charts & recaps
  getRunLogs(startDate: string, endDate: string): Promise<RunLog[]>
  getSleepLogs(startDate: string, endDate: string): Promise<SleepLog[]>
  getExerciseSettingsAll(): Promise<Record<string, ExerciseSettings>>

  // Export / import (full backup)
  exportAll(): Promise<ExportPayload>
  importAll(payload: ExportPayload): Promise<void>

  // Wipe
  wipe(): Promise<void>
}

export interface ExportPayload {
  exportedAt: string
  version: 1
  setLogs: SetLog[]
  runLogs: RunLog[]
  swimLogs: SwimLog[]
  checkIns: MorningCheckIn[]
  journals: DailyJournal[]
  painLogs: PainLogEntry[]
  settings: Settings
  // Round 2
  shoes: Shoe[]
  sleepLogs: SleepLog[]
  fuelLogs: FuelLog[]
  retrospectives: RaceRetrospective[]
  recaps: WeeklyRecap[]
  formChecklists: FormChecklistEntry[]
  substitutions: Substitution[]
  exerciseSettings: Record<string, ExerciseSettings>
}
