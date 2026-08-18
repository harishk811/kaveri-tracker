import { useState, useEffect, useRef, useMemo } from 'react'
import type { Session, SwimLog } from '@/types'
import { useStore } from '@/store/useStore'
import { saveDraft, loadDraft, clearDraft, registerDraftFlush } from '@/lib/drafts'
import { hapticTick } from '@/lib/haptics'

// ─────────────────────────────────────────────────────────────────────────────
// SwimLogger — log a swim session against the prescribed drill set.
// Distance, drills completed (tick each), 200 m continuous milestone, note.
// ─────────────────────────────────────────────────────────────────────────────

interface SwimLoggerProps {
  session: Session
  date: string
  existing?: SwimLog
}

export const SwimLogger: React.FC<SwimLoggerProps> = ({ session, date, existing }) => {
  const putSwimLog = useStore((s) => s.putSwimLog)
  const draftKey = `swim:${session.id}`
  const draft = useMemo(() => loadDraft<SwimDraft>(draftKey), [draftKey])
  const [distance, setDistance] = useState(existing?.actualDistance ?? draft?.distance ?? '')
  const [drillsDone, setDrillsDone] = useState<string[]>(existing?.drillsCompleted ?? draft?.drillsDone ?? [])
  const [continuous200m, setContinuous200m] = useState(existing?.continuous200m ?? draft?.continuous200m ?? false)
  const [note, setNote] = useState(existing?.note ?? draft?.note ?? '')
  const [saved, setSaved] = useState(false)

  // Prescribed drill list from the session (· separated)
  const prescribedDrills = useMemo(() => session.swim?.drills.split(' · ') ?? [], [session.swim?.drills])

  // A saved log always wins over a draft — and retires it
  useEffect(() => {
    if (!existing) return
    setDistance(existing?.actualDistance ?? '')
    setDrillsDone(existing?.drillsCompleted ?? [])
    setContinuous200m(existing?.continuous200m ?? false)
    setNote(existing?.note ?? '')
    clearDraft(draftKey)
  }, [existing, draftKey])

  // Debounced draft save + immediate flush when the page is hidden
  const draftRef = useRef<SwimDraft>({ distance, drillsDone, continuous200m, note })
  draftRef.current = { distance, drillsDone, continuous200m, note }
  useEffect(() => {
    const t = setTimeout(() => saveDraft(draftKey, draftRef.current), 400)
    return () => clearTimeout(t)
  }, [distance, drillsDone, continuous200m, note, draftKey])
  useEffect(() => registerDraftFlush(() => saveDraft(draftKey, draftRef.current)), [draftKey])

  interface SwimDraft {
  distance?: string
  drillsDone?: string[]
  continuous200m?: boolean
  note?: string
}

  const toggleDrill = (d: string) => {
    setDrillsDone((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d])
  }

  const save = () => {
    void putSwimLog({
      sessionId: session.id,
      date,
      actualDistance: distance || undefined,
      drillsCompleted: drillsDone,
      continuous200m: continuous200m,
      note: note || undefined,
    })
    clearDraft(draftKey)
    hapticTick()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Actual swim
      </div>

      <div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">Distance</div>
        <input
          type="text"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="e.g. 500 m"
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Drills completed</div>
        <div className="space-y-1">
          {prescribedDrills.map((d) => (
            <label key={d} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={drillsDone.includes(d)}
                onChange={() => toggleDrill(d)}
              />
              <span className="font-mono">{d}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={continuous200m}
          onChange={(e) => setContinuous200m(e.target.checked)}
        />
        200 m continuous without stopping
        <span className="text-[10px] text-brand-700 dark:text-brand-200 ml-1">(the only milestone that matters before December)</span>
      </label>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="How did the water feel? Breathing, catch, anything to note..."
        rows={2}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />

      <button className="btn-primary w-full" onClick={save}>
        {saved ? '✓ Saved' : 'Save swim'}
      </button>
    </div>
  )
}
