import { format, addDays, parseISO } from 'date-fns'

// ─────────────────────────────────────────────────────────────────────────────
// DateNav — shared prev/next/date-picker/today navigation inside the plan
// window, with an amber hint when viewing a past or future day. Used by
// TodayPage and RecoveryPage so backfilling works everywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const DateNav: React.FC<{
  viewDate: string
  startDate: string
  planEnd: string
  today: string
  onChange: (d: string) => void
}> = ({ viewDate, startDate, planEnd, today, onChange }) => {
  const isToday = viewDate === today
  const step = (delta: number) => onChange(format(addDays(parseISO(viewDate), delta), 'yyyy-MM-dd'))

  return (
    <>
      <div className="mt-3 flex items-center gap-2">
        <button
          className="btn-secondary tap-target !px-3"
          aria-label="Previous day"
          disabled={viewDate <= startDate}
          onClick={() => step(-1)}
        >‹</button>
        <input
          type="date"
          min={startDate}
          max={planEnd}
          value={viewDate}
          onChange={(e) => {
            const v = e.target.value
            if (v && v >= startDate && v <= planEnd) onChange(v)
          }}
          className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
        />
        <button
          className="btn-secondary tap-target !px-3"
          aria-label="Next day"
          disabled={viewDate >= planEnd}
          onClick={() => step(1)}
        >›</button>
        {!isToday && (
          <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => onChange(today)}>
            Today
          </button>
        )}
      </div>
      {!isToday && (
        <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2 text-[11px] text-amber-700 dark:text-amber-200">
          {viewDate < today
            ? 'Viewing a past day — log what you actually did, even late. Never invent a run you did not do.'
            : 'Viewing a future day — you can pre-read sessions, but logging is only honest on the day itself.'}
        </div>
      )}
    </>
  )
}