import { ZONES } from '@/data/plan'
import type { ZoneKey } from '@/types'
import { Term } from './Term'

// ─────────────────────────────────────────────────────────────────────────────
// ZoneBadge — coloured zone indicator with the plain-language name and
// technical term beneath. Tap the name for the full glossary entry.
// Colour is consistent everywhere — once you learn the code, you read the
// week at a glance.
// ─────────────────────────────────────────────────────────────────────────────

interface ZoneBadgeProps {
  zone: ZoneKey
  /** Show only the coloured dot + name, no pace/HR */
  compact?: boolean
}

const colourClasses: Record<string, string> = {
  'zone-recovery': 'bg-blue-500',
  'zone-easy': 'bg-green-500',
  'zone-steady': 'bg-yellow-500',
  'zone-threshold': 'bg-orange-500',
  'zone-race': 'bg-red-500',
  'zone-deload': 'bg-purple-500',
  'zone-rest': 'bg-slate-500',
}

export const ZoneBadge: React.FC<ZoneBadgeProps> = ({ zone, compact = false }) => {
  const z = ZONES[zone]
  if (!z) return null

  return (
    <div className="inline-flex items-center gap-2 align-middle">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${colourClasses[z.colour] ?? 'bg-slate-400'}`} />
      <div className="leading-tight">
        <div className="text-sm font-medium">
          <Term term={z.name.split(' / ')[0]}>{z.name}</Term>
        </div>
        {!compact && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{z.technical}</div>
        )}
      </div>
    </div>
  )
}

// Smaller still — just the dot + pace, for inline use in session cards
export const ZonePaceChip: React.FC<{ zone: ZoneKey; pace?: string }> = ({ zone, pace }) => {
  const z = ZONES[zone]
  if (!z) return null
  return (
    <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
      <span className={`inline-block w-2 h-2 rounded-full ${colourClasses[z.colour] ?? 'bg-slate-400'}`} />
      {pace ?? z.paceRange}
    </span>
  )
}
