import { useStore } from '@/store/useStore'

// ─────────────────────────────────────────────────────────────────────────────
// Sound — tiny WebAudio beeps for race-day cues (no assets, no dependencies).
// An AudioContext is only created after a user gesture (Start button), which
// keeps autoplay policies happy. Respects settings.soundEnabled.
// ─────────────────────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null

const ensureCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

const soundEnabled = (): boolean => useStore.getState().settings?.soundEnabled ?? true

const beep = (freq: number, durMs: number, gain = 0.08): void => {
  if (!soundEnabled()) return
  const c = ensureCtx()
  if (!c) return
  try {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(gain, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000)
    osc.connect(g)
    g.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + durMs / 1000)
  } catch {
    // ignore
  }
}

// Race-day cue: distinct tone per phase
export const playPhaseCue = (phase: 'run' | 'walk'): void => {
  if (phase === 'run') {
    beep(880, 220)
    beep(1320, 220, 0.06) // two rising beeps — "run"
  } else {
    beep(440, 320, 0.07) // single lower beep — "walk"
  }
}

export const playGelCue = (): void => {
  beep(660, 150, 0.07)
  setTimeout(() => beep(660, 150, 0.07), 180)
  setTimeout(() => beep(990, 250, 0.07), 360)
}

// Wake the AudioContext on a user gesture so later non-gesture cues
// (reminders firing while the app is open) can actually be heard.
export const primeAudio = (): void => {
  if (typeof window === 'undefined') return
  const c = ensureCtx()
  if (c?.state === 'suspended') void c.resume()
}

export const playStartCue = (): void => beep(520, 250, 0.07)

// Reminder chime — gentle triple, distinct from the race-day cues
export const playReminderCue = (): void => {
  beep(740, 160, 0.06)
  setTimeout(() => beep(740, 160, 0.06), 200)
  setTimeout(() => beep(988, 260, 0.07), 400)
}