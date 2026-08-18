import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding — four-screen first-run intro in plain English.
// Teaches the plan, the gate, the shin protocol, and how to use the app.
// ─────────────────────────────────────────────────────────────────────────────

interface OnboardingProps {
  onDone: () => void
}

const SCREENS = [
  {
    icon: '🏃',
    title: 'Two steps, one athlete',
    body: 'Step 1 runs 14 weeks from today to the Kaveri Trail Marathon on 22 November 2026. Step 2 runs from December into Ironman 70.3 Goa 2027. Throughout: weights three days a week without interruption, plyometrics kept, and a shin protocol that makes the running volume safe.',
    cta: 'Next',
  },
  {
    icon: '⏱️',
    title: 'The decision gate — 27 September',
    body: 'The Wipro Bengaluru Half on 27 September is the gate. Run it honestly at half-effort, read the clock at the finish, and take the marathon band it gives you. Sub-2:10 and 4:30 is live. That is the deal — a refusal to set a pace in August that the body has not yet agreed to in September.',
    cta: 'Next',
  },
  {
    icon: '🦵',
    title: 'The shin insurance policy',
    body: 'Going from ~20 to 50 km/week is where injuries are manufactured. Your defences: cadence at 172–178 everywhere (the single most powerful intervention), a daily 6-minute lower-leg routine, four impact runs (not five) from Week 8, and four deload weeks. The Sunday long run is the one session that is non-negotiable.',
    cta: 'Next',
  },
  {
    icon: '📋',
    title: 'How to use this app',
    body: 'Today shows your sessions — tap to log prescribed vs actual. Schedule shows the 14-week timeline. Library has every exercise with figures, muscle maps, and video links. Race has the pacing band, the 9:1 alarm, and watch-mirrored cues for your Amazfit. Settings sets your session times and backs up your data.',
    cta: 'Start training',
  },
]

export const Onboarding: React.FC<OnboardingProps> = ({ onDone }) => {
  const [i, setI] = useState(0)
  const screen = SCREENS[i]
  const isLast = i === SCREENS.length - 1

  return (
    <div className="app-shell flex flex-col items-center justify-center p-6 pt-safe-top pb-safe-bottom min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-app flex flex-col items-center text-center">
        <div className="text-6xl mb-6 animate-fade-in" key={i}>{screen.icon}</div>
        <h1 className="text-xl font-bold mb-3">{screen.title}</h1>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-8">{screen.body}</p>

        {/* Dots */}
        <div className="flex gap-1.5 mb-6">
          {SCREENS.map((_, j) => (
            <span key={j} className={`w-1.5 h-1.5 rounded-full transition ${
              j === i ? 'bg-brand-600 w-4' : 'bg-slate-300 dark:bg-slate-700'
            }`} />
          ))}
        </div>

        <div className="flex gap-2 w-full">
          {i > 0 && (
            <button className="btn-secondary flex-1" onClick={() => setI(i - 1)}>Back</button>
          )}
          <button
            className="btn-primary flex-1"
            onClick={() => isLast ? onDone() : setI(i + 1)}
          >
            {screen.cta}
          </button>
        </div>

        {i === 0 && (
          <button className="text-xs text-slate-500 dark:text-slate-400 mt-4" onClick={onDone}>
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
