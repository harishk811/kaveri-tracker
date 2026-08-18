import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { todayISO, formatLongDate } from '@/lib/dates'
import { subDays, format, parseISO } from 'date-fns'
import { saveDraft, loadDraft, clearDraft, registerDraftFlush } from '@/lib/drafts'
import { hapticTick } from '@/lib/haptics'
import type { MorningCheckIn as MorningCheckInType } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// MorningCheckIn — daily morning metrics: RHR, sleep hours, weight (Sundays),
// mood, soreness, motivation. Tracked against thresholds (RHR +7 bpm alarm,
// weight band 74–76 kg). Lives on the Recovery tab.
// ─────────────────────────────────────────────────────────────────────────────

export const MorningCheckIn: React.FC<{ date?: string }> = ({ date: dateProp }) => {
  const date = dateProp ?? todayISO()
  const existing = useStore((s) => s.checkInsByDate[date])
  const putCheckIn = useStore((s) => s.putCheckIn)
  const loadCheckIn = useStore((s) => s.loadCheckIn)
  const loadCheckInsRange = useStore((s) => s.loadCheckInsRange)
  const checkInsByDate = useStore((s) => s.checkInsByDate)

  useEffect(() => { void loadCheckIn(date) }, [date, loadCheckIn])
  // Load the last 3 weeks so the RHR baseline is real, not assumed.
  useEffect(() => { void loadCheckInsRange(format(subDays(date, 20), 'yyyy-MM-dd'), date) }, [date, loadCheckInsRange])

  // Draft restore — a killed tab must not eat your morning numbers
  const draftKey = `checkin:${date}`
  const draft = useMemo(() => loadDraft<CheckInDraft>(draftKey), [draftKey])
  const [rhr, setRhr] = useState(existing?.rhr?.toString() ?? draft?.rhr ?? '')
  const [sleep, setSleep] = useState(existing?.sleepHours?.toString() ?? draft?.sleep ?? '')
  const [weight, setWeight] = useState(existing?.weightKg?.toString() ?? draft?.weight ?? '')
  const [mood, setMood] = useState(existing?.mood?.toString() ?? draft?.mood ?? '')
  const [soreness, setSoreness] = useState(existing?.soreness?.toString() ?? draft?.soreness ?? '')
  const [motivation, setMotivation] = useState(existing?.motivation?.toString() ?? draft?.motivation ?? '')
  const [note, setNote] = useState(existing?.note ?? draft?.note ?? '')
  const [saved, setSaved] = useState(false)

  // A saved check-in always wins over a draft — and retires it
  useEffect(() => {
    if (!existing) return
    setRhr(existing?.rhr?.toString() ?? '')
    setSleep(existing?.sleepHours?.toString() ?? '')
    setWeight(existing?.weightKg?.toString() ?? '')
    setMood(existing?.mood?.toString() ?? '')
    setSoreness(existing?.soreness?.toString() ?? '')
    setMotivation(existing?.motivation?.toString() ?? '')
    setNote(existing?.note ?? '')
    clearDraft(draftKey)
  }, [existing, draftKey])

  // Debounced draft save + immediate flush when the page is hidden
  const draftRef = useRef<CheckInDraft>({ rhr, sleep, weight, mood, soreness, motivation, note })
  draftRef.current = { rhr, sleep, weight, mood, soreness, motivation, note }
  useEffect(() => {
    const t = setTimeout(() => saveDraft(draftKey, draftRef.current), 400)
    return () => clearTimeout(t)
  }, [rhr, sleep, weight, mood, soreness, motivation, note, draftKey])
  useEffect(() => registerDraftFlush(() => saveDraft(draftKey, draftRef.current)), [draftKey])

  // Weight field follows the day being viewed, not the real clock — so a past
  // Sunday's entry is editable on any later day.
  const isSunday = new Date(`${date}T12:00:00`).getDay() === 0
  const rhrNum = parseInt(rhr, 10)
  // PDF rule: warn when RHR is ≥7 bpm above baseline for two mornings running.
  // Baseline = lowest RHR logged in the last 3 weeks (excluding today).
  const baseline = useMemo(() => {
    const priors = Object.values(checkInsByDate)
      .filter((c): c is MorningCheckInType => c !== null && c.date !== date && c.rhr !== undefined)
      .map((c) => c.rhr as number)
    return priors.length > 0 ? Math.min(...priors) : undefined
  }, [checkInsByDate, date])
  const rhrHigh = !isNaN(rhrNum) && baseline !== undefined && rhrNum > baseline + 7
  const weightNum = parseFloat(weight)
  const weightOff = !isNaN(weightNum) && (weightNum < 74 || weightNum > 76)

  // Last-7-days trail — one dot per day with a check-in
  const trail = useMemo(() => {
    const out: { date: string; has: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(parseISO(date), i), 'yyyy-MM-dd')
      out.push({ date: d, has: checkInsByDate[d] !== undefined && checkInsByDate[d] !== null })
    }
    return out
  }, [checkInsByDate, date])

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Good morning' : hour < 16 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Late check-in'
  const greetEmoji = hour < 11 ? '☀️' : hour < 16 ? '🌤️' : hour < 21 ? '🌙' : '🌃'

  const save = () => {
    const ci: MorningCheckInType = {
      date,
      rhr: rhr ? Number(rhr) : undefined,
      sleepHours: sleep ? Number(sleep) : undefined,
      weightKg: weight ? Number(weight) : undefined,
      mood: mood ? Number(mood) : undefined,
      soreness: soreness ? Number(soreness) : undefined,
      motivation: motivation ? Number(motivation) : undefined,
      note: note || undefined,
    }
    void putCheckIn(ci)
    clearDraft(draftKey)
    hapticTick()
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold flex items-center gap-1.5">{greetEmoji} {greeting}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {formatLongDate(date)} · body signals before you run
          </div>
        </div>
        {saved && <span className="chip bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200">✓ saved</span>}
      </div>

      {/* 7-day trail */}
      <div className="flex items-center gap-1.5 mb-4">
        {trail.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-2.5 w-2.5 rounded-full ${d.has ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'} ${d.date === date ? 'ring-2 ring-teal-400 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
            />
            <span className="text-[8px] text-slate-400 dark:text-slate-500">{format(parseISO(d.date), 'EEE')[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumField icon="❤️" label="RHR" hint={baseline !== undefined ? `baseline ${baseline}` : 'bpm'} value={rhr} onChange={setRhr} />
        <NumField icon="😴" label="Sleep" hint="target 7.5–8h" value={sleep} onChange={setSleep} />
        {isSunday ? (
          <NumField icon="⚖️" label="Weight" hint="band 74–76" value={weight} onChange={setWeight} />
        ) : (
          <div className="rounded-md bg-slate-50 dark:bg-slate-800/50 p-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center text-center leading-tight">
            ⚖️ Weigh-in on Sundays
          </div>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <ChipField label="Mood" emoji="😊" value={mood} onChange={setMood} />
        <ChipField label="Soreness" emoji="🦵" value={soreness} onChange={setSoreness} />
        <ChipField label="Motivation" emoji="🔥" value={motivation} onChange={setMotivation} />
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="mt-3 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
      />

      {rhrHigh && baseline !== undefined && (
        <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
          ⚠ RHR {rhrNum} is &gt;7 bpm over your baseline ({baseline} bpm). If this is the second morning in a row ≥7 bpm over baseline, take an unplanned easy day.
        </div>
      )}
      {isSunday && weightOff && (
        <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
          ⚠ Weight outside the 74–76 kg band. Track the four-week rolling average — if it drops more than 1 kg in a fortnight, add 300–400 kcal/day.
        </div>
      )}

      <button className="btn-primary w-full mt-3" onClick={save}>Save check-in</button>
    </div>
  )
}

interface CheckInDraft {
  rhr?: string
  sleep?: string
  weight?: string
  mood?: string
  soreness?: string
  motivation?: string
  note?: string
}

const NumField: React.FC<{ icon: string; label: string; hint: string; value: string; onChange: (v: string) => void }> = ({ icon, label, hint, value, onChange }) => (
  <div>
    <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{icon} {label} <span className="text-slate-400 dark:text-slate-600">({hint})</span></div>
    <input
      type="number" inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
    />
  </div>
)

const ChipField: React.FC<{ label: string; emoji: string; value: string; onChange: (v: string) => void }> = ({ label, emoji, value, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">{emoji} {label}</div>
    <div className="grid grid-cols-5 gap-1.5 flex-1 max-w-[230px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`h-9 rounded-lg text-sm font-semibold border transition tap-target ${
            value === n.toString()
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
          onClick={() => onChange(n.toString())}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
)