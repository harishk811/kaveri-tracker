import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { DAY_NAMES_FULL } from '@/lib/dates'
import type { SessionTimes, ReminderTimes, CabTimes } from '@/types'
import { fireReminderNow } from '@/lib/reminders'
import { downloadCsv } from '@/lib/export'
import { importCsv } from '@/lib/import'
import { hapticTick } from '@/lib/haptics'
import { PwaHealthCard } from '@/components/PwaHealth'

// ─────────────────────────────────────────────────────────────────────────────
// SettingsPage — weekly time planner, dark mode, export/import, date anchor,
// notification preferences, and an "About" section.
// ─────────────────────────────────────────────────────────────────────────────

const DAY_KEYS: (keyof SessionTimes)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const REMINDER_ROWS: Array<{ id: 'shin' | 'legs' | 'weighIn' | 'greenLight' | 'session'; label: string; hint: string }> = [
  { id: 'shin', label: 'Daily shin routine', hint: 'Every day' },
  { id: 'legs', label: 'Legs elevated', hint: 'Every day' },
  { id: 'weighIn', label: 'Sunday weigh-in', hint: 'Sundays' },
  { id: 'greenLight', label: 'Green-light checklist', hint: 'Sundays' },
  { id: 'session', label: 'Today\u2019s sessions', hint: 'Every training day' },
]

const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => { onChange(!checked); hapticTick() }}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
  >
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
)

export const SettingsPage: React.FC = () => {
  const settings = useStore((s) => s.settings)
  const saveSettings = useStore((s) => s.saveSettings)
  const exportAll = useStore((s) => s.exportAll)
  const importAll = useStore((s) => s.importAll)
  const wipe = useStore((s) => s.wipe)
  const loadSettings = useStore((s) => s.loadSettings)

  const [times, setTimes] = useState<SessionTimes>(settings?.sessionTimes ?? defaultTimes())
  const [startDate, setStartDate] = useState(settings?.startDate ?? '2026-08-17')
  const [restTimer, setRestTimer] = useState(settings?.restTimerSec ?? 90)
  const [bodyWeight, setBodyWeight] = useState(settings?.bodyWeightKg ?? 75)
  const [exportMsg, setExportMsg] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { void loadSettings() }, [loadSettings])
  useEffect(() => {
    if (settings) {
      setTimes(settings.sessionTimes)
      setStartDate(settings.startDate)
      setRestTimer(settings.restTimerSec)
      setBodyWeight(settings.bodyWeightKg)
    }
  }, [settings])

  // Apply dark mode
  useEffect(() => {
    const mode = settings?.darkMode ?? 'auto'
    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else if (mode === 'light') root.classList.remove('dark')
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) root.classList.add('dark')
      else root.classList.remove('dark')
    }
  }, [settings?.darkMode])

  const updateTime = (day: keyof SessionTimes, slot: 'am' | 'pm', value: string) => {
    // Harden against partial sessionTimes (e.g. from an older backup import)
    const next = { ...times, [day]: { ...(times[day] ?? { am: undefined, pm: undefined }), [slot]: value || undefined } }
    setTimes(next)
    void saveSettings({ sessionTimes: next })
  }

  const doExport = async () => {
    const payload = await exportAll()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    setExportMsg('✓ Backup downloaded')
    const a = document.createElement('a')
    a.href = url
    a.download = `kaveri-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => { URL.revokeObjectURL(url); setExportMsg(null) }, 2000)
  }

  const rem = settings?.reminders ?? { shin: '06:30', legs: '20:00', weighIn: '07:00', greenLight: '19:00', session: '18:30', sessionEnabled: true }
  const cab = settings?.cab ?? { enabled: false, go: '08:30', ret: '18:30' }

  const setRemTime = (key: keyof ReminderTimes, value: string) => {
    void saveSettings({ reminders: { ...rem, [key]: value } })
    hapticTick()
  }

  const setCab = (patch: Partial<CabTimes>) => {
    void saveSettings({ cab: { ...cab, ...patch } })
    hapticTick()
  }

  const doImport = async (file: File) => {
    try {
      const text = await file.text()
      if (text.trimStart().startsWith('{')) {
        const payload = JSON.parse(text)
        await importAll(payload)
        setImportMsg('✓ Import successful')
      } else {
        const result = importCsv(text)
        setImportMsg(`✓ CSV imported — ${result.runs} runs · ${result.checkIns} check-ins · ${result.journals} journals`)
      }
    } catch (e) {
      setImportMsg(`✗ Import failed: ${(e as Error).message}`)
    }
    setTimeout(() => setImportMsg(null), 3000)
  }

  return (
    <div className="p-4 pt-safe-top space-y-4">
      <div className="card">
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Settings</div>
        <div className="text-xl font-bold mt-0.5">Plan & app</div>
      </div>

      {/* Weekly time planner */}
      <div className="card">
        <div className="text-sm font-semibold mb-1">Weekly session times</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
          Set when your sessions happen. The plan's structure (which sessions on which days) stays the same — only the clock times are yours. Reminders fire at these times.
        </div>
        <div className="space-y-2">
          {DAY_KEYS.map((day, i) => (
            <div key={day} className="flex items-center gap-2">
              <div className="w-20 text-xs text-slate-600 dark:text-slate-300">{DAY_NAMES_FULL[i].slice(0, 3)}</div>
              <input
                type="time"
                value={times[day]?.am ?? ''}
                onChange={(e) => updateTime(day, 'am', e.target.value)}
                className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                type="time"
                value={times[day]?.pm ?? ''}
                onChange={(e) => updateTime(day, 'pm', e.target.value)}
                className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex-1 text-center">AM</span>
          <span className="flex-1 text-center">PM</span>
        </div>
      </div>

      {/* Plan anchor + body */}
      <div className="card">
        <div className="text-sm font-semibold mb-2">Plan anchor</div>
        <div className="space-y-2">
          <label className="block">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Week 1 Monday (start date)</div>
            <input
              type="date"
              value={startDate}
              disabled
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1.5 text-sm"
            />
            <div className="text-[10px] text-slate-400 mt-1">
              Fixed — every week, session and date in this app is anchored to the PDF's schedule. Change it and the plan would no longer match the document.
            </div>
          </label>
          <label className="block">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Body weight (kg, for plate calc)</div>
            <input
              type="number" inputMode="decimal"
              value={bodyWeight}
              onChange={(e) => {
                const v = e.target.value
                setBodyWeight(Number(v))
                if (v !== '') void saveSettings({ bodyWeightKg: Number(v) })
              }}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Default rest timer (seconds)</div>
            <input
              type="number" inputMode="numeric"
              value={restTimer}
              onChange={(e) => {
                const v = e.target.value
                setRestTimer(Number(v))
                if (v !== '') void saveSettings({ restTimerSec: Number(v) })
              }}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>

      {/* Reminders & alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold">Reminders & alerts</div>
          <Switch
            checked={settings?.remindersEnabled ?? false}
            onChange={(v) => { void saveSettings({ remindersEnabled: v }); hapticTick() }}
            label="Enable reminders"
          />
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
          Fires a notification (mirrored to your watch via Zepp) plus a sound and buzz while the app is open. Needs notification permission — grant it from the Race tab's banner, or in Settings → apps.
        </div>

        {REMINDER_ROWS.map((r) => (
          <div key={r.id} className="flex items-center gap-2 py-1.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{r.label}</div>
              <div className="text-[10px] text-slate-400">{r.hint}</div>
            </div>
            <input
              type="time"
              value={rem[r.id]}
              onChange={(e) => setRemTime(r.id, e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-xs"
            />
            <button className="btn-ghost text-[10px] px-2" onClick={() => fireReminderNow(r.id)}>Test</button>
          </div>
        ))}

        {/* Cab windows — the "ask": show until cab details are filled in */}
        <div className={`mt-2 border-t ${cab.enabled ? 'border-slate-100 dark:border-slate-800' : 'border-brand-200 dark:border-brand-800'}`}>
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-medium">In-cab exercises (Tue–Thu)</div>
            <Switch
              checked={cab.enabled}
              onChange={(v) => setCab({ enabled: v })}
              label="Enable in-cab reminders"
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            {cab.enabled
              ? `You're all set — in-cab nudge at ${cab.go} (going) and ${cab.ret} (returning) on office days.`
              : 'When are your cab rides? Set the going and return times so the in-cab exercises (ankle pumps, toe circles, seated heel raises) fire during the rides.'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="flex-1">
              <span className="text-[10px] text-slate-400">Going</span>
              <input
                type="time"
                value={cab.go}
                onChange={(e) => setCab({ go: e.target.value })}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              />
            </label>
            <label className="flex-1">
              <span className="text-[10px] text-slate-400">Returning</span>
              <input
                type="time"
                value={cab.ret}
                onChange={(e) => setCab({ ret: e.target.value })}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              />
            </label>
            <button className="btn-ghost text-[10px] px-2 mt-3.5" onClick={() => fireReminderNow('in-cab')}>Test</button>
          </div>
          {!cab.enabled && (
            <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-2">Tip: enable this on office days — it's the easiest recovery win of the week.</div>
          )}
        </div>

        {/* Sound toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
          <div>
            <div className="text-xs font-medium">Sound alerts</div>
            <div className="text-[10px] text-slate-400">Chimes for 9:1 run-walk, gels, reminders</div>
          </div>
          <Switch
            checked={settings?.soundEnabled ?? true}
            onChange={(v) => { void saveSettings({ soundEnabled: v }); hapticTick() }}
            label="Sound alerts"
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="text-sm font-semibold mb-2">Appearance</div>
        <div className="flex gap-1.5">
          {(['auto', 'light', 'dark'] as const).map((m) => (
            <button
              key={m}
              onClick={() => void saveSettings({ darkMode: m })}
              className={`btn flex-1 text-xs ${settings?.darkMode === m ? 'btn-primary' : 'btn-secondary'}`}
            >
              {m === 'auto' ? 'Auto' : m === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>

      {/* Export / import */}
      <div className="card">
        <div className="text-sm font-semibold mb-1">Backup & restore</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
          Export saves all your logs to a JSON file. Import on any device to sync (e.g., phone → laptop). Supabase cloud sync is staged for v2 — see README.
        </div>
        <div className="space-y-2">
          <button className="btn-secondary w-full text-sm" onClick={doExport}>
            ⬇ Export backup (JSON)
          </button>
          <button className="btn-secondary w-full text-sm" onClick={() => downloadCsv()}>
            📄 Export CSV (runs · check-ins · journal)
          </button>
          <button className="btn-secondary w-full text-sm" onClick={() => fileInputRef.current?.click()}>
            ⬆ Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void doImport(f)
              e.target.value = ''
            }}
          />
          {importMsg && <div className="text-xs text-center">{importMsg}</div>}
          {exportMsg && <div className="text-xs text-center text-green-700 dark:text-green-300">{exportMsg}</div>}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-200 dark:border-red-800">
        <div className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Danger zone</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
          Wipe all logs, journals, and settings from this device. Cannot be undone.
        </div>
        {!showWipeConfirm ? (
          <button className="btn-secondary w-full text-sm text-red-700 dark:text-red-300" onClick={() => setShowWipeConfirm(true)}>
            Wipe all data
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-red-700 dark:text-red-300">Are you sure? Export a backup first if you might want it.</div>
            <div className="flex gap-2">
              <button className="btn flex-1 text-sm bg-red-600 text-white" onClick={() => { void wipe(); setShowWipeConfirm(false) }}>
                Yes, wipe everything
              </button>
              <button className="btn-secondary flex-1 text-sm" onClick={() => setShowWipeConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card bg-slate-50 dark:bg-slate-800/50">
        <div className="text-sm font-semibold mb-1">About this app</div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          A two-step training tracker for the Kaveri Trail Marathon (22 Nov 2026) and Ironman 70.3 Goa (2027). The training plan is faithful to the Two-Step Plan PDF — every pace, volume, gate, and rule preserved. The app adds tracking, prescribed-vs-actual logging, decision support, and race-day tools. Install to your home screen for offline use.
        </p>
        <div className="text-[10px] text-slate-400 mt-2">v1.0 · localStorage · Supabase-ready for v2</div>
      </div>

      {/* Offline & service worker health — see PwaHealth */}
      <PwaHealthCard />
    </div>
  )
}

function defaultTimes(): SessionTimes {
  return {
    mon: { am: '06:00' },
    tue: { pm: '17:00' },
    wed: { pm: '18:00' },
    thu: { pm: '17:00' },
    fri: { am: '06:00' },
    sat: { am: '07:00' },
    sun: { am: '06:30', pm: '17:00' },
  }
}
