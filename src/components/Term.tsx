import { useState, useCallback } from 'react'
import { GLOSSARY } from '@/data/plan'
import { createPortal } from 'react-dom'

// ─────────────────────────────────────────────────────────────────────────────
// Term — tap-to-explain glossary reference. Renders as a dotted-underline
// inline element; tapping opens a bottom-sheet with the plain-language
// explanation + why it matters.
// ─────────────────────────────────────────────────────────────────────────────

interface TermProps {
  children: string
  /** Optional override for the term key if it differs from the text */
  term?: string
  className?: string
}

export const Term: React.FC<TermProps> = ({ children, term, className = '' }) => {
  const [open, setOpen] = useState(false)
  const key = (term ?? children).toLowerCase()
  const entry = GLOSSARY.find((g) => g.term.toLowerCase() === key
    || g.term.toLowerCase().includes(key)
    || key.includes(g.term.toLowerCase()))

  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
  }, [])

  if (!entry) {
    // No glossary entry — render as plain text
    return <span className={className}>{children}</span>
  }

  return (
    <>
      <span className={`term ${className}`} onClick={handleOpen}>{children}</span>
      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-app bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-safe-bottom animate-slide-up max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-brand-700 dark:text-brand-100">{entry.term}</h3>
                <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mt-1">
                  {entry.category}
                </span>
              </div>
              <button className="btn-ghost -mr-2 -mt-1" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3">
              {entry.plain}
            </p>
            <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 p-3">
              <div className="text-xs font-semibold text-brand-700 dark:text-brand-100 mb-1">Why it matters</div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{entry.why}</p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
