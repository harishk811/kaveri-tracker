import { useState, useEffect, useRef, useMemo } from 'react'
import type { Session, RunLog } from '@/types'
import { useStore } from '@/store/useStore'
import { formatPace, timeStringToSeconds } from '@/lib/dates'
import { ZonePaceChip } from './ZoneBadge'
import { Term } from './Term'
import { saveDraft, loadDraft, clearDraft, registerDraftFlush } from '@/lib/drafts'
import { hapticTick } from '@/lib/haptics'

// ─────────────────────────────────────────────────────────────────────────────
// RunLogger — log an actual run against the prescribed block.
// Distance + duration → auto pace. Avg/max HR, cadence, RPE, splits,
// fuel, heat/humidity (on long runs), note. Deviations auto-flagged.
// ─────────────────────────────────────────────────────────────────────────────

interface RunLoggerProps {
  session: Session
  date: string
  existing?: RunLog
  isRace?: boolean
}

export const RunLogger: React.FC<RunLoggerProps> = ({ session, date, existing, isRace }) => {
  const putRunLog = useStore((s) => s.putRunLog)
  // Draft restore — if the tab gets killed mid-logging (Android background
  // kill is aggressive), the half-typed form comes back.
  const draftKey = `run:${session.id}`
  const draft = useMemo(() => loadDraft<RunDraft>(draftKey), [draftKey])
  const [distance, setDistance] = useState(existing?.actualDistanceKm?.toString() ?? draft?.distance ?? '')
  const [duration, setDuration] = useState(existing?.actualDurationSec ? formatHMS(existing.actualDurationSec) : draft?.duration ?? '')
  const [avgHr, setAvgHr] = useState(existing?.avgHr?.toString() ?? draft?.avgHr ?? '')
  const [maxHr, setMaxHr] = useState(existing?.maxHr?.toString() ?? draft?.maxHr ?? '')
  const [cadence, setCadence] = useState(existing?.avgCadence?.toString() ?? draft?.cadence ?? '')
  const [rpe, setRpe] = useState(existing?.rpe?.toString() ?? draft?.rpe ?? '')
  const [note, setNote] = useState(existing?.note ?? draft?.note ?? '')
  const [heat, setHeat] = useState(existing?.heat ?? draft?.heat ?? '')
  const [humidity, setHumidity] = useState(existing?.humidity ?? draft?.humidity ?? '')
  const [altered, setAltered] = useState(existing?.altered ?? draft?.altered ?? false)
  const [alteredReason, setAlteredReason] = useState(existing?.alteredReason ?? draft?.alteredReason ?? '')
  const [saved, setSaved] = useState(false)

  // A saved log always wins over a draft — and retires it
  useEffect(() => {
    if (!existing) return
    setDistance(existing?.actualDistanceKm?.toString() ?? '')
    setDuration(existing?.actualDurationSec ? formatHMS(existing.actualDurationSec) : '')
    setAvgHr(existing?.avgHr?.toString() ?? '')
    setMaxHr(existing?.maxHr?.toString() ?? '')
    setCadence(existing?.avgCadence?.toString() ?? '')
    setRpe(existing?.rpe?.toString() ?? '')
    setNote(existing?.note ?? '')
    setHeat(existing?.heat ?? '')
    setHumidity(existing?.humidity ?? '')
    setAltered(existing?.altered ?? false)
    setAlteredReason(existing?.alteredReason ?? '')
    clearDraft(draftKey)
  }, [existing, draftKey])

  // Debounced draft save on every keystroke, plus an immediate flush when
  // the page is hidden (app switch / tab kill).
  const draftRef = useRef<{ distance: string; duration: string; avgHr: string; maxHr: string; cadence: string; rpe: string; note: string; heat: string; humidity: string; altered: boolean; alteredReason: string }>({
    distance, duration, avgHr, maxHr, cadence, rpe, note, heat, humidity, altered, alteredReason,
  })
  draftRef.current = { distance, duration, avgHr, maxHr, cadence, rpe, note, heat, humidity, altered, alteredReason }
  useEffect(() => {
    const t = setTimeout(() => saveDraft(draftKey, draftRef.current), 400)
    return () => clearTimeout(t)
  }, [distance, duration, avgHr, maxHr, cadence, rpe, note, heat, humidity, altered, alteredReason, draftKey])
  useEffect(() => registerDraftFlush(() => saveDraft(draftKey, draftRef.current)), [draftKey])

  const distNum = parseFloat(distance)
  const durSec = timeStringToSeconds(duration)
  const computedPace = distNum > 0 && isFinite(durSec) && durSec > 0 ? durSec / distNum : NaN
  const prescribed = session.run

  const deviation = prescribed && distNum > 0 && prescribed.distanceKm > 0
    ? Math.abs((distNum - prescribed.distanceKm) / prescribed.distanceKm) > 0.1
    : false

  const isLongRun = prescribed?.zone === 'steady' && (prescribed.distanceKm ?? 0) >= 15

  const save = () => {
    const log: RunLog = {
      sessionId: session.id,
      date,
      actualDistanceKm: distNum > 0 ? distNum : undefined,
      actualDurationSec: isFinite(durSec) ? durSec : undefined,
      avgPace: isFinite(computedPace) ? formatPace(computedPace) : undefined,
      avgHr: avgHr ? Number(avgHr) : undefined,
      maxHr: maxHr ? Number(maxHr) : undefined,
      avgCadence: cadence ? Number(cadence) : undefined,
      rpe: rpe ? Number(rpe) : undefined,
      note: note || undefined,
      heat: heat || undefined,
      humidity: humidity || undefined,
      altered,
      alteredReason: alteredReason || undefined,
    }
    void putRunLog(log)
    clearDraft(draftKey)
    hapticTick()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {isRace ? 'Race result' : 'Actual run'}
        </div>
        {prescribed && <ZonePaceChip zone={prescribed.zone} pace={prescribed.pace} />}
      </div>

      {/* Primary: distance + duration → pace */}
      <div className="grid grid-cols-3 gap-2">
        <Field label="Distance (km)" value={distance} onChange={setDistance} type="decimal" placeholder="0.0" />
        <Field label="Duration" value={duration} onChange={setDuration} placeholder="M:SS or H:MM:SS" />
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Pace (auto)</div>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 text-sm font-mono">
            {isFinite(computedPace) ? formatPace(computedPace) : '—'}
          </div>
          {prescribed && (
            <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
              planned {prescribed.pace}
            </div>
          )}
        </div>
      </div>

      {/* HR + cadence + RPE */}
      <div className="grid grid-cols-3 gap-2">
        <Field label="Avg HR" value={avgHr} onChange={setAvgHr} type="numeric" placeholder="bpm" />
        <Field label="Max HR" value={maxHr} onChange={setMaxHr} type="numeric" placeholder="bpm" />
        <Field label="Cadence" value={cadence} onChange={setCadence} type="numeric" placeholder="spm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400"><Term term="RPE">RPE</Term> (1–10)</div>
          <select
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {isLongRun && (
          <>
            <Field label="Heat (°C)" value={heat} onChange={setHeat} type="numeric" placeholder="e.g. 28" />
            <Field label="Humidity %" value={humidity} onChange={setHumidity} type="numeric" placeholder="e.g. 75" />
          </>
        )}
      </div>

      {/* Altered flag */}
      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={altered}
          onChange={(e) => setAltered(e.target.checked)}
        />
        Altered from prescribed (cut short, swapped, etc.)
      </label>
      {altered && (
        <input
          type="text"
          value={alteredReason}
          onChange={(e) => setAlteredReason(e.target.value)}
          placeholder="Reason (e.g. shins talking, cut to 6 km)"
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
      )}

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="How did it feel? Weather, legs, what worked..."
        rows={2}
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm resize-none"
      />

      <div className="flex items-center gap-2">
        <button className="btn-primary flex-1" onClick={save}>
          {saved ? '✓ Saved' : 'Save run'}
        </button>
        {deviation && (
          <span className="chip bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-[10px]">
            ⚠ Distance differs from prescribed
          </span>
        )}
      </div>
    </div>
  )
}

interface RunDraft {
  distance?: string
  duration?: string
  avgHr?: string
  maxHr?: string
  cadence?: string
  rpe?: string
  note?: string
  heat?: string
  humidity?: string
  altered?: boolean
  alteredReason?: string
}

const Field: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'numeric' | 'decimal'
  placeholder?: string
}> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <div className="text-[10px] text-slate-500 dark:text-slate-400">{label}</div>
    <input
      type={type === 'text' ? 'text' : 'number'}
      inputMode={type === 'numeric' ? 'numeric' : type === 'decimal' ? 'decimal' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
    />
  </div>
)

const formatHMS = (sec: number): string => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
