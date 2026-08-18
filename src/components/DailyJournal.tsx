import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { todayISO, formatLongDate } from '@/lib/dates'
import { saveDraft, loadDraft, clearDraft, registerDraftFlush } from '@/lib/drafts'
import { hapticTick } from '@/lib/haptics'

// ─────────────────────────────────────────────────────────────────────────────
// DailyJournal — free-form markdown-lite daily journal. One entry per day,
// searchable (in a future round). Saved automatically on blur, and drafted
// continuously so a background-killed tab never eats the text.
// ─────────────────────────────────────────────────────────────────────────────

export const DailyJournal: React.FC<{ date?: string }> = ({ date: dateProp }) => {
  const date = dateProp ?? todayISO()
  const existing = useStore((s) => s.journalsByDate[date])
  const loadJournal = useStore((s) => s.loadJournal)
  const putJournal = useStore((s) => s.putJournal)
  const draftKey = `journal:${date}`
  const draft = useMemo(() => loadDraft<{ text?: string }>(draftKey), [draftKey])
  const [text, setText] = useState(existing?.text ?? draft?.text ?? '')

  useEffect(() => { void loadJournal(date) }, [date, loadJournal])
  // A saved entry wins over a draft; otherwise keep the draft untouched
  useEffect(() => {
    if (existing) {
      setText(existing.text)
      clearDraft(draftKey)
    }
  }, [existing, draftKey])

  // Debounced draft save + immediate flush when the page is hidden
  const draftRef = useRef<{ text: string }>({ text })
  draftRef.current = { text }
  useEffect(() => {
    const t = setTimeout(() => saveDraft(draftKey, draftRef.current), 400)
    return () => clearTimeout(t)
  }, [text, draftKey])
  useEffect(() => registerDraftFlush(() => saveDraft(draftKey, draftRef.current)), [draftKey])

  const save = () => {
    void putJournal(text, date)
    clearDraft(draftKey)
    hapticTick()
  }

  return (
    <div className="card">
      <div className="text-sm font-semibold mb-1">Journal · {formatLongDate(date)}</div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
        Anything you want to remember — how you felt, what worked, what didn't.
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        placeholder="Write here..."
        rows={4}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-none"
      />
      <div className="text-[10px] text-slate-400 mt-1 text-right">
        Saved automatically · {existing?.updatedAt ? new Date(existing.updatedAt).toLocaleTimeString() : 'not yet saved'}
      </div>
    </div>
  )
}
