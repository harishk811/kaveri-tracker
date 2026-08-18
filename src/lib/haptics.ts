// ─────────────────────────────────────────────────────────────────────────────
// Haptics — short vibration feedback via the Vibration API. Works on Android
// Chrome without any notification permission, so saves and toggles can buzz
// even before the user grants notification access.
// ─────────────────────────────────────────────────────────────────────────────

type Pattern = number | number[]

export const haptic = (pattern: Pattern): void => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    // ignore — vibration is a nicety
  }
}

// Small canned patterns
export const hapticTick = (): void => haptic(15) // short tick — save, toggle
export const hapticDone = (): void => haptic([15, 40, 15]) // double tick — completed
export const hapticAlert = (): void => haptic([80, 40, 80, 40, 160]) // alert — phase change