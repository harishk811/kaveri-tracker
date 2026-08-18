// ─────────────────────────────────────────────────────────────────────────────
// Notifications — Web Notifications API.
// Fires phone notifications that the Zepp companion app mirrors to the
// Amazfit T-Rex 3 Pro. Requires PWA install + notification permission +
// "notification mirroring" enabled in Zepp.
// ─────────────────────────────────────────────────────────────────────────────

export const notificationsSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window

export const notificationPermission = (): NotificationPermission =>
  notificationsSupported() ? Notification.permission : 'denied'

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

interface NotifyOptions {
  /** Phone notification title — keep short, watch-friendly */
  title: string
  /** Body — lead with the essential number */
  body?: string
  /** Tag — replaces previous notifications with the same tag */
  tag?: string
  /** Vibrate pattern (Android) */
  vibrate?: number | number[]
  /** Don't show if app is visible */
  silentIfVisible?: boolean
}

export const notify = (opts: NotifyOptions): void => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (opts.silentIfVisible && document.visibilityState === 'visible') return
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      badge: '/icon-192.png',
      icon: '/icon-192.png',
      ...(opts.vibrate ? { vibrate: opts.vibrate } : {}),
    } as NotificationOptions & { vibrate?: number | number[] })
    // Auto-close after 10s (some Android implementations stay otherwise)
    setTimeout(() => n.close(), 10_000)
  } catch (e) {
    console.warn('Notification failed', e)
  }
}

// Convenience presets used throughout the app
export const notifySessionReminder = (title: string, body: string): void =>
  notify({ title, body, tag: 'session-reminder', vibrate: [200, 100, 200] })

export const notifyPacingCue = (segment: string, pace: string, hr: string): void =>
  notify({
    title: `${segment} · ${pace}`,
    body: `HR ceiling ${hr} · 9:1 run-walk · hold discipline`,
    tag: 'pacing-cue',
    vibrate: [200, 100, 200, 100, 200],
  })

export const notifyGelTime = (mins: number): void =>
  notify({
    title: `Gel at ${mins} min`,
    body: 'Take a gel now. Drink at the next station regardless of thirst.',
    tag: 'gel-cue',
    vibrate: [300, 100, 300],
  })

export const notifyRunWalk9to1 = (phase: 'run' | 'walk'): void =>
  notify({
    title: phase === 'run' ? 'RUN 9 min' : 'WALK 1 min',
    body: phase === 'run' ? 'Settle back into rhythm — cadence 172–178' : 'Reset HR, take fuel if due',
    tag: '9to1-alarm',
    vibrate: phase === 'walk' ? [400, 100, 400, 100, 400] : [200],
    silentIfVisible: false,
  })

export const notifyShinRoutine = (): void =>
  notify({
    title: 'Daily shin routine · 6 min',
    body: 'Tib raises · single-leg calf · short-foot · toe yoga · ankle circles — barefoot, before the day starts.',
    tag: 'shin-daily',
  })

export const notifyInCabBreak = (): void =>
  notify({
    title: 'In-cab movement break',
    body: '20 ankle pumps · 15 toe circles · 10 seated heel raises',
    tag: 'in-cab-break',
  })

export const notifyLegsElevated = (): void =>
  notify({
    title: 'Legs elevated · 10–15 min',
    body: 'Flat on the back, legs up a wall.',
    tag: 'legs-elevated',
  })

export const notifyWeighIn = (): void =>
  notify({
    title: 'Sunday weigh-in',
    body: 'Same time, after toilet, before food. Log the four-week rolling average.',
    tag: 'weigh-in',
  })

export const notifyGreenLight = (): void =>
  notify({
    title: 'Sunday green-light checklist',
    body: '8 checks before the week ahead. Two or more unchecked → cut next week 30%.',
    tag: 'green-light',
  })
