import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { TodayPage } from '@/pages/TodayPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { ExercisesPage } from '@/pages/ExercisesPage'
import { RecoveryPage } from '@/pages/RecoveryPage'
import { InsightsPage } from '@/pages/InsightsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Onboarding } from '@/components/Onboarding'
import { RunWalkIndicator } from '@/components/RunWalkIndicator'
import { useStore } from '@/store/useStore'
import { rescheduleReminders } from '@/lib/reminders'
import { primeAudio } from '@/lib/sound'

// Offline strip — shows when the network drops so "running from cache" is
// visible, not a mystery (and a blank screen offline becomes diagnosable).
const OfflineStrip: React.FC = () => {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (!offline) return null
  return (
    <div className="sticky top-0 z-40 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-[11px] px-3 py-1.5 text-center">
      Offline — running from cache. Everything stays on this phone.
    </div>
  )
}

export default function App() {
  const onboardingDone = useStore((s) => s.onboardingDone)
  const setOnboardingDone = useStore((s) => s.setOnboardingDone)
  const loadSettings = useStore((s) => s.loadSettings)
  const settings = useStore((s) => s.settings)
  const [showOnboarding, setShowOnboarding] = useState(!onboardingDone)

  useEffect(() => { void loadSettings() }, [loadSettings])

  // Keep the reminder scheduler alive: re-arm on launch and whenever any
  // setting changes (times, toggles, cab windows).
  useEffect(() => {
    if (!settings) return
    rescheduleReminders()
  }, [settings])

  // Unlock audio on the first user gesture so reminder chimes can play later
  useEffect(() => {
    const unlock = () => primeAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  // Apply dark mode — re-run when settings.darkMode changes
  useEffect(() => {
    const mode = settings?.darkMode ?? 'auto'
    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else if (mode === 'light') root.classList.remove('dark')
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark')
      else root.classList.remove('dark')
    }
    // For 'auto', also track system preference changes
    if (mode === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark')
        else root.classList.remove('dark')
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings?.darkMode])

  if (showOnboarding && !onboardingDone) {
    return <Onboarding onDone={() => { setShowOnboarding(false); setOnboardingDone(true) }} />
  }

  return (
    <HashRouter>
      <div className="app-shell pb-20">
        <OfflineStrip />
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          {/* Race content now lives in the Insights Race tab */}
          <Route path="/race" element={<Navigate to="/insights" replace />} />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      <RunWalkIndicator />
      <BottomNav />
    </HashRouter>
  )
}
