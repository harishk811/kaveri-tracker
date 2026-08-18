import { Component, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary — last line of defence. Any uncaught render/effect error
// shows a recovery screen with the error message + reload instead of a blank
// page. Also reports the error to the console for debugging.
// ─────────────────────────────────────────────────────────────────────────────

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    console.error('Kaveri Tracker crashed:', error, info?.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="app-shell flex items-center justify-center p-6 min-h-screen">
          <div className="card w-full text-center space-y-3">
            <div className="text-4xl">😖</div>
            <div className="text-lg font-semibold">Something went wrong</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
              {this.state.error.message}
            </p>
            <p className="text-[10px] text-slate-400">
              Your data is safe — it lives on this device and nothing was deleted.
            </p>
            <button className="btn-primary w-full" onClick={() => window.location.reload()}>
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}