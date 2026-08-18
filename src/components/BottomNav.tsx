import { NavLink } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// BottomNav — thumb-reachable primary navigation. Six tabs, fixed to bottom.
// Mobile-first; on desktop the app shell is centred at max-w-app.
// ─────────────────────────────────────────────────────────────────────────────

const tabs: { to: string; label: string; icon: React.FC<{ className?: string; filled?: boolean }>; end?: boolean }[] = [
  { to: '/', label: 'Today', icon: TodayIcon, end: true },
  { to: '/schedule', label: 'Plan', icon: CalendarIcon },
  { to: '/exercises', label: 'Library', icon: DumbbellIcon },
  { to: '/recovery', label: 'Recovery', icon: HeartIcon },
  { to: '/insights', label: 'Insights', icon: ChartIcon },
  { to: '/settings', label: 'Settings', icon: GearIcon },
]

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 z-40 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-none">
      <div className="grid grid-cols-6">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 min-h-tap transition ${
                  isActive
                    ? 'text-brand-700 dark:text-brand-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-11 items-center justify-center rounded-full transition ${isActive ? 'bg-brand-600/10 dark:bg-brand-500/20' : ''}`}>
                    <Icon className="w-5 h-5" filled={isActive} />
                  </span>
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{t.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

// ── Icons (inline SVG so no extra deps) ──────────────────────────────────────

function TodayIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function CalendarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function DumbbellIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M2 8v8M18 4v16M22 8v8M6 12h12" />
    </svg>
  )
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7.5-4.7-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1.2 4.5 3 .9-1.8 2.5-3 4.5-3C19.5 5 21.5 8.5 20 12c-2 4.3-8 9-8 9z" />
    </svg>
  )
}

function ChartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 6-6" />
    </svg>
  )
}

function GearIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
