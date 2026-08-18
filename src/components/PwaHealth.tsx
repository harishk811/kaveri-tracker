import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// PwaHealthCard — offline diagnosis & self-heal.
// A blank screen when offline almost always means the service worker isn't
// registered/controlling (bad cert, IP change, cleared storage). This card
// shows the live state and offers one-tap re-registration, so the phone can
// tell you exactly which leg is broken instead of showing a white page.
// ─────────────────────────────────────────────────────────────────────────────

interface Health {
  swSupported: boolean
  registered: boolean
  controlling: boolean
  cacheCount: number
  online: boolean
}

export const PwaHealthCard: React.FC = () => {
  const [h, setH] = useState<Health | null>(null)

  const refresh = async () => {
    try {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : false
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        setH({ swSupported: false, registered: false, controlling: false, cacheCount: 0, online })
        return
      }
      const reg = await navigator.serviceWorker.getRegistration()
      const names = typeof caches !== 'undefined' ? await caches.keys() : []
      setH({
        swSupported: true,
        registered: Boolean(reg),
        controlling: Boolean(navigator.serviceWorker.controller),
        cacheCount: names.length,
        online,
      })
    } catch {
      setH(null)
    }
  }

  const hRef = useRef<Health | null>(null)
  hRef.current = h

  useEffect(() => {
    void refresh()
    const t = setInterval(() => {
      const cur = hRef.current
      if (cur && cur.controlling && cur.cacheCount > 0) clearInterval(t)
      else void refresh()
    }, 2000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reRegister = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      await reg?.unregister()
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    } catch { /* reload below still applies */ }
    window.location.reload()
  }

  if (!h) return null

  const Row: React.FC<{ label: string; ok: boolean; hint?: string }> = ({ label, ok, hint }) => (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`text-xs font-medium flex-shrink-0 ${ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {ok ? '✓ OK' : hint ?? '✗ missing'}
      </span>
    </div>
  )

  return (
    <div className="card bg-slate-50 dark:bg-slate-800/50">
      <div className="text-sm font-semibold mb-1">Offline & service worker</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
        Offline use needs the service worker registered and in charge. If the app goes blank without a network, check these.
      </div>
      {!h.swSupported ? (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Service workers are not available in this browser — offline install needs Chrome / Edge / Samsung Internet over HTTPS.
        </div>
      ) : (
        <div className="space-y-1.5">
          <Row label="Service worker registered" ok={h.registered} hint="Install failed — see INSTALL.md (cert/IP)" />
          <Row label="Controlling this page" ok={h.controlling} hint="reload once after installing" />
          <Row label="Offline cache ready" ok={h.cacheCount > 0} hint={`${h.cacheCount} caches found`} />
          <Row label="Connected right now" ok={h.online} />
          <div className="text-[10px] text-slate-400 pt-1 leading-relaxed">
            {h.controlling && h.cacheCount > 0
              ? 'Ready: airplane mode should still open the app.'
              : 'Not ready: after fixing the certificate (re-run mkcert with the current IP), open the https:// address once, then tap "Re-register service worker".'}
          </div>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button className="btn-secondary flex-1 text-xs" onClick={() => void reRegister()}>
          Re-register service worker
        </button>
        <button className="btn-secondary flex-1 text-xs" onClick={() => window.location.reload()}>
          Reload app
        </button>
      </div>
    </div>
  )
}