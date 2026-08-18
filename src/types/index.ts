// Core domain types for the Kaveri → 70.3 Goa tracker
// Faithful extraction from the Two-Step Plan PDF

// ─────────────────────────────────────────────────────────────────────────────
// Training zones · MHR 190
// ─────────────────────────────────────────────────────────────────────────────

export type ZoneKey =
  | 'recovery'
  | 'easy'
  | 'steady'
  | 'mp'
  | 'half'
  | 'threshold'
  | '10k'
  | 'strides'
  | 'raceMarathon'

export interface Zone {
  key: ZoneKey
  /** Plain-language name shown in headers */
  name: string
  /** Technical term shown beneath, smaller grey */
  technical: string
  paceRange: string
  hrRange: string
  /** Plain explanation for the tap-to-explain glossary */
  explain: string
  /** What it should feel like */
  feelsLike: string
  /** Why it matters in this plan */
  why: string
  colour: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions — a single day has one or more sessions
// ─────────────────────────────────────────────────────────────────────────────

export type SessionKind =
  | 'run'
  | 'strength'
  | 'swim'
  | 'walk'
  | 'rest'
  | 'race'
  | 'mobility'

export type RunType =
  | 'recovery'
  | 'easy'
  | 'long'
  | 'threshold'
  | 'mp'        // marathon pace
  | 'half'      // half-marathon effort
  | 'race10k'
  | 'raceHalf'
  | 'raceMarathon'
  | 'strides'

export interface PrescribedRun {
  distanceKm: number
  /** Pace band, e.g. "7:55–8:35/km" */
  pace: string
  /** Zone key */
  zone: ZoneKey
  /** HR ceiling (bpm) */
  hrCeiling?: number
  /** Cadence target, e.g. "172–178" */
  cadence?: string
  /** Notes from the PDF day-by-day */
  notes: string
  /** Optional MP blocks within a long run */
  mpBlock?: { distanceKm: number; pace: string; carbsPerHour: string }
  /** Threshold blocks, e.g. "3 × 5 min (2 min jog)" */
  thresholdBlock?: string
  /** Strides, e.g. "6 × 20 s" */
  strides?: string
  /** 9:1 run-walk from km 1? */
  runWalk91?: boolean
  /** Fueling target for this run */
  carbsPerHour?: string
}

export interface PrescribedSwim {
  /** Total distance, e.g. "400 m" */
  distance: string
  /** Drill set description */
  drills: string
  /** Goal for this phase, e.g. "exhale fully underwater" */
  goal: string
  /** Recovery flush or technique? */
  type: 'technique' | 'flush'
}

export type StrengthSlot = 'A' | 'B' | 'C'

export interface PrescribedStrength {
  slot: StrengthSlot
  /** "Strength A — Lower, Posterior & Shin" */
  name: string
  /** Duration in minutes */
  duration: number
  /** "Tuesday PM · 45 min" */
  when: string
  /** Taper modifier if any */
  taper?: 'full' | 'light' | 'half' | 'combined' | 'race-week'
}

export interface Session {
  id: string
  /** Week number 1–14 */
  week: number
  /** Day of week, 0 = Monday … 6 = Sunday */
  day: number
  kind: SessionKind
  /** Which slot of the day (1 = AM, 2 = PM, etc.) */
  slotOfDay: 1 | 2 | 3
  /** Display title */
  title: string
  /** Short purpose line */
  purpose: string
  /** Why this session is on this day — the noob-friendly explainer */
  whyToday: string
  run?: PrescribedRun
  swim?: PrescribedSwim
  strength?: PrescribedStrength
  /** Tags: Build, Deload, Peak, Taper, Race, Recovery */
  stageTags: StageTag[]
  /** True if this is the single most important session of the week */
  keySession?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Week stage tags
// ─────────────────────────────────────────────────────────────────────────────

export type StageTag =
  | 'Build'
  | 'Deload'
  | 'Peak'
  | 'Taper'
  | 'Race'
  | 'Recovery'
  | 'Hurdle'

export interface WeekStage {
  tag: StageTag
  /** What this stage means, plain language */
  meaning: string
  /** What your body is doing */
  bodyAdaptation: string
  /** What "good" feels like */
  goodFeelsLike: string
  /** What's concerning */
  concerning: string
  colour: string
}

// ─────────────────────────────────────────────────────────────────────────────
// 14-week plan
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanWeek {
  week: number
  /** Date range, e.g. "17–23 Aug" */
  dateRange: string
  /** Start date of the week (Monday) — ISO */
  startDate: string
  stageTags: StageTag[]
  /** Total weekly volume in km */
  volumeKm: number
  /** Long-run distance */
  longRunKm: number
  /** One-line summary of the week's focus */
  focus: string
  /** Why the week is shaped this way (from PDF) */
  rationale: string
  sessions: Session[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise library
// ─────────────────────────────────────────────────────────────────────────────

export type ExerciseCategory =
  | 'primerA'      // Strength A primer
  | 'mainA'        // Strength A main
  | 'shinA'        // Strength A shin insurance
  | 'primerB'      // Strength B primer
  | 'mainB'        // Strength B main
  | 'armsB'        // Strength B arms
  | 'coreB'        // Strength B core
  | 'plyoC'        // Strength C plyo
  | 'durabilityC'  // Strength C durability
  | 'dailyShin'    // Daily 6-min routine
  | 'mobility'     // Mobility
  | 'warmup'       // Pre-run warmup
  | 'inCab'        // In-cab office rides (Tue–Thu)

export interface ExercisePrescription {
  sets: number
  reps: string     // "6", "8/side", "20 s"
  /** Notes like "3 s lower" */
  cue?: string
}

export interface Exercise {
  id: string
  name: string
  /** Primary muscles, e.g. "QUADS · GLUTES · CORE" */
  muscles: string
  /** Plain-language summary (the understandable layer) */
  summary: string
  /** Primary muscle group */
  primary: string[]
  /** Secondary / stabiliser muscles */
  secondary: string[]
  /** Why it's in THIS plan — running-specific benefit */
  whyInPlan: string
  category: ExerciseCategory
  /** PDF setup cue */
  setup: string
  /** PDF execution cue */
  execution: string
  /** PDF breathing cue */
  breathing: string
  /** PDF mistake to watch for */
  watchFor: string
  /** The #1 mistake in plain terms */
  plainMistake: string
  /** Regression if too hard */
  regression: string
  /** Progression once mastered */
  progression: string
  /** Prescribed sets × reps from the PDF */
  prescribed: ExercisePrescription[]
  /** Superset partner exercise id, if any (A1/A2) */
  supersetWith?: string
  /** Wikimedia Commons photo URL (if available) */
  commonsImage?: string
  /** Commons image attribution */
  commonsAttribution?: string
  /** Curated YouTube search query scoped to trusted channels */
  youtubeQuery: string
  /** User-pasted video URL (their trusted pick) */
  customVideoUrl?: string
  /** Hold time in seconds (for planks etc.) — drives timer */
  holdSeconds?: number
  /** Rest after set in seconds */
  restSeconds?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision gate — 27 Sep half → marathon band
// ─────────────────────────────────────────────────────────────────────────────

export interface GateBand {
  /** Half marathon result range, e.g. "Under 2:10" */
  halfRange: string
  /** Marathon target band, e.g. "4:30 — target live" */
  marathonBand: string
  /** Run-segment pace, e.g. "6:10–6:15/km" */
  runPace: string
  /** What October looks like */
  october: string
  /** Min half time in seconds (for matching) */
  minSeconds?: number
  /** Max half time in seconds (for matching) */
  maxSeconds?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — 70.3 Goa
// ─────────────────────────────────────────────────────────────────────────────

export interface Step2Block {
  block: string
  /** "Block 0", "Block 1", etc. */
  label: string
  /** Date range */
  dates: string
  focus: string
  content: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Fuelling
// ─────────────────────────────────────────────────────────────────────────────

export interface FuellingPhase {
  weeks: string
  carbsPerHour: string
  notes: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Logged data — prescribed vs actual
// ─────────────────────────────────────────────────────────────────────────────

export interface SetLog {
  setId: string
  sessionId: string
  exerciseId: string
  setIndex: number
  /** Prescribed reps */
  prescribedReps: string
  /** Actual reps completed */
  actualReps?: number
  /** Actual weight in kg */
  actualWeight?: number
  /** RPE 1–10 */
  rpe?: number
  /** Done tick */
  done: boolean
  /** Note for this set */
  note?: string
  /** Timestamp */
  loggedAt?: string
}

export interface RunLog {
  sessionId: string
  date: string
  actualDistanceKm?: number
  actualDurationSec?: number
  avgPace?: string        // computed
  avgHr?: number
  maxHr?: number
  avgCadence?: number
  rpe?: number
  /** km splits */
  splits?: { km: number; paceSec: number; hr: number }[]
  /** Gel/fuel used */
  fuel?: { brand: string; count: number; timing: string }[]
  /** Heat/humidity on long runs */
  heat?: string
  humidity?: string
  note?: string
  /** Was this altered from prescribed? */
  altered?: boolean
  alteredReason?: string
}

export interface SwimLog {
  sessionId: string
  date: string
  actualDistance?: string
  drillsCompleted?: string[]
  /** 200 m continuous milestone tick */
  continuous200m?: boolean
  note?: string
}

export interface MorningCheckIn {
  date: string
  rhr?: number
  sleepHours?: number
  weightKg?: number
  mood?: number        // 1–5
  soreness?: number    // 1–5
  motivation?: number  // 1–5
  note?: string
}

export interface DailyJournal {
  date: string
  text: string
  updatedAt: string
}

export interface PainLogEntry {
  id: string
  date: string
  /** Body location, free text */
  location: string
  /** 0–10 */
  intensity: number
  type: 'dull' | 'sharp' | 'ache' | 'burning' | 'stabbing'
  /** Was it during a run? */
  context?: string
  /** Traffic light result */
  light: 'green' | 'amber' | 'red'
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionTimes {
  /** Per day-of-week, AM & PM times in "HH:MM" 24h */
  mon: { am?: string; pm?: string }
  tue: { am?: string; pm?: string }
  wed: { am?: string; pm?: string }
  thu: { am?: string; pm?: string }
  fri: { am?: string; pm?: string }
  sat: { am?: string; pm?: string }
  sun: { am?: string; pm?: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Round 2 types
// ─────────────────────────────────────────────────────────────────────────────

export interface Shoe {
  id: string
  name: string
  /** Kilometres logged on this pair */
  km: number
  /** Replace at 600 km (amber), 800 km (red) */
  retired?: boolean
  addedAt: string
}

export interface SleepLog {
  date: string
  hours: number
  quality?: number  // 1–5
  note?: string
}

export interface FuelLog {
  date: string
  sessionId: string
  /** Gel brand / fuel name */
  brand: string
  count: number
  /** Timing, e.g. "min 45", "every 30 min" */
  timing: string
  /** Tested on a Week 9, 11, 12 long run? (the "nothing new after Week 12" rule) */
  testedOnLongRun?: boolean
}

export interface ExerciseSettings {
  exerciseId: string
  customVideoUrl?: string
  /** User notes per exercise */
  note?: string
}

export interface RaceRetrospective {
  raceId: string
  raceName: string
  date: string
  finishTime: string
  splits?: { km: number; paceSec: number }[]
  whatWorked: string
  whatFailed: string
  fuelingNotes: string
  painNotes: string
  /** Gate result for the 27 Sep half */
  gateBand?: string
  overallNotes: string
}

export interface WeeklyRecap {
  week: number
  weekEnding: string
  volumeKm: string
  volumeVsPlan: string
  weightTrend: string
  rhrTrend: string
  amberFlags: string
  notes: string
  generatedAt: string
}

export interface FormChecklistEntry {
  exerciseId: string
  date: string
  /** Form cues ticked before loading */
  cuesChecked: string[]
  /** Self-rated form score 1–5 */
  formScore?: number
  note?: string
}

export interface Substitution {
  fromExerciseId: string
  toExerciseId: string
  reason: string
  /** e.g. "no cable machine", "injury", "travel" */
  context: string
}

// Injuries & conditions reference (from PDF Section 05)
export interface InjuryInfo {
  name: string
  firstSign: string
  immediateAction: string
  defendedBy: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings (extended for Round 2)
// ─────────────────────────────────────────────────────────────────────────────

/** Per-reminder clock times (HH:mm) — all editable from Settings */
export interface ReminderTimes {
  shin: string
  legs: string
  weighIn: string
  greenLight: string
  /** Daily "your sessions are on today" nudge at this clock time */
  session: string
  sessionEnabled: boolean
}

/** Cab trip details — in-cab exercise nudges fire during these windows (Tue–Thu office days) */
export interface CabTimes {
  enabled: boolean
  /** Going-to-office cab departure (HH:mm) */
  go: string
  /** Returning-from-office cab departure (HH:mm) */
  ret: string
}

export interface Settings {
  /** ISO date of Week 1 Monday — defaults to 2026-08-17 */
  startDate: string
  sessionTimes: SessionTimes
  darkMode: 'auto' | 'light' | 'dark'
  /** Notifications enabled? */
  notificationsEnabled: boolean
  /** Marathons band set by the decision gate */
  marathonBand?: string
  /** Rest timer duration in seconds */
  restTimerSec: number
  /** Body weight in kg (for plate calc etc.) */
  bodyWeightKg: number
  /** Round 2: enable additive reminders */
  remindersEnabled: boolean
  /** Round 2: weather auto-fetch */
  weatherEnabled: boolean
  /** Round 2: which city for weather */
  weatherCity?: string
  /** Round 3: in-app reminder scheduler times */
  reminders: ReminderTimes
  /** Round 3: audio beeps for race-day cues */
  soundEnabled: boolean
  /** Round 3: cab trip windows for in-cab exercise nudges */
  cab: CabTimes
}

// ─────────────────────────────────────────────────────────────────────────────
// Pacing band — race day
// ─────────────────────────────────────────────────────────────────────────────

export interface PacingSegment {
  segment: string
  paceRange: string
  hrCeiling: number
  cumulative: string
  execution: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Glossary — tap-to-explain terms
// ─────────────────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  term: string
  category: 'zone' | 'session' | 'strength' | 'shin' | 'gate' | 'fuelling' | 'recovery' | 'swim' | 'step2'
  plain: string
  why: string
}
