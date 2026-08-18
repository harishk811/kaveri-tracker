import { useStore } from '@/store/useStore'
import { notifyRunWalk9to1 } from '@/lib/notifications'
import { requestWakeLock, releaseWakeLock } from '@/lib/wakeLock'
import { playPhaseCue, playStartCue } from '@/lib/sound'
import { hapticAlert } from '@/lib/haptics'

// ─────────────────────────────────────────────────────────────────────────────
// runWalkTimer — the 9:1 run-walk alarm as a module-level singleton so it
// survives navigation. State lives in the store (runWalkTimer) and any page
// shows the live pill while it runs; phase-change notifications keep firing
// in the background and mirror to the watch, with an audio chime + buzz.
// ─────────────────────────────────────────────────────────────────────────────

const RUN_SECS = 540 // 9 min
const WALK_SECS = 60 // 1 min

let intervalRef: ReturnType<typeof setInterval> | null = null

export const runWalkTimerActive = (): boolean => useStore.getState().runWalkTimer.running

export const startRunWalkTimer = (): void => {
  if (runWalkTimerActive() || intervalRef) return
  useStore.setState({
    runWalkTimer: { running: true, phase: 'run', secsLeft: RUN_SECS, cycle: 0 },
  })
  playStartCue()
  hapticAlert()
  notifyRunWalk9to1('run')
  void requestWakeLock()
  intervalRef = setInterval(() => {
    const t = useStore.getState().runWalkTimer
    if (t.secsLeft <= 1) {
      const next = t.phase === 'run' ? 'walk' : 'run'
      useStore.setState({
        runWalkTimer: {
          ...t,
          phase: next,
          secsLeft: next === 'run' ? RUN_SECS : WALK_SECS,
          cycle: t.cycle + 1,
        },
      })
      playPhaseCue(next)
      hapticAlert()
      notifyRunWalk9to1(next)
    } else {
      useStore.setState({ runWalkTimer: { ...t, secsLeft: t.secsLeft - 1 } })
    }
  }, 1000)
}

export const stopRunWalkTimer = (): void => {
  if (intervalRef) {
    clearInterval(intervalRef)
    intervalRef = null
  }
  useStore.setState({
    runWalkTimer: { running: false, phase: 'run', secsLeft: RUN_SECS, cycle: 0 },
  })
  void releaseWakeLock()
}