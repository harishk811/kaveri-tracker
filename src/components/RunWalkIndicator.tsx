import { useStore } from '@/store/useStore'
import { formatDuration } from '@/lib/dates'
import { stopRunWalkTimer } from '@/lib/runWalkTimer'

// ─────────────────────────────────────────────────────────────────────────────
// RunWalkIndicator — floating pill shown on every page while the 9:1 alarm
// runs, so the phase + countdown are visible without returning to the Race
// tab, with a one-tap stop.
// ─────────────────────────────────────────────────────────────────────────────

export const RunWalkIndicator: React.FC = () => {
  const t = useStore((s) => s.runWalkTimer)
  if (!t.running) return null
  const isRun = t.phase === 'run'
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-app pointer-events-none">
      <div className={`mx-auto flex items-center justify-between gap-3 rounded-xl px-3 py-2 shadow-lg pointer-events-auto ${
        isRun ? 'bg-green-700 text-white' : 'bg-blue-700 text-white'
      }`}>
        <span className="text-sm font-bold tabular-nums">
          {isRun ? 'RUN' : 'WALK'} · {formatDuration(t.secsLeft)}
        </span>
        <span className="text-[11px] opacity-90">9:1 · cycle {t.cycle + 1}</span>
        <button
          className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold active:bg-white/30"
          onClick={stopRunWalkTimer}
        >
          Stop
        </button>
      </div>
    </div>
  )
}