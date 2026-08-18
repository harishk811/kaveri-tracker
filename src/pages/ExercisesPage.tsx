import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EXERCISES, CATEGORY_LABELS, LIBRARY_GROUPS } from '@/data/exercises'
import { ExerciseCard } from '@/components/ExerciseCard'
import { GuidedFlows } from '@/components/GuidedFlows'
import { SubstitutionLibrary } from '@/components/CoachTools'
import { useStore } from '@/store/useStore'
import type { ExerciseCategory } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────────────
// ExercisesPage — searchable library of every exercise, grouped the way the
// document groups them: one section per strength session (A · Tuesday, B ·
// Thursday, C · Saturday) with its blocks inside, plus the daily shin
// routine, mobility, in-cab routine and warm-up. Filter chips are the seven
// sessions — no repeated "Strength X" fragments.
// Round 2 adds guided mobility & primer flows at the top. The `?flow=` query
// param deep-links a flow from anywhere (SessionCard primer → "Run guided flow").
// ─────────────────────────────────────────────────────────────────────────────────────

type FlowId = 'mobility' | 'primerA' | 'primerB' | 'dailyShin'

export const ExercisesPage: React.FC = () => {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string>('all')
  const [openCat, setOpenCat] = useState<ExerciseCategory | null>(null)
  const [flow, setFlow] = useState<FlowId | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const putExerciseSettings = useStore((s) => s.putExerciseSettings)
  const exerciseSettings = useStore((s) => s.exerciseSettings)
  const loadExerciseSettingsAll = useStore((s) => s.loadExerciseSettingsAll)

  // Deep-link: `?flow=primerA` etc. opens the guided flow on mount.
  useEffect(() => {
    const f = searchParams.get('flow')
    if (f === 'mobility' || f === 'primerA' || f === 'primerB' || f === 'dailyShin') setFlow(f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFlow = (f: FlowId) => {
    const next = flow === f ? null : f
    setFlow(next)
    setSearchParams(next ? { flow: next } : {}, { replace: true })
  }

  // Load saved custom video URLs / notes so previously-set demo URLs display.
  useEffect(() => { void loadExerciseSettingsAll() }, [loadExerciseSettingsAll])

  const groupCats = useMemo(() => {
    const g = LIBRARY_GROUPS.find((x) => x.id === group)
    return g ? g.categories : []
  }, [group])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EXERCISES.filter((e) => {
      if (group !== 'all' && !groupCats.includes(e.category)) return false
      if (!q) return true
      return (
        e.name.toLowerCase().includes(q) ||
        e.muscles.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.primary.some((m) => m.toLowerCase().includes(q))
      )
    })
  }, [query, group, groupCats])

  const grouped = useMemo(() => {
    const map = new Map<ExerciseCategory, typeof EXERCISES>()
    for (const e of filtered) {
      if (!map.has(e.category)) map.set(e.category, [])
      map.get(e.category)!.push(e)
    }
    return map
  }, [filtered])

  // Merge saved custom video URLs / notes into a stable list — memoized so
  // cards don't get fresh object identities on every keystroke (which would
  // reset FormChecklist ticks).
  const mergedByCategory = useMemo(() => {
    const map = new Map<ExerciseCategory, typeof EXERCISES>()
    for (const [cat, list] of grouped) {
      map.set(cat, list.map((ex) => {
        const saved = exerciseSettings[ex.id]
        return saved ? { ...ex, customVideoUrl: saved.customVideoUrl ?? ex.customVideoUrl } : ex
      }))
    }
    return map
  }, [grouped, exerciseSettings])

  return (
    <div className="p-4 pt-safe-top space-y-4">
      {/* Header + search */}
      <div className="card">
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Exercise library</div>
        <div className="text-xl font-bold mt-0.5">All 30+ movements</div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, muscle, or benefit..."
          className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        />
        {/* Session filter chips — one chip per library section */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <FilterChip active={group === 'all'} onClick={() => setGroup('all')}>All</FilterChip>
          {LIBRARY_GROUPS.map((g) => (
            <FilterChip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
              {g.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Round 2: Guided flows */}
      <div className="card p-2">
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Guided flows</div>
        <div className="grid grid-cols-2 gap-1.5">
          <FlowBtn active={flow === 'mobility'} onClick={() => toggleFlow('mobility')}>Mobility · 10 min</FlowBtn>
          <FlowBtn active={flow === 'primerA'} onClick={() => toggleFlow('primerA')}>Primer A · 6 min</FlowBtn>
          <FlowBtn active={flow === 'primerB'} onClick={() => toggleFlow('primerB')}>Primer B · 4 min</FlowBtn>
          <FlowBtn active={flow === 'dailyShin'} onClick={() => toggleFlow('dailyShin')}>Daily shin · 6 min</FlowBtn>
        </div>
      </div>
      {flow && <GuidedFlows flow={flow} />}

      {/* Grouped results — session sections, each block a collapsible section
          (Primer / Main lifts / Shin insurance …) so the day's structure is
          obvious at a glance */}
      {filtered.length === 0 ? (
        <div className="card text-center py-6">
          <div className="text-3xl mb-2">🔍</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">No exercises match "{query}"</div>
        </div>
      ) : (
        LIBRARY_GROUPS.map((g) => {
          const lists = g.categories
            .map((cat) => [cat, mergedByCategory.get(cat) ?? []] as const)
            .filter(([, list]) => list.length > 0)
          if (lists.length === 0) return null
          const singleBlock = lists.length === 1
          return (
            <div key={g.id} className="space-y-2">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200 px-1 pt-1">
                {g.title}
              </div>
              {lists.map(([cat, list], i) => (
                <div key={cat} className="card p-0 overflow-hidden">
                  <button
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left ${singleBlock ? '' : 'active:bg-slate-50 dark:active:bg-slate-800'}`}
                    onClick={() => setOpenCat(openCat === cat ? null : cat)}
                  >
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      {singleBlock ? '' : `${i + 1} · `}{CATEGORY_LABELS[cat]}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{list.length}</span>
                      {!singleBlock && (
                        <span className={`text-slate-400 text-xs transition-transform ${openCat === cat ? 'rotate-180' : ''}`}>▾</span>
                      )}
                    </span>
                  </button>
                  {openCat === cat && (
                    <div className="px-3 pb-3 space-y-2 animate-slide-up">
                      {list.map((ex) => (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          onSetCustomVideo={(url) => void putExerciseSettings(ex.id, { customVideoUrl: url })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })
      )}

      {/* Substitution library — its own always-visible search box; results
          appear only after typing, and map both ways (exercise ↔ swap) */}
      <SubstitutionLibrary />
    </div>
  )
}

const FilterChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`chip whitespace-nowrap ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
  >
    {children}
  </button>
)

const FlowBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-lg py-2 text-xs font-medium transition ${
      active ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
)
