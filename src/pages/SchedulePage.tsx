import { useState } from 'react'
import { PLAN, STEP2_BLOCKS, DAY_NAMES } from '@/data/plan'
import { weekOfPlan, todayISO, formatShortDate, weekDates } from '@/lib/dates'
import { StageBadge } from '@/components/StageBadge'
import { DecisionGate } from '@/components/DecisionGate'
import { AdaptiveWeekCard, WeeklyRecapCard } from '@/components/CoachTools'
import type { StageTag, PlanWeek } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Schedule page — the 14-week timeline with volume bars and stage tags.
// Tap a week to see its day-by-day breakdown. Below the 14 weeks is the
// Step 2 (70.3 Goa) block timeline.
// ─────────────────────────────────────────────────────────────────────────────

export const SchedulePage: React.FC = () => {
  const today = todayISO()
  const currentWeek = weekOfPlan(today)
  const [openWeek, setOpenWeek] = useState<number | null>(currentWeek || 1)
  const [view, setView] = useState<'step1' | 'step2'>('step1')

  const maxVolume = Math.max(...PLAN.map((w) => w.volumeKm))
  const maxLongRun = Math.max(...PLAN.map((w) => w.longRunKm))

  return (
    <div className="p-4 pt-safe-top space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Schedule</div>
            <div className="text-xl font-bold">
              {view === 'step1' ? 'Step 1 · Kaveri Marathon' : 'Step 2 · 70.3 Goa'}
            </div>
          </div>
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              className={`px-3 py-1 text-xs rounded-md ${view === 'step1' ? 'bg-white dark:bg-slate-900 shadow-sm font-medium' : 'text-slate-500'}`}
              onClick={() => setView('step1')}
            >Step 1</button>
            <button
              className={`px-3 py-1 text-xs rounded-md ${view === 'step2' ? 'bg-white dark:bg-slate-900 shadow-sm font-medium' : 'text-slate-500'}`}
              onClick={() => setView('step2')}
            >Step 2</button>
          </div>
        </div>
      </div>

      {view === 'step1' ? (
        <div className="space-y-3">
          {/* Decision support */}
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
              Decision support
            </div>
          </div>
          <DecisionGate />
          <AdaptiveWeekCard />

          {/* 14-week timeline */}
          <div className="space-y-2">
            {PLAN.map((w) => (
              <WeekRow
                key={w.week}
                week={w}
                isCurrent={w.week === currentWeek}
                isOpen={openWeek === w.week}
                onToggle={() => setOpenWeek(openWeek === w.week ? null : w.week)}
                maxVolume={maxVolume}
                maxLongRun={maxLongRun}
                today={today}
              />
            ))}
          </div>
        </div>
      ) : (
        <Step2Timeline />
      )}
    </div>
  )
}

// ── Week row ──────────────────────────────────────────────────────────────────

interface WeekRowProps {
  week: PlanWeek
  isCurrent: boolean
  isOpen: boolean
  onToggle: () => void
  maxVolume: number
  maxLongRun: number
  today: string
}

const WeekRow: React.FC<WeekRowProps> = ({ week, isCurrent, isOpen, onToggle, maxVolume, maxLongRun, today }) => {
  const volPct = (week.volumeKm / maxVolume) * 100
  const longPct = (week.longRunKm / maxLongRun) * 100
  const dates = weekDates(week.week)

  return (
    <div className={`card ${isCurrent ? 'ring-2 ring-brand-500/40' : ''}`}>
      <button className="w-full text-left" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            isCurrent ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {week.week}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">Week {week.week}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{week.dateRange}</span>
              {week.stageTags.map((t: StageTag) => <StageBadge key={t} tag={t} small />)}
              {isCurrent && <span className="chip bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 text-[10px]">Now</span>}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{week.focus}</div>
          </div>
          <span className="text-slate-400 text-sm">{isOpen ? '−' : '›'}</span>
        </div>

        {/* Volume + long-run bars */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
              <span>Volume</span><span>{week.volumeKm} km</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${volPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
              <span>Long run</span><span>{week.longRunKm} km</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${longPct}%` }} />
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-slide-up">
          {/* Day-by-day grid */}
          <div className="grid grid-cols-7 gap-1">
            {dates.map((d, i) => {
              const daySessions = week.sessions.filter((s) => s.day === i)
              const isToday = d === today
              return (
                <div
                  key={d}
                  className={`rounded-lg p-1.5 text-center min-h-[44px] ${
                    isToday
                      ? 'bg-brand-100 dark:bg-brand-900/40 ring-1 ring-brand-500'
                      : daySessions.length === 0
                      ? 'bg-slate-50 dark:bg-slate-800/30'
                      : 'bg-slate-100 dark:bg-slate-800/50'
                  }`}
                  title={formatShortDate(d)}
                >
                  <div className={`text-[9px] ${isToday ? 'font-bold text-brand-700 dark:text-brand-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {DAY_NAMES[i]}
                  </div>
                  <div className="text-[10px] mt-0.5">
                    {daySessions.length === 0
                      ? <span className="text-slate-300 dark:text-slate-600">·</span>
                      : daySessions.map((s) => (
                        <span key={s.id} className="block leading-tight" title={s.title}>
                          {kindEmoji(s.kind)}{s.keySession && ' ★'}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )
            })}
          </div>

          {/* Day-by-day list */}
          <div className="mt-3 space-y-1.5">
            {week.sessions.map((s) => (
              <div key={s.id} className="flex items-start gap-2 text-xs">
                <span className="text-slate-400 w-8">{DAY_NAMES[s.day]}</span>
                <span>{kindEmoji(s.kind)}</span>
                <span className="flex-1">
                  <span className={s.keySession ? 'font-semibold' : ''}>{s.title}</span>
                  {s.keySession && <span className="text-[10px] text-brand-700 dark:text-brand-200 ml-1">★ key</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Why this week */}
          <div className="mt-3 rounded-lg bg-brand-50 dark:bg-brand-900/30 p-2.5">
            <div className="text-[10px] font-semibold text-brand-700 dark:text-brand-100 uppercase tracking-wide mb-1">
              Why the week is shaped this way
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{week.rationale}</p>
          </div>

          {/* Weekly recap — lives inside its own week's dropdown */}
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <WeeklyRecapCard week={week.week} />
          </div>
        </div>
      )}
    </div>
  )
}

const kindEmoji = (k: string): string => ({
  run: '🏃', strength: '🏋️', swim: '🏊', walk: '🚶', rest: '😴', race: '🏁', mobility: '🧘',
}[k] ?? '·')

// ── Step 2 timeline ───────────────────────────────────────────────────────────

const Step2Timeline: React.FC = () => (
  <div className="space-y-3">
    <div className="card">
      <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        Step 2 begins after the Kaveri Marathon on 22 November 2026. The marathon block has already built the run leg, the pulling strength for the swim, and the posterior chain for the aero position. Cycling enters in January; structured swimming begins in December.
      </div>
    </div>
    {STEP2_BLOCKS.map((b) => (
      <div key={b.block} className="card">
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">{b.label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{b.dates}</span>
        </div>
        <div className="text-sm font-semibold mb-1">{b.focus}</div>
        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{b.content}</p>
      </div>
    ))}
    <div className="card bg-brand-50 dark:bg-brand-900/30">
      <div className="text-sm font-semibold mb-1">Where 4:30 lives</div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
        If 27 September 2026 does not open the 4:30 band, it is not gone — it moves to where it was always most likely to happen. Twelve months of consistent 50–70 km weeks, an aerobic base deepened by 70.3 cycling volume, and a body that has been through the marathon distance once and knows how to pace it. The ladder runs Kaveri November 2026 → 70.3 Goa 2027 → a flat, cool road marathon with 4:30 as the stated target.
      </p>
    </div>
  </div>
)
