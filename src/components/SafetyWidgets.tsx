import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { todayISO } from '@/lib/dates'
import {
  PAIN_TRAFFIC_LIGHT, STRESS_FRACTURE_WARNINGS, STRESS_FRACTURE_ACTION,
  INJURIES, GREEN_LIGHT_CHECKS, GREEN_LIGHT_ACTION, RED_FLAG_SYMPTOMS,
  CALF_RAISE_GATE,
} from '@/data/safety'
import type { PainLogEntry } from '@/types'
import { notify } from '@/lib/notifications'

// ─────────────────────────────────────────────────────────────────────────────────────
// SafetyWidgets — pain traffic light, stress-fracture red flags, Sunday green-light
// checklist, daily shin routine, calf-raise capacity gate. All from PDF Section 05.
// ─────────────────────────────────────────────────────────────────────────────────────

export const SafetyWidgets: React.FC = () => {
  const [tab, setTab] = useState<'pain' | 'greenlight' | 'shin' | 'injuries'>('pain')

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="card p-2">
        <div className="grid grid-cols-4 gap-1">
          <TabBtn active={tab === 'pain'} onClick={() => setTab('pain')}>Pain</TabBtn>
          <TabBtn active={tab === 'greenlight'} onClick={() => setTab('greenlight')}>Sunday</TabBtn>
          <TabBtn active={tab === 'shin'} onClick={() => setTab('shin')}>Shin</TabBtn>
          <TabBtn active={tab === 'injuries'} onClick={() => setTab('injuries')}>Injuries</TabBtn>
        </div>
      </div>

      {tab === 'pain' && <PainTrafficLight />}
      {tab === 'greenlight' && <GreenLightChecklist />}
      {tab === 'shin' && <ShinRoutine />}
      {tab === 'injuries' && <InjuriesList />}
    </div>
  )
}

// ── Pain traffic light ─────────────────────────────────────────────────────────────

const PainTrafficLight: React.FC = () => {
  const putPainLog = useStore((s) => s.putPainLog)
  const [intensity, setIntensity] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState<PainLogEntry['type']>('dull')
  const [context, setContext] = useState('')
  const [saved, setSaved] = useState(false)

  const light = computeLight(parseInt(intensity, 10))

  const log = () => {
    const entry: PainLogEntry = {
      id: `pain-${Date.now()}`,
      date: todayISO(),
      location: location || 'unspecified',
      intensity: parseInt(intensity, 10) || 0,
      type,
      context: context || undefined,
      light,
    }
    void putPainLog(entry)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    notify({
      title: `Pain logged · ${light.toUpperCase()}`,
      body: `${location || 'unspecified'} · ${intensity}/10 · ${type}`,
      tag: 'pain-log',
    })
  }

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-sm font-semibold mb-1">Pain traffic light</div>
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Tap your pain level and get the action. Applied to any pain, anywhere. Never race through amber.
        </div>
      </div>

      <div className="card space-y-3">
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Pain location</div>
          <input
            type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. left shin, right Achilles"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Intensity (0–10)</div>
          <input
            type="number" inputMode="numeric" min="0" max="10"
            value={intensity} onChange={(e) => setIntensity(e.target.value)}
            placeholder="0–10"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Type</div>
          <select
            value={type} onChange={(e) => setType(e.target.value as PainLogEntry['type'])}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          >
            {(['dull', 'sharp', 'ache', 'burning', 'stabbing'] as const).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Context (optional)</div>
          <input
            type="text" value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. during threshold run, km 8"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
          />
        </div>

        {/* Live result */}
        {intensity && (
          <div className={`rounded-xl p-3 ${
            light === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
            light === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' :
            'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className={`text-xs font-semibold uppercase tracking-wide ${
              light === 'green' ? 'text-green-700 dark:text-green-200' :
              light === 'amber' ? 'text-amber-700 dark:text-amber-200' :
              'text-red-700 dark:text-red-200'
            }`}>
              {light.toUpperCase()} · {intensity}/10
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-snug">
              {PAIN_TRAFFIC_LIGHT.find((p) => p.level === light)?.action}
            </p>
          </div>
        )}

        <button className="btn-primary w-full" onClick={log} disabled={!intensity}>
          {saved ? '✓ Logged' : 'Log pain'}
        </button>
      </div>

      {/* Reference cards */}
      <div className="card">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Reference</div>
        <div className="space-y-2">
          {PAIN_TRAFFIC_LIGHT.map((p) => (
            <div key={p.level} className={`rounded-lg p-2.5 ${
              p.level === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
              p.level === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' :
              'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className={`text-xs font-semibold uppercase ${
                p.level === 'green' ? 'text-green-700 dark:text-green-200' :
                p.level === 'amber' ? 'text-amber-700 dark:text-amber-200' :
                'text-red-700 dark:text-red-200'
              }`}>{p.level}</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-200 mt-0.5">{p.looksLike}</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{p.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stress fracture card */}
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="text-sm font-semibold text-red-700 dark:text-red-200 mb-1">
          ⚠ Stress fracture warning signs
        </div>
        <div className="text-[11px] text-red-800 dark:text-red-200 leading-relaxed">
          These override everything in this document:
        </div>
        <ul className="text-xs text-slate-700 dark:text-slate-200 mt-2 space-y-1">
          {STRESS_FRACTURE_WARNINGS.map((w, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-red-500">•</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-red-700 dark:text-red-200 mt-2 font-medium">{STRESS_FRACTURE_ACTION}</p>
      </div>
    </div>
  )
}

const computeLight = (intensity: number): 'green' | 'amber' | 'red' => {
  if (!intensity || isNaN(intensity)) return 'green'
  if (intensity <= 3) return 'green'
  if (intensity <= 5) return 'amber'
  return 'red'
}

// ── Sunday green-light checklist ───────────────────────────────────────────────────

const GreenLightChecklist: React.FC = () => {
  const [checks, setChecks] = useState<boolean[]>(() => GREEN_LIGHT_CHECKS.map(() => false))
  const done = checks.filter(Boolean).length
  const twoOrMoreUnchecked = checks.filter((c) => !c).length >= 2

  // Persist the most recent result
  const putJournal = useStore((s) => s.putJournal)
  const today = todayISO()
  const isSunday = new Date().getDay() === 0

  const saveResult = () => {
    const text = `Green-light checklist: ${done}/${GREEN_LIGHT_CHECKS.length} passed. ${
      twoOrMoreUnchecked ? '⚠ Two or more unchecked → cut next week 30%.' : 'All clear.'
    }`
    void putJournal(text, `greenlight:${today}`)
    notify({
      title: 'Sunday green-light checklist',
      body: twoOrMoreUnchecked ? '⚠ Cut next week 30%' : '✓ All clear',
      tag: 'green-light',
    })
  }

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-sm font-semibold mb-1">Sunday green-light checklist</div>
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Every Sunday evening. Eight checks before the week ahead. Two or more unchecked → cut next week 30%.
        </div>
      </div>

      <div className="card space-y-2">
        {GREEN_LIGHT_CHECKS.map((c, i) => (
          <label key={c.id} className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={checks[i]}
              onChange={(e) => setChecks((arr) => arr.map((v, j) => j === i ? e.target.checked : v))}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium">{c.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.description}</div>
            </div>
          </label>
        ))}
      </div>

      {twoOrMoreUnchecked && (
        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-200">⚠ Two or more unchecked</div>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">{GREEN_LIGHT_ACTION}</p>
        </div>
      )}

      {!isSunday && (
        <div className="text-[10px] text-slate-400 text-center">
          Best done on Sunday evening — today is not Sunday.
        </div>
      )}

      <button className="btn-primary w-full" onClick={saveResult}>Save result</button>
    </div>
  )
}

// ── Daily shin routine + calf-raise gate ───────────────────────────────────────────

const ShinRoutine: React.FC = () => {
  const [calfLeft, setCalfLeft] = useState('')
  const [calfRight, setCalfRight] = useState('')
  const [gateTested, setGateTested] = useState(false)

  const calfLNum = parseInt(calfLeft, 10)
  const calfRNum = parseInt(calfRight, 10)
  const asymmetry = !isNaN(calfLNum) && !isNaN(calfRNum) ? Math.abs(calfLNum - calfRNum) : NaN
  const gatePass = !isNaN(calfLNum) && calfLNum >= 25 && !isNaN(calfRNum) && calfRNum >= 25 && (asymmetry <= 2)

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-sm font-semibold mb-1">Daily six-minute shin routine</div>
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Every morning, barefoot, before the day starts — tracked in the Daily goal card on the Today page, alongside the reminder.
        </div>
      </div>

      {/* Calf-raise capacity gate — Week 6 */}
      <div className="card bg-brand-50 dark:bg-brand-900/30">
        <div className="text-sm font-semibold text-brand-700 dark:text-brand-100 mb-1">
          Calf-raise capacity gate · end of Week {CALF_RAISE_GATE.week}
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
          {CALF_RAISE_GATE.description}. {CALF_RAISE_GATE.actionIfFailed}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Left calf raises</div>
            <input
              type="number" inputMode="numeric" min="0"
              value={calfLeft} onChange={(e) => setCalfLeft(e.target.value)}
              placeholder="25"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Right calf raises</div>
            <input
              type="number" inputMode="numeric" min="0"
              value={calfRight} onChange={(e) => setCalfRight(e.target.value)}
              placeholder="25"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>
        {!isNaN(asymmetry) && (
          <div className={`text-[11px] mt-2 ${asymmetry <= 2 ? 'text-green-700 dark:text-green-200' : 'text-amber-700 dark:text-amber-200'}`}>
            Asymmetry: {asymmetry} reps ({asymmetry <= 2 ? 'within 2-rep limit ✓' : 'over 2-rep limit ⚠'})
          </div>
        )}
        {gatePass && !gateTested && (
          <button className="btn-primary w-full mt-2" onClick={() => setGateTested(true)}>
            ✓ Gate passed — proceed to next week
          </button>
        )}
        {gateTested && (
          <div className="text-[11px] text-green-700 dark:text-green-200 mt-2 font-medium">
            ✓ Gate passed and logged
          </div>
        )}
        {!gatePass && (calfLeft || calfRight) && (
          <div className="text-[11px] text-amber-700 dark:text-amber-200 mt-2">
            ⚠ Hold running volume flat until you can pass this gate.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Five named injuries ───────────────────────────────────────────────────────────

const InjuriesList: React.FC = () => (
  <div className="space-y-3">
    <div className="card">
      <div className="text-sm font-semibold mb-1">Five injuries worth knowing by name</div>
      <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        For each: the first sign, the immediate action, and what in the plan already defends against it.
      </div>
    </div>
    {INJURIES.map((inj) => (
      <div key={inj.name} className="card">
        <div className="text-sm font-semibold text-brand-700 dark:text-brand-100">{inj.name}</div>
        <div className="mt-2 space-y-1.5">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">First sign</div>
            <div className="text-xs text-slate-700 dark:text-slate-200">{inj.firstSign}</div>
          </div>
          <div>
            <div className="text-[10px] text-amber-700 dark:text-amber-200 uppercase tracking-wide">Immediate action</div>
            <div className="text-xs text-slate-700 dark:text-slate-200">{inj.immediateAction}</div>
          </div>
          <div>
            <div className="text-[10px] text-green-700 dark:text-green-200 uppercase tracking-wide">Already defended by</div>
            <div className="text-xs text-slate-700 dark:text-slate-200">{inj.defendedBy}</div>
          </div>
        </div>
      </div>
    ))}
    <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
      <div className="text-sm font-semibold text-red-700 dark:text-red-200 mb-1">Stop training and get seen the same day</div>
      <ul className="text-xs text-slate-700 dark:text-slate-200 mt-2 space-y-1">
        {RED_FLAG_SYMPTOMS.map((s, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-red-500">•</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
)

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
