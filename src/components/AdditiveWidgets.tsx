import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { todayISO } from '@/lib/dates'
import type { SleepLog } from '@/types'
import {
  notifyInCabBreak, notifyLegsElevated, notifyWeighIn, notifyGreenLight, notify,
} from '@/lib/notifications'

// ─────────────────────────────────────────────────────────────────────────────────────
// AdditiveWidgets — the 7 approved widgets that surface PDF instructions as
// trackable actions with reminders. Shown on the Recovery tab below the
// morning check-in and safety widgets.
// ─────────────────────────────────────────────────────────────────────────────────────

export const AdditiveWidgets: React.FC = () => {
  const [tab, setTab] = useState<'today' | 'sleep' | 'recovery'>('today')

  return (
    <div className="space-y-3">
      <div className="card p-2">
        <div className="grid grid-cols-3 gap-1">
          <TabBtn active={tab === 'today'} onClick={() => setTab('today')}>Today</TabBtn>
          <TabBtn active={tab === 'sleep'} onClick={() => setTab('sleep')}>Sleep</TabBtn>
          <TabBtn active={tab === 'recovery'} onClick={() => setTab('recovery')}>Recovery</TabBtn>
        </div>
      </div>
      {tab === 'today' && <TodayWidgets />}
      {tab === 'sleep' && <SleepWidget />}
      {tab === 'recovery' && <RecoveryWidgets />}
    </div>
  )
}

// ── Today tab: shin routine + in-cab + warm-up ───────────────────────────────────────

const TodayWidgets: React.FC = () => {
  const dayIdx = (new Date().getDay() + 6) % 7
  const isOfficeDay = dayIdx >= 1 && dayIdx <= 3  // Tue-Thu
  const isSunday = dayIdx === 6
  const isLongRunDay = isSunday  // Sunday long run

  return (
    <div className="space-y-3">
      {isOfficeDay && (
        <div className="card">
          <div className="text-sm font-semibold mb-1">In-cab movement break</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Office days (Tue–Thu). Every 30 min: 20 ankle pumps · 15 toe circles · 10 seated heel raises.
          </div>
          <button className="btn-secondary w-full mt-2 text-xs" onClick={() => notifyInCabBreak()}>
            ⏰ Send in-cab reminder
          </button>
        </div>
      )}

      {isLongRunDay && (
        <div className="card">
          <div className="text-sm font-semibold mb-1">Pre-run warm-up walk · 10 min</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Before every quality and long run. Cold tissue is where lower-leg problems start.
          </div>
          <button className="btn-secondary w-full mt-2 text-xs" onClick={() => notify({
            title: 'Warm-up walk · 10 min',
            body: 'Walk easy before the run. Cold tissue is where lower-leg problems start.',
            tag: 'warmup-walk',
          })}>
            ⏰ Send warm-up reminder
          </button>
        </div>
      )}

      <div className="card">
        <div className="text-sm font-semibold mb-1">PM legs elevated · 10–15 min</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Flat on the back, legs up a wall. After the evening commute and after every Sunday long run.
        </div>
        <button className="btn-secondary w-full mt-2 text-xs" onClick={() => notifyLegsElevated()}>
          ⏰ Send legs-elevated reminder
        </button>
      </div>
    </div>
  )
}

// ── Sleep widget ─────────────────────────────────────────────────────────────────

const SleepWidget: React.FC = () => {
  const sleepLog = useStore((s) => s.sleepByDate[todayISO()])
  const loadSleepLog = useStore((s) => s.loadSleepLog)
  const putSleepLog = useStore((s) => s.putSleepLog)
  const [hours, setHours] = useState(sleepLog?.hours?.toString() ?? '')
  const [quality, setQuality] = useState(sleepLog?.quality?.toString() ?? '')
  const [note, setNote] = useState(sleepLog?.note ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => { void loadSleepLog(todayISO()) }, [loadSleepLog])
  useEffect(() => {
    setHours(sleepLog?.hours?.toString() ?? '')
    setQuality(sleepLog?.quality?.toString() ?? '')
    setNote(sleepLog?.note ?? '')
  }, [sleepLog])

  const save = () => {
    // Require the hours field — an empty save would log 0 h and corrupt the sleep chart.
    if (hours === '') return
    const log: SleepLog = {
      date: todayISO(),
      hours: Number(hours),
      quality: quality ? Number(quality) : undefined,
      note: note || undefined,
    }
    void putSleepLog(log)
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  const target = 7.5
  const hoursNum = Number(hours)
  const offTarget = !isNaN(hoursNum) && hoursNum < target
  const isWeekend = (new Date().getDay() + 6) % 7 >= 5  // Sat or Sun

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-sm font-semibold mb-1">Sleep log</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Sleep is a programmed variable, not a lifestyle preference. Target 7.5–8 h. Most muscle repair happens overnight.
        </div>
      </div>

      <div className="card space-y-2">
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Hours slept</div>
          <input
            type="number" inputMode="decimal" step="0.1" min="0" max="12"
            value={hours} onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 7.5"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Quality (1–5)</div>
          <select
            value={quality} onChange={(e) => setQuality(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <input
          type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
        />
        {offTarget && hours !== '' && (
          <div className="text-[11px] text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
            ⚠ Below 7.5 h target. At 9 sessions/week, sleep is a programmed variable.
          </div>
        )}
        <button className="btn-primary w-full" onClick={save} disabled={hours === ''}>
          {saved ? '✓ Saved' : 'Save sleep'}
        </button>
      </div>

      {isWeekend && (
        <div className="text-[10px] text-slate-400 text-center">
          Weekends are when you can catch up — use them.
        </div>
      )}
    </div>
  )
}

// ── Recovery tab: weigh-in + green-light + heat ─────────────────────────────────────

const RecoveryWidgets: React.FC = () => {
  const isSunday = new Date().getDay() === 0

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-sm font-semibold mb-1">Sunday weigh-in</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Same time, after toilet, before food. Track the four-week rolling average, never a single reading. Target 74–76 kg.
        </div>
        <button className="btn-secondary w-full mt-2 text-xs" onClick={() => notifyWeighIn()}>
          ⏰ Send Sunday weigh-in reminder
        </button>
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-1">Sunday green-light checklist</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          8 checks every Sunday evening. Two or more unchecked → cut next week 30%.
        </div>
        <button className="btn-secondary w-full mt-2 text-xs" onClick={() => notifyGreenLight()}>
          ⏰ Send green-light reminder
        </button>
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-1">Heat & humidity on long runs</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Log heat & humidity on Sunday long runs. Canal humidity climbs sharply after 8:30 a.m. — exactly when a slow starter is still comfortable and a fast starter is in trouble.
        </div>
      </div>

      {!isSunday && (
        <div className="text-[10px] text-slate-400 text-center">
          Best done on Sunday — today is not Sunday.
        </div>
      )}
    </div>
  )
}

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-lg py-2 text-xs font-medium transition ${
      active ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
)
