// ─────────────────────────────────────────────────────────────────────────────
// YouTube helper — builds a scoped search URL to trusted coaching channels.
// We never hardcode specific video IDs (we have not verified them).
// The user can also paste their own trusted URL per exercise in Settings.
// ─────────────────────────────────────────────────────────────────────────────

export const buildYoutubeSearchUrl = (query: string): string => {
  const q = encodeURIComponent(query)
  return `https://www.youtube.com/results?search_query=${q}`
}

export const isYoutubeUrl = (url: string): boolean =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url)

export const isUrl = (s: string): boolean => {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
