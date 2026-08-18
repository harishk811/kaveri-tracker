import { useState, useEffect, useRef, useCallback } from 'react'
import { formatDuration } from '@/lib/dates'
import { requestWakeLock, releaseWakeLock } from '@/lib/wakeLock'

// ─────────────────────────────────────────────────────────────────────────────
// Timer — countdown timer for rest intervals (60–90 s default) and hold
// exercises (planks, hollow, Copenhagen). Vibrates + chimes on finish.
// Acquires a screen wake-lock so the timer does not sleep on Android.
// ─────────────────────────────────────────────────────────────────────────────

interface TimerProps {
  /** Seconds to count down */
  seconds: number
  /** Label — "Rest" or "Hold" */
  label?: string
  /** Auto-start? */
  autoStart?: boolean
  /** On finish callback */
  onFinish?: () => void
  /** Compact — just the countdown */
  compact?: boolean
  /** Reset key — when this changes, the timer resets */
  resetKey?: string | number
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  label = 'Rest',
  autoStart = false,
  onFinish,
  compact = false,
  resetKey,
}) => {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const finish = useCallback(() => {
    clearTick()
    setRunning(false)
    setRemaining(0)
    // Vibrate (Android)
    if ('vibrate' in navigator) {
      try { navigator.vibrate([300, 100, 300, 100, 300]) } catch { /* ignore */ }
    }
    // Beep via WebAudio (works offline)
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      // Android Chrome starts contexts suspended — resume or no sound plays
      void ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start()
      osc.stop(ctx.currentTime + 0.65)
    } catch { /* ignore */ }

    onFinish?.()
    void releaseWakeLock()
  }, [clearTick, onFinish])

  const tick = useCallback(() => {
    setRemaining((r) => {
      if (r <= 1) {
        finish()
        return 0
      }
      return r - 1
    })
  }, [finish])

  const start = useCallback(() => {
    if (running) return
    setRunning(true)
    void requestWakeLock()
    clearTick()
    intervalRef.current = setInterval(tick, 1000)
  }, [running, clearTick, tick])

  const pause = useCallback(() => {
    setRunning(false)
    clearTick()
    void releaseWakeLock()
  }, [clearTick])

  const reset = useCallback(() => {
    clearTick()
    setRunning(false)
    setRemaining(seconds)
    void releaseWakeLock()
  }, [clearTick, seconds])

  // Reset when resetKey changes
  useEffect(() => { reset() }, [resetKey, reset])

  // Cleanup on unmount
  useEffect(() => () => { clearTick(); void releaseWakeLock() }, [clearTick])

  // Auto-start
  useEffect(() => {
    if (autoStart) start()
  }, [autoStart, start])

  const progress = 1 - remaining / seconds
  const isLow = remaining <= 5 && remaining > 0

  if (compact) {
    return (
      <span className={`font-mono tabular-nums ${isLow ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
        {formatDuration(remaining)}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 p-3">
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg width="48" height="48" className="-rotate-90">
          <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" className="stroke-slate-300 dark:stroke-slate-700" />
          <circle
            cx="24" cy="24" r="20" fill="none" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={2 * Math.PI * 20 * (1 - progress)}
            className={`${isLow ? 'stroke-red-500' : 'stroke-brand-600'} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono tabular-nums">
          {remaining}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-sm font-medium">{formatDuration(remaining)} remaining</div>
      </div>
      <div className="flex gap-1.5">
        {!running ? (
          <button className="btn-primary px-3 py-1.5 text-xs" onClick={start}>
            {remaining === seconds ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={pause}>Pause</button>
        )}
        <button className="btn-ghost px-2 py-1.5 text-xs" onClick={reset} aria-label="Reset">↺</button>
      </div>
    </div>
  )
}
