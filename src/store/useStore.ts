import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  SetLog, RunLog, SwimLog, MorningCheckIn, DailyJournal, PainLogEntry, Settings,
  Shoe, SleepLog, FuelLog, RaceRetrospective, WeeklyRecap, FormChecklistEntry, Substitution, ExerciseSettings,
} from '@/types'
import { repo, type ExportPayload } from '@/repo'
import { addDays, format, parseISO } from 'date-fns'
import { todayISO } from '@/lib/dates'

// ─────────────────────────────────────────────────────────────────────────────
// App store — thin reactive layer over the Repository.
// Reads/writes go through `repo` (Local in v1, Supabase in v2); the store keeps
// an in-memory cache so React components can subscribe to updates.
// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
  // ── Settings ───────────────────────────────────────────────────────────────
  settings: Settings | null
  loadSettings: () => Promise<void>
  saveSettings: (patch: Partial<Settings>) => Promise<void>

  // ── 9:1 run-walk alarm (session-only, lives across navigation) ─────────────
  runWalkTimer: { running: boolean; phase: 'run' | 'walk'; secsLeft: number; cycle: number }

  // ── Set logs (gym) ──────────────────────────────────────────────────────────
  setLogsBySession: Record<string, SetLog[]>
  loadSetLogs: (sessionId: string) => Promise<void>
  putSetLog: (log: SetLog) => Promise<void>
  deleteSetLog: (setId: string, sessionId: string) => Promise<void>

  // ── Run logs ────────────────────────────────────────────────────────────────
  runLogsBySession: Record<string, RunLog | null>
  loadRunLog: (sessionId: string) => Promise<void>
  putRunLog: (log: RunLog) => Promise<void>
  loadRunLogsRange: (startDate: string, endDate: string) => Promise<void>

  // ── Swim logs ───────────────────────────────────────────────────────────────
  swimLogsBySession: Record<string, SwimLog | null>
  loadSwimLog: (sessionId: string) => Promise<void>
  putSwimLog: (log: SwimLog) => Promise<void>
  loadSwimLogsAll: () => Promise<void>

  // ── Morning check-in ───────────────────────────────────────────────────────
  checkInsByDate: Record<string, MorningCheckIn | null>
  loadCheckIn: (date: string) => Promise<void>
  putCheckIn: (checkIn: MorningCheckIn) => Promise<void>
  loadCheckInsRange: (startDate: string, endDate: string) => Promise<void>

  // ── Daily journal ───────────────────────────────────────────────────────────
  journalsByDate: Record<string, DailyJournal | null>
  loadJournal: (date: string) => Promise<void>
  putJournal: (text: string, date: string) => Promise<void>
  loadShinJournalsRange: (startDate: string, endDate: string) => Promise<void>

  // ── Pain log ─────────────────────────────────────────────────────────────────
  painLogs: PainLogEntry[]
  loadPainLogs: (startDate: string, endDate: string) => Promise<void>
  putPainLog: (entry: PainLogEntry) => Promise<void>
  deletePainLog: (id: string) => Promise<void>

  // ── Round 2: Shoes ─────────────────────────────────────────────────────────────
  shoes: Shoe[]
  loadShoes: () => Promise<void>
  putShoe: (shoe: Shoe) => Promise<void>
  deleteShoe: (id: string) => Promise<void>

  // ── Round 2: Sleep logs ─────────────────────────────────────────────────────────
  sleepByDate: Record<string, SleepLog | null>
  loadSleepLog: (date: string) => Promise<void>
  putSleepLog: (log: SleepLog) => Promise<void>
  loadSleepLogsRange: (startDate: string, endDate: string) => Promise<void>

  // ── Round 2: Fuel logs ─────────────────────────────────────────────────────────
  fuelLogs: FuelLog[]
  loadFuelLogs: (startDate: string, endDate: string) => Promise<void>
  putFuelLog: (log: FuelLog) => Promise<void>
  deleteFuelLog: (date: string, sessionId: string) => Promise<void>

  // ── Round 2: Race retrospectives ───────────────────────────────────────────────
  retrospectives: RaceRetrospective[]
  loadRetrospectives: () => Promise<void>
  putRetrospective: (r: RaceRetrospective) => Promise<void>

  // ── Round 2: Weekly recaps ─────────────────────────────────────────────────────
  recaps: WeeklyRecap[]
  loadRecaps: () => Promise<void>
  putRecap: (recap: WeeklyRecap) => Promise<void>

  // ── Round 2: Form checklists ───────────────────────────────────────────────────
  formChecklists: FormChecklistEntry[]
  loadFormChecklists: (startDate: string, endDate: string) => Promise<void>
  putFormChecklist: (entry: FormChecklistEntry) => Promise<void>

  // ── Round 2: Substitutions ─────────────────────────────────────────────────────
  substitutions: Substitution[]
  loadSubstitutions: () => Promise<void>
  putSubstitution: (sub: Substitution) => Promise<void>
  deleteSubstitution: (fromExerciseId: string, toExerciseId: string) => Promise<void>

  // ── Round 2: Exercise settings (custom video URLs, notes) ───────────────────────
  exerciseSettings: Record<string, ExerciseSettings>
  loadExerciseSettingsAll: () => Promise<void>
  putExerciseSettings: (exerciseId: string, patch: Partial<ExerciseSettings>) => Promise<void>

  // ── Export / import / wipe ──────────────────────────────────────────────────
  exportAll: () => Promise<ExportPayload>
  importAll: (payload: ExportPayload) => Promise<void>
  wipe: () => Promise<void>

  // ── Onboarding ──────────────────────────────────────────────────────────────
  onboardingDone: boolean
  setOnboardingDone: (done: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Settings ───────────────────────────────────────────────────────────
      settings: null,
      loadSettings: async () => {
        const s = await repo.getSettings()
        set({ settings: s })
      },
      saveSettings: async (patch) => {
        const current = get().settings
        if (!current) return
        const next = { ...current, ...patch }
        await repo.putSettings(next)
        set({ settings: next })
      },

      // ── 9:1 run-walk alarm (session-only, lives across navigation) ───────
      runWalkTimer: { running: false, phase: 'run', secsLeft: 540, cycle: 0 },

      // ── Set logs ───────────────────────────────────────────────────────────
      setLogsBySession: {},
      loadSetLogs: async (sessionId) => {
        const logs = await repo.getSetLogs(sessionId)
        set((s) => ({ setLogsBySession: { ...s.setLogsBySession, [sessionId]: logs } }))
      },
      putSetLog: async (log) => {
        await repo.putSetLog(log)
        set((s) => {
          const list = s.setLogsBySession[log.sessionId] ?? []
          const idx = list.findIndex((l) => l.setId === log.setId)
          const next = idx >= 0 ? list.map((l) => (l.setId === log.setId ? log : l)) : [...list, log]
          return { setLogsBySession: { ...s.setLogsBySession, [log.sessionId]: next } }
        })
      },
      deleteSetLog: async (setId, sessionId) => {
        await repo.deleteSetLog(setId)
        set((s) => ({
          setLogsBySession: {
            ...s.setLogsBySession,
            [sessionId]: (s.setLogsBySession[sessionId] ?? []).filter((l) => l.setId !== setId),
          },
        }))
      },

      // ── Run logs ───────────────────────────────────────────────────────────
      runLogsBySession: {},
      loadRunLog: async (sessionId) => {
        const log = await repo.getRunLog(sessionId)
        set((s) => ({ runLogsBySession: { ...s.runLogsBySession, [sessionId]: log } }))
      },
      putRunLog: async (log) => {
        await repo.putRunLog(log)
        set((s) => ({ runLogsBySession: { ...s.runLogsBySession, [log.sessionId]: log } }))
      },
      loadRunLogsRange: async (startDate, endDate) => {
        const logs = await repo.getRunLogs(startDate, endDate)
        set((s) => {
          const merged = { ...s.runLogsBySession }
          for (const log of logs) merged[log.sessionId] = log
          return { runLogsBySession: merged }
        })
      },

      // ── Swim logs ──────────────────────────────────────────────────────────
      swimLogsBySession: {},
      loadSwimLog: async (sessionId) => {
        const log = await repo.getSwimLog(sessionId)
        set((s) => ({ swimLogsBySession: { ...s.swimLogsBySession, [sessionId]: log } }))
      },
      putSwimLog: async (log) => {
        await repo.putSwimLog(log)
        set((s) => ({ swimLogsBySession: { ...s.swimLogsBySession, [log.sessionId]: log } }))
      },
      loadSwimLogsAll: async () => {
        const logs = await repo.getSwimLogs()
        set((s) => {
          const merged = { ...s.swimLogsBySession }
          for (const log of logs) merged[log.sessionId] = log
          return { swimLogsBySession: merged }
        })
      },

      // ── Morning check-in ───────────────────────────────────────────────────
      checkInsByDate: {},
      loadCheckIn: async (date) => {
        const ci = await repo.getCheckIn(date)
        set((s) => ({ checkInsByDate: { ...s.checkInsByDate, [date]: ci } }))
      },
      putCheckIn: async (checkIn) => {
        await repo.putCheckIn(checkIn)
        set((s) => ({ checkInsByDate: { ...s.checkInsByDate, [checkIn.date]: checkIn } }))
      },
      loadCheckInsRange: async (startDate, endDate) => {
        const cis = await repo.getCheckIns(startDate, endDate)
        set((s) => {
          const merged = { ...s.checkInsByDate }
          for (const ci of cis) merged[ci.date] = ci
          return { checkInsByDate: merged }
        })
      },

      // ── Daily journal ──────────────────────────────────────────────────────
      journalsByDate: {},
      loadJournal: async (date) => {
        const j = await repo.getJournal(date)
        set((s) => ({ journalsByDate: { ...s.journalsByDate, [date]: j } }))
      },
      loadShinJournalsRange: async (startDate, endDate) => {
        const merged = { ...useStore.getState().journalsByDate }
        let d = startDate
        while (d <= endDate) {
          const key = `shin:${d}`
          if (!(key in merged)) {
            const j = await repo.getJournal(key)
            merged[key] = j
          }
          d = format(addDays(parseISO(d), 1), 'yyyy-MM-dd')
        }
        set({ journalsByDate: merged })
      },
      putJournal: async (text, date) => {
        const journal: DailyJournal = { date, text, updatedAt: new Date().toISOString() }
        await repo.putJournal(journal)
        set((s) => ({ journalsByDate: { ...s.journalsByDate, [date]: journal } }))
      },

      // ── Pain log ───────────────────────────────────────────────────────────
      painLogs: [],
      loadPainLogs: async (startDate, endDate) => {
        const logs = await repo.getPainLogs(startDate, endDate)
        set({ painLogs: logs })
      },
      putPainLog: async (entry) => {
        await repo.putPainLog(entry)
        set((s) => {
          const idx = s.painLogs.findIndex((p) => p.id === entry.id)
          const next = idx >= 0 ? s.painLogs.map((p) => (p.id === entry.id ? entry : p)) : [entry, ...s.painLogs]
          return { painLogs: next }
        })
      },
      deletePainLog: async (id) => {
        await repo.deletePainLog(id)
        set((s) => ({ painLogs: s.painLogs.filter((p) => p.id !== id) }))
      },

      // ── Round 2: Shoes ───────────────────────────────────────────────────────
      shoes: [],
      loadShoes: async () => {
        const shoes = await repo.getShoes()
        set({ shoes })
      },
      putShoe: async (shoe) => {
        await repo.putShoe(shoe)
        set((s) => {
          const idx = s.shoes.findIndex((x) => x.id === shoe.id)
          const next = idx >= 0 ? s.shoes.map((x) => (x.id === shoe.id ? shoe : x)) : [...s.shoes, shoe]
          return { shoes: next }
        })
      },
      deleteShoe: async (id) => {
        await repo.deleteShoe(id)
        set((s) => ({ shoes: s.shoes.filter((x) => x.id !== id) }))
      },

      // ── Round 2: Sleep logs ───────────────────────────────────────────────────
      sleepByDate: {},
      loadSleepLog: async (date) => {
        const log = await repo.getSleepLog(date)
        set((s) => ({ sleepByDate: { ...s.sleepByDate, [date]: log } }))
      },
      putSleepLog: async (log) => {
        await repo.putSleepLog(log)
        set((s) => ({ sleepByDate: { ...s.sleepByDate, [log.date]: log } }))
      },
      loadSleepLogsRange: async (startDate, endDate) => {
        const logs = await repo.getSleepLogs(startDate, endDate)
        set((s) => {
          const merged = { ...s.sleepByDate }
          for (const log of logs) merged[log.date] = log
          return { sleepByDate: merged }
        })
      },

      // ── Round 2: Fuel logs ───────────────────────────────────────────────────
      fuelLogs: [],
      loadFuelLogs: async (startDate, endDate) => {
        const logs = await repo.getFuelLogs(startDate, endDate)
        set({ fuelLogs: logs })
      },
      putFuelLog: async (log) => {
        await repo.putFuelLog(log)
        set((s) => {
          const idx = s.fuelLogs.findIndex((f) => f.date === log.date && f.sessionId === log.sessionId)
          const next = idx >= 0 ? s.fuelLogs.map((f) => (f.date === log.date && f.sessionId === log.sessionId ? log : f)) : [...s.fuelLogs, log]
          return { fuelLogs: next }
        })
      },
      deleteFuelLog: async (date, sessionId) => {
        await repo.deleteFuelLog(date, sessionId)
        set((s) => ({ fuelLogs: s.fuelLogs.filter((f) => !(f.date === date && f.sessionId === sessionId)) }))
      },

      // ── Round 2: Retrospectives ───────────────────────────────────────────────
      retrospectives: [],
      loadRetrospectives: async () => {
        const rs = await repo.getRetrospectives()
        set({ retrospectives: rs })
      },
      putRetrospective: async (r) => {
        await repo.putRetrospective(r)
        set((s) => {
          const idx = s.retrospectives.findIndex((x) => x.raceId === r.raceId)
          const next = idx >= 0 ? s.retrospectives.map((x) => (x.raceId === r.raceId ? r : x)) : [...s.retrospectives, r]
          return { retrospectives: next }
        })
      },

      // ── Round 2: Weekly recaps ───────────────────────────────────────────────
      recaps: [],
      loadRecaps: async () => {
        const rs = await repo.getRecaps()
        set({ recaps: rs })
      },
      putRecap: async (recap) => {
        await repo.putRecap(recap)
        set((s) => {
          const idx = s.recaps.findIndex((r) => r.week === recap.week)
          const next = idx >= 0 ? s.recaps.map((r) => (r.week === recap.week ? recap : r)) : [...s.recaps, recap]
          return { recaps: next }
        })
      },

      // ── Round 2: Form checklists ───────────────────────────────────────────────
      formChecklists: [],
      loadFormChecklists: async (startDate, endDate) => {
        const fs = await repo.getFormChecklists(startDate, endDate)
        set({ formChecklists: fs })
      },
      putFormChecklist: async (entry) => {
        await repo.putFormChecklist(entry)
        set((s) => {
          const idx = s.formChecklists.findIndex((f) => f.exerciseId === entry.exerciseId && f.date === entry.date)
          const next = idx >= 0 ? s.formChecklists.map((f) => (f.exerciseId === entry.exerciseId && f.date === entry.date ? entry : f)) : [...s.formChecklists, entry]
          return { formChecklists: next }
        })
      },

      // ── Round 2: Substitutions ───────────────────────────────────────────────
      substitutions: [],
      loadSubstitutions: async () => {
        const subs = await repo.getSubstitutions()
        set({ substitutions: subs })
      },
      putSubstitution: async (sub) => {
        await repo.putSubstitution(sub)
        set((s) => {
          const idx = s.substitutions.findIndex((x) => x.fromExerciseId === sub.fromExerciseId && x.toExerciseId === sub.toExerciseId)
          const next = idx >= 0 ? s.substitutions.map((x) => (x.fromExerciseId === sub.fromExerciseId && x.toExerciseId === sub.toExerciseId ? sub : x)) : [...s.substitutions, sub]
          return { substitutions: next }
        })
      },
      deleteSubstitution: async (fromExerciseId, toExerciseId) => {
        await repo.deleteSubstitution(fromExerciseId, toExerciseId)
        set((s) => ({ substitutions: s.substitutions.filter((x) => !(x.fromExerciseId === fromExerciseId && x.toExerciseId === toExerciseId)) }))
      },

      // ── Round 2: Exercise settings ───────────────────────────────────────────────
      exerciseSettings: {},
      loadExerciseSettingsAll: async () => {
        const all = await repo.getExerciseSettingsAll()
        set({ exerciseSettings: all })
      },
      putExerciseSettings: async (exerciseId, patch) => {
        await repo.putExerciseSettings(exerciseId, patch)
        set((s) => ({
          exerciseSettings: {
            ...s.exerciseSettings,
            [exerciseId]: { ...s.exerciseSettings[exerciseId], ...patch },
          },
        }))
      },

      // ── Export / import / wipe ─────────────────────────────────────────────
      exportAll: async () => repo.exportAll(),
      importAll: async (payload) => {
        await repo.importAll(payload)
        // Drop every cache so no stale data survives the import, then reload
        // the full plan window so already-mounted pages (Insights, recaps, …)
        // reflect the imported data immediately.
        set({
          setLogsBySession: {},
          runLogsBySession: {},
          swimLogsBySession: {},
          checkInsByDate: {},
          journalsByDate: {},
          painLogs: [],
          shoes: [],
          sleepByDate: {},
          fuelLogs: [],
          retrospectives: [],
          recaps: [],
          formChecklists: [],
          substitutions: [],
          exerciseSettings: {},
        })
        await get().loadSettings()
        const start = get().settings?.startDate ?? todayISO()
        const end = format(addDays(start, 97), 'yyyy-MM-dd')
        await Promise.all([
          get().loadRunLogsRange(start, end),
          get().loadCheckInsRange(start, end),
          get().loadSleepLogsRange(start, end),
          get().loadFuelLogs(start, end),
          get().loadFormChecklists(start, end),
          get().loadPainLogs(start, end),
          get().loadShoes(),
          get().loadRetrospectives(),
          get().loadRecaps(),
          get().loadSubstitutions(),
          get().loadExerciseSettingsAll(),
        ])
      },
      wipe: async () => {
        await repo.wipe()
        set({
          settings: null,
          setLogsBySession: {},
          runLogsBySession: {},
          swimLogsBySession: {},
          checkInsByDate: {},
          journalsByDate: {},
          painLogs: [],
          shoes: [],
          sleepByDate: {},
          fuelLogs: [],
          retrospectives: [],
          recaps: [],
          formChecklists: [],
          substitutions: [],
          exerciseSettings: {},
        })
        await get().loadSettings()
      },

      // ── Onboarding ─────────────────────────────────────────────────────────
      onboardingDone: false,
      setOnboardingDone: (done) => set({ onboardingDone: done }),
    }),
    {
      name: 'mt.app',
      // Only persist onboarding flag + nothing else (data lives in the repo)
      partialize: (s) => ({ onboardingDone: s.onboardingDone }) as AppState,
    },
  ),
)
