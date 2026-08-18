import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { todayISO, formatShortDate } from '@/lib/dates'
import { DateNav } from '@/components/DateNav'
import { MorningCheckIn } from '@/components/MorningCheckIn'
import { AdditiveWidgets } from '@/components/AdditiveWidgets'
import { SafetyWidgets } from '@/components/SafetyWidgets'
import { useStore } from '@/store/useStore'

// ─────────────────────────────────────────────────────────────────────────────
// RecoveryPage — the body-signal side of the day, away from the training
// screen: morning check-in, safety gates and additive widgets. Date nav lets
// you backfill a missed check-in; safety/additive widgets always reflect
// today (they are state, not logs), so they only render on today.
// ─────────────────────────────────────────────────────────────────────────────

export const RecoveryPage: React.FC = () => {
  const settings = useStore((s) => s.settings)
  const startDate = settings?.startDate ?? '2026-08-17'
  const planEnd = format(addDays(parseISO(startDate), 97), 'yyyy-MM-dd') // Week 14 Sunday
  const today = todayISO()
  const [selected, setSelected] = useState(today)
  const viewDate = selected < startDate ? startDate : selected > planEnd ? planEnd : selected
  const isToday = viewDate === today
  const dayIdx = (new Date(`${viewDate}T12:00:00`).getDay() + 6) % 7
  const isOfficeDay = dayIdx >= 1 && dayIdx <= 3 // Tue–Thu
  const cab = useStore((s) => s.settings?.cab)

  return (
    <div className="p-4 pt-safe-top space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recovery</div>
            <div className="text-xl font-bold mt-0.5">Body signals</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Check in before you run — the data that decides today's intensity.
            </div>
          </div>
          <div className="text-3xl">💚</div>
        </div>
        <DateNav viewDate={viewDate} startDate={startDate} planEnd={planEnd} today={today} onChange={setSelected} />
      </div>

      <MorningCheckIn date={viewDate} />

      {isToday && isOfficeDay && !cab?.enabled && (
        <div className="card border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-brand-800 dark:text-brand-100">🚕 Office day — in-cab exercises</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                You're in a cab today. Tell the app your going & return times and it will nudge the in-cab exercises
                (ankle pumps, toe circles, seated heel raises) right when the rides start.
              </div>
            </div>
          </div>
          <Link to="/settings" className="btn-primary text-xs w-full mt-2">Set cab times →</Link>
        </div>
      )}

      {isToday ? (
        <>
          <SafetyWidgets />
          <AdditiveWidgets />
        </>
      ) : (
        <div className="card text-center py-4">
          <div className="text-xl mb-1">📅</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Safety & recovery widgets reflect today's live state — hop back to {formatShortDate(today)} for the full picture.
          </div>
        </div>
      )}
    </div>
  )
}