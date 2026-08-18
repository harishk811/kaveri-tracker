import { useState, useEffect } from 'react'
import type { Exercise } from '@/types'
import { ExerciseFigure, MuscleMap } from './ExerciseFigure'
import { buildYoutubeSearchUrl, isUrl } from '@/lib/youtube'
import { FormChecklistCard } from './CoachTools'

// ─────────────────────────────────────────────────────────────────────────────
// ExerciseCard — the full reference card for an exercise, showing all four
// visual layers: custom SVG figures, SVG muscle map, Commons photo (if any),
// and a curated YouTube search link + paste-your-own-URL.
// ─────────────────────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise
  /** Show the prescribed sets × reps */
  showPrescribed?: boolean
  /** Allow setting a custom video URL (saved to localStorage separately) */
  onSetCustomVideo?: (url: string) => void
  /** Initially expanded? */
  defaultExpanded?: boolean
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  showPrescribed = true,
  onSetCustomVideo,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [tab, setTab] = useState<'figure' | 'muscles' | 'photo' | 'video'>('figure')
  const [videoUrlInput, setVideoUrlInput] = useState(exercise.customVideoUrl ?? '')

  // Sync the input when a saved URL loads in (e.g. after settings load async)
  useEffect(() => {
    setVideoUrlInput(exercise.customVideoUrl ?? '')
  }, [exercise.customVideoUrl])

  const hasPhoto = Boolean(exercise.commonsImage)
  const prescribedText = exercise.prescribed
    .map((p) => `${p.sets} × ${p.reps}${p.cue ? ` (${p.cue})` : ''}`)
    .join('  ·  ')

  return (
    <div className="card">
      {/* Header — always visible */}
      <button
        className="w-full flex items-start justify-between gap-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold leading-tight">{exercise.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exercise.muscles}</div>
          {showPrescribed && (
            <div className="text-xs text-brand-700 dark:text-brand-200 mt-1 font-mono">
              {prescribedText}
            </div>
          )}
        </div>
        <span className="text-slate-400 text-sm mt-1">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-slide-up">
          {/* Summary — the understandable layer */}
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {exercise.summary}
          </p>

          {/* Visual tabs */}
          <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-800">
            <TabBtn active={tab === 'figure'} onClick={() => setTab('figure')}>Figure</TabBtn>
            <TabBtn active={tab === 'muscles'} onClick={() => setTab('muscles')}>Muscles</TabBtn>
            {hasPhoto && <TabBtn active={tab === 'photo'} onClick={() => setTab('photo')}>Photo</TabBtn>}
            <TabBtn active={tab === 'video'} onClick={() => setTab('video')}>Video</TabBtn>
          </div>

          {/* Tab content */}
          <div className="min-h-[140px]">
            {tab === 'figure' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <ExerciseFigure exercise={exercise} />
                <div className="text-[10px] text-slate-400 text-center mt-2">
                  Grey = start · Teal = finish
                </div>
              </div>
            )}

            {tab === 'muscles' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center">
                <MuscleMap exercise={exercise} className="w-32" />
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 text-center">
                  <div className="font-medium">Primary: {exercise.primary.join(', ')}</div>
                  {exercise.secondary.length > 0 && (
                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Secondary: {exercise.secondary.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'photo' && hasPhoto && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <img
                  src={exercise.commonsImage}
                  alt={exercise.name}
                  className="w-full h-auto rounded-lg bg-white"
                  loading="lazy"
                />
                {exercise.commonsAttribution && (
                  <div className="text-[10px] text-slate-400 mt-1 text-center italic">
                    {exercise.commonsAttribution}
                  </div>
                )}
              </div>
            )}

            {tab === 'video' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
                {exercise.customVideoUrl && isUrl(exercise.customVideoUrl) && (
                  <a
                    href={exercise.customVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-xs"
                  >
                    ▶ Watch your saved demo
                  </a>
                )}
                <a
                  href={buildYoutubeSearchUrl(exercise.youtubeQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full text-xs"
                >
                  🔍 Search YouTube (trusted channels)
                </a>
                {onSetCustomVideo && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Paste a video URL you trust:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="flex-1 min-w-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                      />
                      <button
                        className="btn-secondary px-2.5 py-1.5 text-xs"
                        onClick={() => onSetCustomVideo(videoUrlInput)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Why in this plan */}
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 p-3">
            <div className="text-xs font-semibold text-brand-700 dark:text-brand-100 mb-1 uppercase tracking-wide">
              Why it is in this plan
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {exercise.whyInPlan}
            </p>
          </div>

          {/* PDF cues — Setup, Execution, Breathing, Watch-for */}
          <div className="space-y-2.5">
            <Cue label="Setup" text={exercise.setup} />
            <Cue label="Execution" text={exercise.execution} />
            <Cue label="Breathing" text={exercise.breathing} />
            <Cue label="Watch for" text={exercise.watchFor} accent="amber" />
            <Cue label="In plain terms" text={exercise.plainMistake} accent="red" />
          </div>

          {/* Regression / Progression */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Easier
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{exercise.regression}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Harder
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{exercise.progression}</p>
            </div>
          </div>

          {/* Round 2: Form checklist — tick before loading */}
          <FormChecklistCard exercise={exercise} />
        </div>
      )}
    </div>
  )
}

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition ${
      active
        ? 'border-brand-600 text-brand-700 dark:text-brand-100'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
)

const Cue: React.FC<{ label: string; text: string; accent?: 'amber' | 'red' }> = ({ label, text, accent }) => {
  const accentClass = accent === 'amber'
    ? 'bg-amber-50 dark:bg-amber-900/20'
    : accent === 'red'
    ? 'bg-red-50 dark:bg-red-900/20'
    : 'bg-slate-50 dark:bg-slate-800/50'
  return (
    <div className={`rounded-lg ${accentClass} p-2.5`}>
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{text}</p>
    </div>
  )
}
