interface ProgressRingProps {
  /** 0–1 */
  progress: number
  size?: number
  strokeWidth?: number
  /** Tailwind text-colour class for the ring */
  colorClass?: string
  /** Centre label */
  label?: string
  /** Sub-label beneath the number */
  sublabel?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressRing — circular progress indicator. SVG, lightweight.
// ─────────────────────────────────────────────────────────────────────────────

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 64,
  strokeWidth = 6,
  colorClass = 'text-brand-600',
  label,
  sublabel,
}) => {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress))
  const offset = c * (1 - clamped)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={`${colorClass} stroke-current transition-all duration-300`}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label && <div className="text-sm font-semibold leading-none">{label}</div>}
          {sublabel && <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</div>}
        </div>
      )}
    </div>
  )
}
