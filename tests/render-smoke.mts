// Render smoke test — runs the real app headlessly (jsdom) through the flows
// that used to crash it:
//   1. fresh install → onboarding → "Start training" → TodayPage shows Week 1
//   2. logging a run + morning check-in while mounted (store updates)
//   3. every route renders without unmounting the tree
// Exits non-zero if any render error or uncaught error is observed.
//
// Run: npm run check:smoke

import React from 'react'
import { JSDOM } from 'jsdom'

const FIXED_NOW = '2026-08-17T06:30:00' // Week 1 Monday, plan start

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
  url: 'http://localhost/#/',
  pretendToBeVisual: true,
})

const { window } = dom
const g = globalThis as unknown as Record<string, unknown>
g.window = window
g.document = window.document
g.localStorage = window.localStorage
g.location = window.location
Object.defineProperty(g, 'navigator', { value: window.navigator, configurable: true })
g.HTMLElement = window.HTMLElement
g.SVGElement = window.SVGElement
g.Node = window.Node
g.getComputedStyle = window.getComputedStyle
g.requestAnimationFrame = window.requestAnimationFrame.bind(window)
g.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
g.MutationObserver = window.MutationObserver
g.NodeList = window.NodeList
g.FileReader = window.FileReader
g.CustomEvent = window.CustomEvent
g.Event = window.Event
g.KeyboardEvent = window.KeyboardEvent
g.MouseEvent = window.MouseEvent
g.focus = () => {}

window.matchMedia = (q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}) as unknown as MediaQueryList

// Fixed clock so the plan is always in Week 1
const RealDate = Date
class FakeDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) super(FIXED_NOW)
    else super(...(args as ConstructorParameters<typeof Date>))
  }
  static now() { return new RealDate(FIXED_NOW).getTime() }
}
g.Date = FakeDate

const failures: string[] = []
const errors: Array<{ type: string; message: string }> = []
window.addEventListener('error', (e) => errors.push({ type: 'window-error', message: String(e.error?.stack ?? e.message) }))
window.addEventListener('unhandledrejection', (e) => errors.push({ type: 'unhandled-rejection', message: String((e as unknown as { reason?: Error }).reason?.stack ?? (e as unknown as { reason?: Error }).reason) }))

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

const run = async () => {
  const { useStore } = await import('../src/store/useStore.ts')
  const { default: App } = await import('../src/App.tsx')
  const { createRoot } = await import('react-dom/client')

  // Phase 1 — onboarding then "Start training"
  const root = createRoot(document.getElementById('root')!)
  root.render(React.createElement(App))
  await sleep(200)
  const onboardingShown = (document.body.textContent ?? '').includes('Two steps, one athlete')
  check('onboarding shown on fresh install', onboardingShown)

  useStore.getState().setOnboardingDone(true)
  await sleep(1200)
  const text = document.body.textContent ?? ''
  check('TodayPage renders Week 1 after start training', text.includes('Week 1'))
  check('sessions rendered', text.includes('Sessions ·'))
  check('streak strip rendered', text.includes('day streak'))
  check('recovery checks card rendered', text.includes('Recovery checks'))
  check('pain quick-log rendered', text.includes('Pain check'))
  check('mobility flow on Monday rendered', text.includes('Mobility · 10 min'))
  check('gate countdown chip on header', text.includes('10K race') && text.includes('in 33 days'))
  check('daily goals on Today', text.includes('Daily goals · 6 min'))
  check('daily goals interactive rows', text.includes('Play guided flow · 6 min') && text.includes('2 × 25'))
  // Next week at a glance lives at the bottom of the page (before the journal)
  check('next week at a glance', text.includes('Next week at a glance') && text.includes('30 km volume') && text.includes('long run 15 km'))

  // Daily goals: expand the first movement's details
  const firstMove = Array.from(document.querySelectorAll('button')).find((b) => (b.getAttribute('aria-label') ?? '').startsWith('Expand '))
  firstMove?.click()
  await sleep(200)
  check('daily goals expandable details', (document.body.textContent ?? '').includes('Watch for'))

  // In-cab toggle: flip it and the cab exercises drop open
  const cabToggle = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'In cab today')
  cabToggle?.click()
  await sleep(400)
  const cabOnText = document.body.textContent ?? ''
  check('in-cab toggle opens cab exercises', cabOnText.includes('Ankle Pumps') && cabOnText.includes('Seated Heel Raises'))

  // Quick pain log end-to-end: tap 🟢, store gets the entry, tree survives
  const quickGreen = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Log pain: No pain')
  quickGreen?.click()
  await sleep(400)
  check('pain quick-log saved', (useStore.getState().painLogs ?? []).length > 0)

  // Phase 2 — write data while mounted (this used to blow up the tree)
  await useStore.getState().putRunLog({
    sessionId: 'w1d0s1',
    date: '2026-08-17',
    actualDistanceKm: 6.2,
    actualDurationSec: 1980,
    avgPace: '5:19/km',
    avgHr: 138,
    rpe: 4,
  })
  await useStore.getState().putCheckIn({ date: '2026-08-17', rhr: 48, sleepHours: 7.6, mood: 4, soreness: 2, motivation: 4 })
  await sleep(600)
  check('tree survives logging a run + check-in', (document.body.textContent ?? '').includes('Week 1'))
  check('run saved through repo', Boolean(JSON.parse(localStorage.getItem('mt.runLogs') ?? '{}')['w1d0s1']))

  // Phase 3 — backfill: navigate to a past/future day, log there, still alive
  const nextBtn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Next day')
  const prevBtn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Previous day')
  nextBtn?.click()
  await sleep(300)
  const tueText = document.body.textContent ?? ''
  check('next-day navigation shows Tuesday', tueText.includes('Tuesday'))
  check('past-day hint shown when off today', tueText.includes('Viewing a future day'))
  // Primer warm-up lives inside the strength session card — open it and check
  const strengthCard = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent ?? '').includes('Strength A'))
  strengthCard?.click()
  await sleep(250)
  const strengthOpenText = document.body.textContent ?? ''
  check('primer inside strength session card', strengthOpenText.includes('Primer warm-up') && strengthOpenText.includes('Run guided flow'))
  check('primer has moves + done-tick', strengthOpenText.includes('Mark primer done') && strengthOpenText.includes('Warm-up ·'))
  await useStore.getState().putRunLog({
    sessionId: 'w1d1s0',
    date: '2026-08-18',
    actualDistanceKm: 5,
    actualDurationSec: 1620,
    avgPace: '5:24/km',
  })
  await sleep(400)
  check('tree survives logging on a future/past day', (document.body.textContent ?? '').includes('Tuesday'))
  prevBtn?.click()
  await sleep(300)
  check('back to today after prev', (document.body.textContent ?? '').includes('Monday'))

  // The 9:1 alarm lives on every 9:1 session card (Sunday long run), not just
  // race day — navigate to Sunday and quick-start it from the card
  const { stopRunWalkTimer: stop91 } = await import('../src/lib/runWalkTimer.ts')
  for (let i = 0; i < 6; i++) { nextBtn?.click(); await sleep(150) }
  await sleep(300)
  const longRunCard = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent ?? '').includes('Long run 13 km'))
  longRunCard?.click()
  await sleep(250)
  const longRunOpen = document.body.textContent ?? ''
  check('9:1 quick-start on long-run card', longRunOpen.includes('9:1 run-walk alarm') && longRunOpen.includes('Start 9:1'))
  const start91 = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Start 9:1')
  start91?.click()
  await sleep(200)
  check('9:1 starts from session card', useStore.getState().runWalkTimer.running)
  stop91()
  for (let i = 0; i < 6; i++) { prevBtn?.click(); await sleep(150) }
  await sleep(300)

  // Phase 4 — the 9:1 run-walk alarm is app-wide: survives navigation,
  // counts down, and shows the pill on any page
  const { startRunWalkTimer, stopRunWalkTimer } = await import('../src/lib/runWalkTimer.ts')
  startRunWalkTimer()
  await sleep(150)
  const timerState = useStore.getState().runWalkTimer
  check('9:1 timer started', timerState.running && timerState.phase === 'run')
  check('timer pill visible app-wide', (document.body.textContent ?? '').includes('cycle 1'))
  await sleep(1100)
  check('timer counts down', useStore.getState().runWalkTimer.secsLeft === 539)
  stopRunWalkTimer()
  check('timer stopped cleanly', !useStore.getState().runWalkTimer.running)

  // Reminder scheduler: arming + a test fire must be safe headless (no audio,
  // no notification APIs in jsdom)
  const { rescheduleReminders, fireReminderNow } = await import('../src/lib/reminders.ts')
  rescheduleReminders()
  fireReminderNow('shin')
  await sleep(100)
  check('reminders arm + test-fire safely', errors.length === 0)

  // Phase 5 — every route renders
  const { MemoryRouter } = await import('react-router-dom')
  const { SchedulePage } = await import('../src/pages/SchedulePage.tsx')
  const { ExercisesPage } = await import('../src/pages/ExercisesPage.tsx')
  const { RecoveryPage } = await import('../src/pages/RecoveryPage.tsx')
  const { InsightsPage } = await import('../src/pages/InsightsPage.tsx')
  const { SettingsPage } = await import('../src/pages/SettingsPage.tsx')

  const pages: Array<[string, React.ComponentType]> = [
    ['Schedule', SchedulePage],
    ['Exercises', ExercisesPage],
    ['Recovery', RecoveryPage],
    ['Insights', InsightsPage],
    ['Settings', SettingsPage],
  ]
  for (const [name, Page] of pages) {
    const holder = document.createElement('div')
    document.body.appendChild(holder)
    const r = createRoot(holder)
    r.render(React.createElement(MemoryRouter, null, React.createElement(Page)))
    await sleep(250)
    const bodyText = holder.textContent ?? ''
    if (name === 'Insights') {
      check(
        `${name}Page renders achievements + race tab`,
        bodyText.includes('Achievements') && bodyText.includes('Race'),
        `${bodyText.trim().length} chars`,
      )
      check(`${name}Page volume chart summary`, bodyText.includes('consistency') && bodyText.includes('logged so far'))
      check(`${name}Page scoreboard + heatmap`, bodyText.includes('pain-free streak') && bodyText.includes('Consistency heatmap'))
      check(`${name}Page 16 achievements`, bodyText.includes('/16 unlocked'))
      check(`${name}Page strain meter`, bodyText.includes('Strain meter (ACWR)') && bodyText.includes('No load yet'))
      check(`${name}Page cadence trend`, bodyText.includes('Cadence trend') && bodyText.includes('Log cadence'))
      const thisWeekBtn = Array.from(holder.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'This week')
      thisWeekBtn?.click()
      await sleep(250)
      const weekText = holder.textContent ?? ''
      check(`${name}Page this-week toggle`, weekText.includes('logged this week') && weekText.includes('planned this week'))
      const allWeeksBtn = Array.from(holder.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'All weeks')
      allWeeksBtn?.click()
      await sleep(150)
      // Pain tab last — it leaves the overview, where the toggle buttons live
      const painTabBtn = Array.from(holder.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Pain')
      painTabBtn?.click()
      await sleep(250)
      const painText = holder.textContent ?? ''
      check(`${name}Page pain tab`, painText.includes('pain entries') && painText.includes('Latest'))
    } else if (name === 'Exercises') {
      check(
        `${name}Page renders session groups + blocks + in-cab`,
        bodyText.includes('Strength A — Lower, Posterior & Shin') && bodyText.includes('In-cab routine') && bodyText.includes('Primer'),
        `${bodyText.trim().length} chars`,
      )
      // Substitution card is always visible with its own search box;
      // results stay hidden until the user types
      check(
        `${name}Page substitutions search visible`,
        bodyText.includes("Can't do an exercise?") && !bodyText.includes('Alternatives for your search'),
      )
      const subInput = Array.from(holder.querySelectorAll('input')).find((i) => i.getAttribute('placeholder') === 'Search an exercise or its swap…')
      if (subInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        setter?.call(subInput, 'pulldown')
        subInput.dispatchEvent(new window.Event('input', { bubbles: true }))
      }
      await sleep(250)
      const exText = holder.textContent ?? ''
      check(
        `${name}Page substitutions appear on search`,
        exText.includes('Alternatives for your search') && exText.includes('pull-ups') && exText.includes('in library'),
      )
      // Reverse map: searching the swap returns the exercise it replaces
      if (subInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        setter?.call(subInput, 'pull-ups')
        subInput.dispatchEvent(new window.Event('input', { bubbles: true }))
      }
      await sleep(250)
      check(`${name}Page reverse mapping`, (holder.textContent ?? '').includes('is an approved swap for'))
      // Saving a swap makes it visible in "Your saved swaps"
      const useThis = Array.from(holder.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Use this')
      useThis?.click()
      await sleep(250)
      check(`${name}Page saved swaps list`, (holder.textContent ?? '').includes('Your saved swaps'))
    } else if (name === 'Schedule') {
      // Before 19 Sep the five bands must stay locked (frozen clock: 17 Aug)
      check(
        `${name}Page bands locked before the 10K`,
        bodyText.includes('five bands stay locked') && !bodyText.includes('All five bands'),
        `${bodyText.trim().length} chars`,
      )
      // Week 1 is open by default → its recap lives inside the dropdown
      check(`${name}Page recap inside week dropdown`, bodyText.includes('Weekly recap · Week 1'))
      // Adaptive week is collapsed — no real estate until tapped
      check(`${name}Page adaptive week collapsed`, bodyText.includes('Adaptive week — missed-week rule') && !bodyText.includes('Get rejoin suggestion'))
      const adaptiveBtn = Array.from(holder.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Adaptive week — missed-week rule')
      adaptiveBtn?.click()
      await sleep(250)
      check(`${name}Page adaptive week expands`, (holder.textContent ?? '').includes('Get rejoin suggestion'))
    } else if (name === 'Recovery') {
      check(`${name}Page renders check-in`, bodyText.includes('Good morning') || bodyText.includes('Good afternoon'), `${bodyText.trim().length} chars`)
    } else if (name === 'Settings') {
      check(
        `${name}Page renders reminders + cab + sound + csv`,
        bodyText.includes('Reminders & alerts') && bodyText.includes('In-cab exercises') && bodyText.includes('Sound alerts') && bodyText.includes('CSV'),
        `${bodyText.trim().length} chars`,
      )
      check(`${name}Page PWA health card`, bodyText.includes('Offline & service worker'))
    } else {
      check(`${name}Page renders`, bodyText.trim().length > 50, `${bodyText.trim().length} chars`)
    }
    r.unmount()
    holder.remove()
  }

  // CSV import — round-trips the export format back into the store
  const { importCsv } = await import('../src/lib/import.ts')
  const csvSample = [
    'Kaveri Tracker export · plan start 2026-08-17',
    '',
    'RUNS',
    'date,session,distance_km,duration_sec,avg_pace,avg_hr,avg_cadence,rpe,altered,altered_reason,note',
    '2026-08-17,w1d0s1,6.2,1980,5:19/km,138,176,4,,CSV import test',
    '',
    'CHECK-INS',
    'date,rhr,sleep_hours,weight_kg,mood,soreness,motivation,note',
    '2026-08-17,48,7.6,75.2,4,2,4,',
    '',
    'JOURNAL',
    'date,text,updated_at',
    '2026-08-17,Imported journal entry,2026-08-17T07:00:00.000Z',
  ].join('\n')
  const csvResult = importCsv(csvSample)
  check('CSV import parses sections', csvResult.runs === 1 && csvResult.checkIns === 1 && csvResult.journals === 1)
  await sleep(400)
  check('CSV import writes store + cadence', (useStore.getState().runLogsBySession['w1d0s1']?.avgCadence ?? 0) === 176)

  if (errors.length > 0) {
    failures.push('no runtime errors')
    console.log('--- RUNTIME ERRORS:')
    for (const e of errors) console.log('  ', e.type, e.message.slice(0, 400))
  } else {
    check('no runtime errors', true)
  }

  console.log(failures.length === 0 ? '\nSMOKE TEST: ALL PASS' : `\nSMOKE TEST: ${failures.length} FAILURE(S)`)
  process.exit(failures.length === 0 ? 0 : 1)
}

run().catch((e) => {
  console.error('HARNESS FAILURE:', e?.stack ?? e)
  process.exit(1)
})