// ─────────────────────────────────────────────────────────────────────────────
// Wake Lock API — keeps the screen on during active timers and the 9:1 alarm
// so the phone does not sleep mid-session on Android.
// ─────────────────────────────────────────────────────────────────────────────

let wakeLock: WakeLockSentinel | null = null
let visibilityListenerAdded = false

export const wakeLockSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator

const handleVisibility = async (): Promise<void> => {
  if (document.visibilityState === 'visible' && !wakeLock) {
    await requestWakeLock()
  }
}

export const requestWakeLock = async (): Promise<void> => {
  if (!wakeLockSupported()) return
  // If we already hold a lock, release it first to avoid leaking sentinels
  if (wakeLock) {
    try { await wakeLock.release() } catch { /* ignore */ }
    wakeLock = null
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    // Only add the visibility listener once (avoids listener accumulation)
    if (!visibilityListenerAdded) {
      document.addEventListener('visibilitychange', handleVisibility)
      visibilityListenerAdded = true
    }
  } catch (e) {
    // Not fatal — timers still work, just may sleep
    console.warn('Wake lock request failed', e)
  }
}

export const releaseWakeLock = async (): Promise<void> => {
  if (!wakeLock) return
  try {
    await wakeLock.release()
    wakeLock = null
    if (visibilityListenerAdded) {
      document.removeEventListener('visibilitychange', handleVisibility)
      visibilityListenerAdded = false
    }
  } catch (e) {
    console.warn('Wake lock release failed', e)
  }
}
