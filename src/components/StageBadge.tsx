import { useState, useCallback } from 'react'
import { STAGES } from '@/data/plan'
import type { StageTag } from '@/types'
import { createPortal } from 'react-dom'

// ─────────────────────────────────────────────────────────────────────────────
// StageBadge — coloured stage tag (Build/Deload/Peak/Taper/Race/Recovery/Hurdle)
// Tap opens a bottom-sheet explaining what the stage means, what the body is
// doing, what "good" feels like, and what's concerning.
// ─────────────────────────────────────────────────────────────────────────────

interface StageBadgeProps {
  tag: StageTag
  small?: boolean
}

export const StageBadge: React.FC<StageBadgeProps> = ({ tag, small = false }) => {
  const [open, setOpen] = useState(false)
  const stage = STAGES[tag]
  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }, [])

  if (!stage) return null

  const colorClass: Record<StageTag, string> = {
    Build: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    Deload: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    Peak: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    Taper: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    Race: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    Recovery: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    Hurdle: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={`What does ${tag} mean?`}
        className={`chip ${colorClass[tag]} ${small ? 'text-[10px] px-2 py-0.5' : ''} cursor-help`}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpen(e as unknown as React.MouseEvent)
          }
        }}
        title={`What does ${tag} mean?`}
      >
        {tag}
      </span>
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-app bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-safe-bottom animate-slide-up max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-semibold" style={{ color: stage.colour.startsWith('zone-') ? undefined : stage.colour }}>
                <span className={`chip ${colorClass[tag]} mr-2`}>{tag}</span>
                stage
              </h3>
              <button className="btn-ghost -mr-2 -mt-1" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-4">{stage.meaning}</p>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">What your body is doing</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{stage.bodyAdaptation}</p>
              </div>
              <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3">
                <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1 uppercase tracking-wide">What "good" feels like</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{stage.goodFeelsLike}</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 uppercase tracking-wide">What's concerning</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{stage.concerning}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
