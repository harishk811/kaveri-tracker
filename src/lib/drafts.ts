// ─────────────────────────────────────────────────────────────────────────────
// Drafts — auto-saved form state. Android browsers kill background tabs
// aggressively; any unsaved typing then vanishes. Every logger drafts its
// fields to localStorage (debounced), restores them if no log was saved, and
// flushes immediately when the page is being hidden.
// ─────────────────────────────────────────────────────────────────────────────

const PREFIX = 'mt.draft.'

export const saveDraft = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage full / private mode — non-fatal
  }
}

export const loadDraft = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export const clearDraft = (key: string): void => {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

let flushHandlers: Array<() => void> = []

// Register a flush callback that runs the moment the page is hidden or closed
// (app switch, tab kill, browser refresh) so unsaved input survives.
export const registerDraftFlush = (handler: () => void): (() => void) => {
  flushHandlers.push(handler)
  return () => {
    flushHandlers = flushHandlers.filter((h) => h !== handler)
  }
}

if (typeof window !== 'undefined') {
  const flush = () => {
    for (const h of flushHandlers) h()
  }
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}