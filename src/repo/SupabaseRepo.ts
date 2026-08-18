import type {
  SetLog, RunLog, SwimLog, MorningCheckIn, DailyJournal, PainLogEntry, Settings,
  Shoe, SleepLog, FuelLog, RaceRetrospective, WeeklyRecap, FormChecklistEntry, Substitution, ExerciseSettings,
} from '@/types'
import type { Repository, ExportPayload } from './Repository'

// ─────────────────────────────────────────────────────────────────────────────
// SupabaseRepo — STUB for v2 cloud sync.
// Implements the same interface as LocalRepo so swapping is a one-line change.
// Fill in the TODOs when wiring up Supabase. See README.md → "Enable Supabase".
// ─────────────────────────────────────────────────────────────────────────────

// TODO v2: import { createClient } from '@supabase/supabase-js'
// TODO v2: const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
// TODO v2: const TABLES = { setLogs:'set_logs', runLogs:'run_logs', swimLogs:'swim_logs', checkIns:'check_ins', journals:'journals', painLogs:'pain_logs', settings:'settings' }

export class SupabaseRepo implements Repository {
  async getSetLogs(_sessionId: string): Promise<SetLog[]> {
    throw new Error('SupabaseRepo not wired — see README.md "Enable Supabase (v2)"')
  }
  async putSetLog(_log: SetLog): Promise<void> {
    throw new Error('SupabaseRepo not wired — see README.md "Enable Supabase (v2)"')
  }
  async deleteSetLog(_setId: string): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }

  async getRunLog(_sessionId: string): Promise<RunLog | null> {
    throw new Error('SupabaseRepo not wired')
  }
  async putRunLog(_log: RunLog): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }

  async getSwimLog(_sessionId: string): Promise<SwimLog | null> {
    throw new Error('SupabaseRepo not wired')
  }
  async getSwimLogs(): Promise<SwimLog[]> {
    throw new Error('SupabaseRepo not wired')
  }
  async putSwimLog(_log: SwimLog): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }

  async getCheckIn(_date: string): Promise<MorningCheckIn | null> {
    throw new Error('SupabaseRepo not wired')
  }
  async putCheckIn(_checkIn: MorningCheckIn): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }
  async getCheckIns(_startDate: string, _endDate: string): Promise<MorningCheckIn[]> {
    throw new Error('SupabaseRepo not wired')
  }

  async getJournal(_date: string): Promise<DailyJournal | null> {
    throw new Error('SupabaseRepo not wired')
  }
  async putJournal(_journal: DailyJournal): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }
  async getJournals(_startDate: string, _endDate: string): Promise<DailyJournal[]> {
    throw new Error('SupabaseRepo not wired')
  }

  async getPainLogs(_startDate: string, _endDate: string): Promise<PainLogEntry[]> {
    throw new Error('SupabaseRepo not wired')
  }
  async putPainLog(_entry: PainLogEntry): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }
  async deletePainLog(_id: string): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }

  async getSettings(): Promise<Settings> {
    throw new Error('SupabaseRepo not wired')
  }
  async putSettings(_settings: Settings): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }

  // ── Round 2 stubs ──────────────────────────────────────────────────────────────
  async getShoes(): Promise<Shoe[]> { throw new Error('SupabaseRepo not wired') }
  async putShoe(_shoe: Shoe): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async deleteShoe(_id: string): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getSleepLog(_date: string): Promise<SleepLog | null> { throw new Error('SupabaseRepo not wired') }
  async putSleepLog(_log: SleepLog): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getFuelLogs(_startDate: string, _endDate: string): Promise<FuelLog[]> { throw new Error('SupabaseRepo not wired') }
  async putFuelLog(_log: FuelLog): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async deleteFuelLog(_date: string, _sessionId: string): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getRetrospectives(): Promise<RaceRetrospective[]> { throw new Error('SupabaseRepo not wired') }
  async putRetrospective(_r: RaceRetrospective): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getRecaps(): Promise<WeeklyRecap[]> { throw new Error('SupabaseRepo not wired') }
  async putRecap(_recap: WeeklyRecap): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getFormChecklists(_startDate: string, _endDate: string): Promise<FormChecklistEntry[]> { throw new Error('SupabaseRepo not wired') }
  async putFormChecklist(_entry: FormChecklistEntry): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getSubstitutions(): Promise<Substitution[]> { throw new Error('SupabaseRepo not wired') }
  async putSubstitution(_sub: Substitution): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async deleteSubstitution(_fromExerciseId: string, _toExerciseId: string): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getExerciseSettings(_exerciseId: string): Promise<ExerciseSettings | null> { throw new Error('SupabaseRepo not wired') }
  async putExerciseSettings(_exerciseId: string, _patch: Partial<ExerciseSettings>): Promise<void> { throw new Error('SupabaseRepo not wired') }
  async getRunLogs(_startDate: string, _endDate: string): Promise<RunLog[]> { throw new Error('SupabaseRepo not wired') }
  async getSleepLogs(_startDate: string, _endDate: string): Promise<SleepLog[]> { throw new Error('SupabaseRepo not wired') }
  async getExerciseSettingsAll(): Promise<Record<string, ExerciseSettings>> { throw new Error('SupabaseRepo not wired') }

  async exportAll(): Promise<ExportPayload> {
    throw new Error('SupabaseRepo not wired')
  }
  async importAll(_payload: ExportPayload): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }
  async wipe(): Promise<void> {
    throw new Error('SupabaseRepo not wired')
  }
}
