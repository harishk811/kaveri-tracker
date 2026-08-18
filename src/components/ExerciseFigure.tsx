import type { Exercise } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// ExerciseFigure — custom SVG figures for every exercise.
// Grey = start position, teal = finish position (matches the PDF's aesthetic).
// These are lightweight schematic stick figures, not anatomical art — the point
// is to convey the movement shape and the start/finish convention at a glance.
// ─────────────────────────────────────────────────────────────────────────────

interface FigureProps {
  exercise: Exercise
  className?: string
}

// Reusable body parts drawn as rounded lines + small circles for joints
const HEAD_R = 7
const LIMB_W = 4

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: LIMB_W,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
})

// Each figure is a function returning JSX for start + finish positions.
// Co-ordinates are in a 80×120 viewport; we position two side-by-side.

interface FigDef {
  start: React.ReactNode
  finish: React.ReactNode
  caption?: { start?: string; finish?: string }
}

// Helper to draw a stick figure given joint positions
interface Joints {
  head: [number, number]
  neck: [number, number]
  chest: [number, number]
  hip: [number, number]
  lShoulder?: [number, number]
  lElbow?: [number, number]
  lHand?: [number, number]
  rShoulder?: [number, number]
  rElbow?: [number, number]
  rHand?: [number, number]
  lKnee?: [number, number]
  lFoot?: [number, number]
  rKnee?: [number, number]
  rFoot?: [number, number]
  // Optional extras (e.g., bench, weight, wall)
  extras?: React.ReactNode
}

const Stick = ({ j, color }: { j: Joints; color: string }) => {
  const s = stroke(color)
  return (
    <g>
      {/* head */}
      <circle cx={j.head[0]} cy={j.head[1]} r={HEAD_R} {...s} />
      {/* spine */}
      <line x1={j.neck[0]} y1={j.neck[1]} x2={j.hip[0]} y2={j.hip[1]} {...s} />
      {/* shoulders line */}
      {j.lShoulder && j.rShoulder && (
        <line x1={j.lShoulder[0]} y1={j.lShoulder[1]} x2={j.rShoulder[0]} y2={j.rShoulder[1]} {...s} />
      )}
      {/* arms */}
      {j.lShoulder && j.lElbow && (
        <line x1={j.lShoulder[0]} y1={j.lShoulder[1]} x2={j.lElbow[0]} y2={j.lElbow[1]} {...s} />
      )}
      {j.lElbow && j.lHand && (
        <line x1={j.lElbow[0]} y1={j.lElbow[1]} x2={j.lHand[0]} y2={j.lHand[1]} {...s} />
      )}
      {j.rShoulder && j.rElbow && (
        <line x1={j.rShoulder[0]} y1={j.rShoulder[1]} x2={j.rElbow[0]} y2={j.rElbow[1]} {...s} />
      )}
      {j.rElbow && j.rHand && (
        <line x1={j.rElbow[0]} y1={j.rElbow[1]} x2={j.rHand[0]} y2={j.rHand[1]} {...s} />
      )}
      {/* legs */}
      {j.hip && j.lKnee && (
        <line x1={j.hip[0]} y1={j.hip[1]} x2={j.lKnee[0]} y2={j.lKnee[1]} {...s} />
      )}
      {j.lKnee && j.lFoot && (
        <line x1={j.lKnee[0]} y1={j.lKnee[1]} x2={j.lFoot[0]} y2={j.lFoot[1]} {...s} />
      )}
      {j.hip && j.rKnee && (
        <line x1={j.hip[0]} y1={j.hip[1]} x2={j.rKnee[0]} y2={j.rKnee[1]} {...s} />
      )}
      {j.rKnee && j.rFoot && (
        <line x1={j.rKnee[0]} y1={j.rKnee[1]} x2={j.rFoot[0]} y2={j.rFoot[1]} {...s} />
      )}
      {/* joint dots */}
      {[j.lShoulder, j.rShoulder, j.lElbow, j.rElbow, j.lHand, j.rHand, j.lKnee, j.rKnee, j.lFoot, j.rFoot, j.hip].filter(Boolean).map((p, i) => (
        <circle key={i} cx={(p as [number, number])[0]} cy={(p as [number, number])[1]} r={2.5} fill={color} />
      ))}
      {j.extras}
    </g>
  )
}

// ── Figure definitions per exercise category/pattern ─────────────────────────
const FIGS: Partial<Record<string, FigDef>> = {
  // Squat pattern (goblet, back squat, split squat, lunge)
  squat: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 35], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 32], lHand: [34, 42],
      rShoulder: [47, 22], rElbow: [50, 32], rHand: [46, 42],
      lKnee: [33, 75], lFoot: [33, 95],
      rKnee: [47, 75], rFoot: [47, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 22], neck: [40, 29], chest: [40, 42], hip: [40, 58],
      lShoulder: [33, 32], lElbow: [31, 42], lHand: [36, 50],
      rShoulder: [47, 32], rElbow: [49, 42], rHand: [44, 50],
      lKnee: [30, 78], lFoot: [33, 98],
      rKnee: [50, 78], rFoot: [47, 98],
    }} color="#14b8a6" />,
    caption: { start: 'Standing tall', finish: 'Hips back, thighs ~parallel' },
  },
  // Hinge pattern (RDL, deadlift)
  hinge: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [32, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [48, 35], rHand: [47, 48],
      lKnee: [38, 72], lFoot: [38, 95],
      rKnee: [42, 72], rFoot: [42, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 22], neck: [40, 29], chest: [45, 38], hip: [50, 52],
      lShoulder: [38, 30], lElbow: [42, 42], lHand: [46, 56],
      rShoulder: [52, 30], rElbow: [56, 42], rHand: [60, 56],
      lKnee: [42, 74], lFoot: [40, 96],
      rKnee: [46, 74], rFoot: [44, 96],
    }} color="#14b8a6" />,
    caption: { start: 'Standing, soft knees', finish: 'Hips back, back flat, stretch in hamstrings' },
  },
  // Single-leg calf raise
  calfRaise: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [28, 48],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [52, 48],
      lKnee: [40, 70], lFoot: [40, 92],
      rKnee: [50, 70], rFoot: [52, 90],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 8], neck: [40, 15], chest: [40, 28], hip: [40, 46],
      lShoulder: [33, 18], lElbow: [30, 31], lHand: [28, 44],
      rShoulder: [47, 18], rElbow: [50, 31], rHand: [52, 44],
      lKnee: [40, 66], lFoot: [40, 88],
      rKnee: [50, 66], rFoot: [52, 86],
      extras: <line x1="35" y1="92" x2="45" y2="92" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'On one leg', finish: 'Rise fully, pause, 3 s lower' },
  },
  // Seated calf raise (soleus)
  seatedCalf: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [33, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [47, 35], rHand: [47, 48],
      lKnee: [40, 75], lFoot: [38, 92],
      rKnee: [42, 75], rFoot: [44, 92],
      extras: <line x1="20" y1="55" x2="60" y2="55" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [33, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [47, 35], rHand: [47, 48],
      lKnee: [40, 75], lFoot: [36, 88],
      rKnee: [42, 75], rFoot: [46, 88],
      extras: <line x1="20" y1="55" x2="60" y2="55" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Seated, knees bent 90°', finish: 'Rise onto toes, 3 s lower' },
  },
  // Tibialis raise (against wall)
  tibialis: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [28, 48],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [52, 48],
      lKnee: [40, 70], lFoot: [40, 92],
      rKnee: [42, 70], rFoot: [44, 92],
      extras: <line x1="48" y1="0" x2="48" y2="100" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [28, 48],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [52, 48],
      lKnee: [40, 70], lFoot: [40, 92],
      rKnee: [42, 70], rFoot: [44, 92],
      extras: <>
        <line x1="48" y1="0" x2="48" y2="100" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        <line x1="38" y1="90" x2="46" y2="86" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
      </>,
    }} color="#14b8a6" />,
    caption: { start: 'Back to wall, feet flat', finish: 'Lift toes high, lower slow' },
  },
  // Dead bug
  deadBug: {
    start: <Stick j={{
      head: [22, 30], neck: [30, 30], chest: [40, 30], hip: [55, 30],
      lShoulder: [35, 28], lElbow: [25, 20], lHand: [18, 14],
      rShoulder: [45, 28], rElbow: [55, 22], rHand: [62, 18],
      lKnee: [62, 22], lFoot: [68, 16],
      rKnee: [68, 22], rFoot: [76, 18],
      extras: <line x1="10" y1="38" x2="78" y2="38" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [22, 30], neck: [30, 30], chest: [40, 30], hip: [55, 30],
      lShoulder: [35, 28], lElbow: [25, 20], lHand: [14, 10],
      rShoulder: [45, 28], rElbow: [55, 28], rHand: [70, 30],
      lKnee: [62, 22], lFoot: [68, 16],
      rKnee: [70, 32], rFoot: [80, 38],
      extras: <line x1="10" y1="38" x2="78" y2="38" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Back flat, knees 90°', finish: 'Opposite arm + leg extend' },
  },
  // Plank / hollow ( prone or supine holds)
  plank: {
    start: <Stick j={{
      head: [16, 40], neck: [24, 40], chest: [38, 40], hip: [56, 40],
      lShoulder: [30, 36], lElbow: [30, 50], lHand: [30, 58],
      rShoulder: [42, 36], rElbow: [42, 50], rHand: [42, 58],
      lKnee: [70, 40], lFoot: [82, 40],
      rKnee: [72, 42], rFoot: [84, 42],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [16, 30], neck: [24, 30], chest: [38, 30], hip: [56, 30],
      lShoulder: [30, 26], lElbow: [30, 42], lHand: [30, 56],
      rShoulder: [42, 26], rElbow: [42, 42], rHand: [42, 56],
      lKnee: [70, 30], lFoot: [82, 30],
      rKnee: [72, 32], rFoot: [84, 32],
      extras: <line x1="10" y1="60" x2="80" y2="60" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Set up', finish: 'Straight line, hold' },
  },
  // Side plank
  sidePlank: {
    start: <Stick j={{
      head: [20, 50], neck: [26, 50], chest: [38, 50], hip: [54, 50],
      lShoulder: [32, 46], lElbow: [22, 60], lHand: [22, 70],
      rShoulder: [44, 46], rElbow: [54, 46], rHand: [62, 46],
      lKnee: [66, 50], lFoot: [80, 50],
      rKnee: [70, 52], rFoot: [84, 52],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [22, 20], neck: [28, 25], chest: [38, 30], hip: [52, 36],
      lShoulder: [32, 32], lElbow: [22, 48], lHand: [22, 60],
      rShoulder: [44, 28], rElbow: [54, 26], rHand: [64, 26],
      lKnee: [62, 42], lFoot: [76, 48],
      rKnee: [66, 40], rFoot: [80, 46],
    }} color="#14b8a6" />,
    caption: { start: 'Side-lying, forearm down', finish: 'Hips lifted, straight line' },
  },
  // Lat pulldown
  pulldown: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [25, 12], lHand: [20, 6],
      rShoulder: [47, 22], rElbow: [55, 12], rHand: [60, 6],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [25, 30], lHand: [28, 38],
      rShoulder: [47, 22], rElbow: [55, 30], rHand: [52, 38],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#14b8a6" />,
    caption: { start: 'Arms extended up', finish: 'Pull bar to upper chest' },
  },
  // Overhead press
  press: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 30], lHand: [32, 38],
      rShoulder: [47, 22], rElbow: [50, 30], rHand: [48, 38],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 12], lHand: [32, 4],
      rShoulder: [47, 22], rElbow: [50, 12], rHand: [48, 4],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#14b8a6" />,
    caption: { start: 'DBs at shoulders', finish: 'Press straight overhead' },
  },
  // Incline press
  inclinePress: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [28, 30], lHand: [30, 36],
      rShoulder: [47, 22], rElbow: [52, 30], rHand: [50, 36],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
      extras: <line x1="15" y1="55" x2="65" y2="55" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.5" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 18], lHand: [34, 14],
      rShoulder: [47, 22], rElbow: [50, 18], rHand: [46, 14],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
      extras: <line x1="15" y1="55" x2="65" y2="55" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.5" />,
    }} color="#14b8a6" />,
    caption: { start: 'On incline, DBs at chest', finish: 'Press up and slightly in' },
  },
  // Row
  row: {
    start: <Stick j={{
      head: [40, 18], neck: [40, 25], chest: [40, 38], hip: [40, 58],
      lShoulder: [33, 28], lElbow: [25, 38], lHand: [22, 48],
      rShoulder: [47, 28], rElbow: [55, 38], rHand: [58, 48],
      lKnee: [40, 78], lFoot: [40, 95],
      rKnee: [42, 78], rFoot: [42, 95],
      extras: <line x1="20" y1="58" x2="60" y2="58" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.5" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 18], neck: [40, 25], chest: [40, 38], hip: [40, 58],
      lShoulder: [33, 28], lElbow: [25, 26], lHand: [32, 32],
      rShoulder: [47, 28], rElbow: [55, 26], rHand: [48, 32],
      lKnee: [40, 78], lFoot: [40, 95],
      rKnee: [42, 78], rFoot: [42, 95],
      extras: <line x1="20" y1="58" x2="60" y2="58" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.5" />,
    }} color="#14b8a6" />,
    caption: { start: 'Chest supported, arms long', finish: 'Pull elbows back, squeeze' },
  },
  // Banded lateral walk
  lateralWalk: {
    start: <Stick j={{
      head: [40, 20], neck: [40, 27], chest: [40, 38], hip: [40, 52],
      lShoulder: [33, 30], lElbow: [30, 42], lHand: [28, 52],
      rShoulder: [47, 30], rElbow: [50, 42], rHand: [52, 52],
      lKnee: [34, 68], lFoot: [30, 88],
      rKnee: [46, 68], rFoot: [50, 88],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [50, 20], neck: [50, 27], chest: [50, 38], hip: [50, 52],
      lShoulder: [43, 30], lElbow: [40, 42], lHand: [38, 52],
      rShoulder: [57, 30], rElbow: [60, 42], rHand: [62, 52],
      lKnee: [44, 68], lFoot: [40, 88],
      rKnee: [56, 68], rFoot: [60, 88],
    }} color="#14b8a6" />,
    caption: { start: 'Quarter-squat, band on', finish: 'Step sideways against band' },
  },
  // Couch stretch
  couchStretch: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [30, 48],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [50, 48],
      lKnee: [50, 70], lFoot: [50, 92],
      rKnee: [38, 78], rFoot: [38, 80],
      extras: <>
        <line x1="35" y1="0" x2="35" y2="85" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="78" x2="40" y2="80" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
      </>,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [44, 50],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [30, 48],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [50, 48],
      lKnee: [54, 70], lFoot: [54, 92],
      rKnee: [38, 78], rFoot: [38, 80],
      extras: <>
        <line x1="35" y1="0" x2="35" y2="85" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="78" x2="40" y2="80" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
      </>,
    }} color="#14b8a6" />,
    caption: { start: 'Rear shin against wall', finish: 'Squeeze glute, shift hips forward' },
  },
  // Pogo hop
  pogo: {
    start: <Stick j={{
      head: [40, 18], neck: [40, 25], chest: [40, 38], hip: [40, 52],
      lShoulder: [33, 30], lElbow: [33, 42], lHand: [33, 52],
      rShoulder: [47, 30], rElbow: [47, 42], rHand: [47, 52],
      lKnee: [40, 68], lFoot: [40, 88],
      rKnee: [42, 68], rFoot: [42, 88],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 10], neck: [40, 17], chest: [40, 30], hip: [40, 44],
      lShoulder: [33, 22], lElbow: [33, 34], lHand: [33, 44],
      rShoulder: [47, 22], rElbow: [47, 34], rHand: [47, 44],
      lKnee: [40, 60], lFoot: [40, 80],
      rKnee: [42, 60], rFoot: [42, 80],
      extras: <>
        <line x1="30" y1="92" x2="50" y2="92" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M 40 80 Q 36 84 38 90" stroke="#14b8a6" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>,
    }} color="#14b8a6" />,
    caption: { start: 'Tall, knees nearly straight', finish: 'Hop from ankles only' },
  },
  // Broad jump to stick
  broadJump: {
    start: <Stick j={{
      head: [40, 18], neck: [40, 25], chest: [40, 38], hip: [40, 52],
      lShoulder: [33, 30], lElbow: [25, 38], lHand: [20, 44],
      rShoulder: [47, 30], rElbow: [55, 38], rHand: [60, 44],
      lKnee: [38, 68], lFoot: [35, 88],
      rKnee: [42, 68], rFoot: [45, 88],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [55, 28], neck: [55, 35], chest: [55, 45], hip: [55, 60],
      lShoulder: [48, 38], lElbow: [50, 48], lHand: [55, 55],
      rShoulder: [62, 38], rElbow: [60, 48], rHand: [55, 55],
      lKnee: [50, 75], lFoot: [45, 92],
      rKnee: [60, 75], rFoot: [65, 92],
      extras: <path d="M 30 92 Q 45 70 60 92" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />,
    }} color="#14b8a6" />,
    caption: { start: 'Arms back, hips dipped', finish: 'Land soft, stick 2 s' },
  },
  // Nordic ham curl
  nordic: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [33, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [47, 35], rHand: [47, 48],
      lKnee: [40, 62], lFoot: [40, 88],
      rKnee: [42, 62], rFoot: [42, 88],
      extras: <line x1="30" y1="86" x2="50" y2="86" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 60], neck: [40, 53], chest: [40, 42], hip: [40, 28],
      lShoulder: [33, 50], lElbow: [33, 56], lHand: [33, 62],
      rShoulder: [47, 50], rElbow: [47, 56], rHand: [47, 62],
      lKnee: [40, 18], lFoot: [40, 6],
      rKnee: [42, 18], rFoot: [42, 6],
      extras: <line x1="30" y1="86" x2="50" y2="86" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Kneeling, ankles anchored', finish: 'Lower body as one straight line' },
  },
  // Copenhagen plank
  copenhagen: {
    start: <Stick j={{
      head: [20, 50], neck: [26, 50], chest: [38, 50], hip: [54, 50],
      lShoulder: [32, 46], lElbow: [22, 60], lHand: [22, 70],
      rShoulder: [44, 46], rElbow: [54, 46], rHand: [62, 46],
      lKnee: [66, 50], lFoot: [80, 50],
      rKnee: [70, 52], rFoot: [82, 38],
      extras: <line x1="60" y1="36" x2="86" y2="36" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [22, 22], neck: [28, 28], chest: [38, 32], hip: [52, 38],
      lShoulder: [32, 34], lElbow: [22, 50], lHand: [22, 62],
      rShoulder: [44, 30], rElbow: [54, 28], rHand: [64, 26],
      lKnee: [62, 44], lFoot: [78, 50],
      rKnee: [66, 38], rFoot: [80, 36],
      extras: <line x1="60" y1="36" x2="86" y2="36" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Side-lying, top leg on bench', finish: 'Lift hips, hold' },
  },
  // Toe/heel walks
  walks: {
    start: <Stick j={{
      head: [30, 12], neck: [30, 19], chest: [30, 32], hip: [30, 50],
      lShoulder: [23, 22], lElbow: [23, 35], lHand: [23, 48],
      rShoulder: [37, 22], rElbow: [37, 35], rHand: [37, 48],
      lKnee: [28, 70], lFoot: [25, 92],
      rKnee: [32, 70], rFoot: [35, 92],
      extras: <line x1="18" y1="92" x2="50" y2="92" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" opacity="0.4" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [55, 12], neck: [55, 19], chest: [55, 32], hip: [55, 50],
      lShoulder: [48, 22], lElbow: [48, 35], lHand: [48, 48],
      rShoulder: [62, 22], rElbow: [62, 35], rHand: [62, 48],
      lKnee: [53, 70], lFoot: [50, 88],
      rKnee: [57, 70], rFoot: [60, 88],
      extras: <>
        <line x1="42" y1="92" x2="74" y2="92" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M 40 92 L 56 92" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
      </>,
    }} color="#14b8a6" />,
    caption: { start: 'On toes (or heels)', finish: 'Walk forward 20 m' },
  },
  // Face pull / band pull-apart
  facePull: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [22, 22], lHand: [14, 22],
      rShoulder: [47, 22], rElbow: [58, 22], rHand: [66, 22],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [22, 18], lHand: [28, 14],
      rShoulder: [47, 22], rElbow: [58, 18], rHand: [52, 14],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#14b8a6" />,
    caption: { start: 'Arms extended front', finish: 'Pull to face, elbows high & wide' },
  },
  // Curl
  curl: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [30, 48],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [50, 48],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [30, 25],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [50, 25],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#14b8a6" />,
    caption: { start: 'Arms long, palms forward', finish: 'Curl up, elbows fixed' },
  },
  // Triceps pushdown
  pushdown: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 22], lHand: [30, 12],
      rShoulder: [47, 22], rElbow: [50, 22], rHand: [50, 12],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [30, 22], lHand: [30, 38],
      rShoulder: [47, 22], rElbow: [50, 22], rHand: [50, 38],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#14b8a6" />,
    caption: { start: 'Elbows tucked, rope up', finish: 'Push down and apart' },
  },
  // Hollow hold
  hollow: {
    start: <Stick j={{
      head: [20, 30], neck: [28, 32], chest: [38, 32], hip: [55, 30],
      lShoulder: [33, 30], lElbow: [25, 22], lHand: [18, 14],
      rShoulder: [43, 30], rElbow: [52, 22], rHand: [60, 14],
      lKnee: [62, 36], lFoot: [72, 42],
      rKnee: [66, 36], rFoot: [76, 42],
      extras: <line x1="10" y1="46" x2="80" y2="46" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [22, 28], neck: [28, 30], chest: [36, 32], hip: [50, 34],
      lShoulder: [32, 30], lElbow: [22, 22], lHand: [14, 16],
      rShoulder: [40, 30], rElbow: [50, 22], rHand: [58, 16],
      lKnee: [60, 38], lFoot: [72, 44],
      rKnee: [64, 38], rFoot: [76, 44],
      extras: <line x1="10" y1="46" x2="80" y2="46" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Back flat, arms + legs up', finish: 'Shallow curve, hold' },
  },
  // Pallof press
  pallof: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [33, 32], lHand: [38, 38],
      rShoulder: [47, 22], rElbow: [47, 32], rHand: [42, 38],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
      extras: <line x1="0" y1="30" x2="20" y2="30" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [33, 28], lHand: [20, 30],
      rShoulder: [47, 22], rElbow: [47, 28], rHand: [60, 30],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
      extras: <line x1="0" y1="30" x2="20" y2="30" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Handle at chest, side-on', finish: 'Press out, resist rotation' },
  },
  // Bulgarian split squat
  bulgarian: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [30, 35], lHand: [28, 48],
      rShoulder: [47, 22], rElbow: [50, 35], rHand: [52, 48],
      lKnee: [38, 70], lFoot: [35, 90],
      rKnee: [45, 60], rFoot: [55, 50],
      extras: <line x1="50" y1="48" x2="60" y2="48" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 20], neck: [40, 27], chest: [40, 38], hip: [40, 52],
      lShoulder: [33, 30], lElbow: [30, 43], lHand: [28, 55],
      rShoulder: [47, 30], rElbow: [50, 43], rHand: [52, 55],
      lKnee: [33, 68], lFoot: [33, 88],
      rKnee: [47, 56], rFoot: [57, 46],
      extras: <line x1="50" y1="46" x2="60" y2="46" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Rear foot on bench', finish: 'Lower straight down, drive through heel' },
  },
  // Wall slide
  wallSlide: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [25, 32], lHand: [22, 42],
      rShoulder: [47, 22], rElbow: [55, 32], rHand: [58, 42],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
      extras: <line x1="15" y1="0" x2="15" y2="100" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 55],
      lShoulder: [33, 22], lElbow: [25, 14], lHand: [22, 6],
      rShoulder: [47, 22], rElbow: [55, 14], rHand: [58, 6],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
      extras: <line x1="15" y1="0" x2="15" y2="100" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Back to wall, arms in "W"', finish: 'Slide up to "Y", stay in contact' },
  },
  // T-spine rotation
  tSpine: {
    start: <Stick j={{
      head: [30, 30], neck: [36, 36], chest: [42, 42], hip: [54, 60],
      lShoulder: [40, 40], lElbow: [30, 38], lHand: [22, 32],
      rShoulder: [48, 44], rElbow: [54, 50], rHand: [60, 54],
      lKnee: [40, 80], lFoot: [38, 95],
      rKnee: [54, 80], rFoot: [56, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [30, 30], neck: [36, 36], chest: [42, 42], hip: [54, 60],
      lShoulder: [40, 40], lElbow: [42, 28], lHand: [44, 18],
      rShoulder: [48, 44], rElbow: [54, 50], rHand: [60, 54],
      lKnee: [40, 80], lFoot: [38, 95],
      rKnee: [54, 80], rFoot: [56, 95],
    }} color="#14b8a6" />,
    caption: { start: 'All fours, hand behind head', finish: 'Rotate elbow up to ceiling' },
  },
  // Hip flexor / pigeon mobility
  hipFlexor: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [33, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [47, 35], rHand: [47, 48],
      lKnee: [40, 70], lFoot: [40, 92],
      rKnee: [50, 78], rFoot: [55, 92],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [44, 50],
      lShoulder: [33, 22], lElbow: [33, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [47, 35], rHand: [47, 48],
      lKnee: [44, 70], lFoot: [44, 92],
      rKnee: [54, 78], rFoot: [59, 92],
    }} color="#14b8a6" />,
    caption: { start: 'Half-kneeling', finish: 'Tuck tailbone, shift hips forward' },
  },
  // Calf mobility
  calfMobility: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [25, 35], lHand: [18, 45],
      rShoulder: [47, 22], rElbow: [55, 35], rHand: [62, 45],
      lKnee: [38, 70], lFoot: [38, 92],
      rKnee: [50, 75], rFoot: [60, 92],
      extras: <line x1="18" y1="46" x2="18" y2="92" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [25, 35], lHand: [18, 45],
      rShoulder: [47, 22], rElbow: [55, 35], rHand: [62, 45],
      lKnee: [38, 70], lFoot: [38, 92],
      rKnee: [48, 72], rFoot: [58, 92],
      extras: <line x1="18" y1="46" x2="18" y2="92" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Hands on wall', finish: 'Press back heel down' },
  },
  // Straight-arm pulldown
  straightArmPd: {
    start: <Stick j={{
      head: [40, 18], neck: [40, 25], chest: [40, 38], hip: [42, 55],
      lShoulder: [33, 28], lElbow: [28, 16], lHand: [25, 6],
      rShoulder: [47, 28], rElbow: [52, 16], rHand: [55, 6],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 18], neck: [40, 25], chest: [40, 38], hip: [42, 55],
      lShoulder: [33, 28], lElbow: [28, 32], lHand: [30, 48],
      rShoulder: [47, 28], rElbow: [52, 32], rHand: [50, 48],
      lKnee: [38, 75], lFoot: [38, 95],
      rKnee: [42, 75], rFoot: [42, 95],
    }} color="#14b8a6" />,
    caption: { start: 'Arms straight, bar overhead', finish: 'Pull down in arc to thighs' },
  },
  // Skater hop
  skater: {
    start: <Stick j={{
      head: [30, 18], neck: [30, 25], chest: [30, 38], hip: [30, 52],
      lShoulder: [23, 30], lElbow: [20, 40], lHand: [18, 48],
      rShoulder: [37, 30], rElbow: [40, 40], rHand: [42, 48],
      lKnee: [28, 68], lFoot: [25, 88],
      rKnee: [34, 68], rFoot: [40, 78],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [55, 18], neck: [55, 25], chest: [55, 38], hip: [55, 52],
      lShoulder: [48, 30], lElbow: [50, 40], lHand: [52, 48],
      rShoulder: [62, 30], rElbow: [60, 40], rHand: [58, 48],
      lKnee: [53, 68], lFoot: [48, 78],
      rKnee: [57, 68], rFoot: [60, 88],
      extras: <path d="M 25 88 Q 40 60 60 88" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />,
    }} color="#14b8a6" />,
    caption: { start: 'On one leg', finish: 'Hop sideways, stick landing' },
  },
  // Short-foot / toe yoga (foot focus)
  foot: {
    start: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [33, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [47, 35], rHand: [47, 48],
      lKnee: [40, 70], lFoot: [40, 92],
      rKnee: [42, 70], rFoot: [42, 92],
      extras: <ellipse cx="41" cy="94" rx="6" ry="2" fill="none" stroke="#9ca3af" strokeWidth="2" />,
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
      lShoulder: [33, 22], lElbow: [33, 35], lHand: [33, 48],
      rShoulder: [47, 22], rElbow: [47, 35], rHand: [47, 48],
      lKnee: [40, 70], lFoot: [40, 92],
      rKnee: [42, 70], rFoot: [42, 92],
      extras: <path d="M 36 94 Q 41 88 46 94" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />,
    }} color="#14b8a6" />,
    caption: { start: 'Foot flat, toes relaxed', finish: 'Dome the arch up' },
  },
  // Warm-up walk
  walk: {
    start: <Stick j={{
      head: [30, 12], neck: [30, 19], chest: [30, 32], hip: [30, 50],
      lShoulder: [23, 22], lElbow: [22, 35], lHand: [22, 48],
      rShoulder: [37, 22], rElbow: [38, 35], rHand: [38, 48],
      lKnee: [28, 70], lFoot: [25, 92],
      rKnee: [32, 70], rFoot: [35, 92],
    }} color="#9ca3af" />,
    finish: <Stick j={{
      head: [55, 12], neck: [55, 19], chest: [55, 32], hip: [55, 50],
      lShoulder: [48, 22], lElbow: [50, 35], lHand: [52, 48],
      rShoulder: [62, 22], rElbow: [60, 35], rHand: [58, 48],
      lKnee: [53, 70], lFoot: [50, 92],
      rKnee: [57, 70], rFoot: [60, 92],
      extras: <path d="M 25 92 L 50 92" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3,3" />,
    }} color="#14b8a6" />,
    caption: { start: 'Easy pace', finish: '10 min, build to brisk' },
  },
}

// ── Mapping: exercise id → figure key ────────────────────────────────────────
const EXERCISE_FIG: Record<string, keyof typeof FIGS> = {
  'couch-stretch': 'couchStretch',
  'banded-lateral-walk': 'lateralWalk',
  'pogo-hops': 'pogo',
  'goblet-back-squat': 'squat',
  'dead-bug': 'deadBug',
  'romanian-deadlift': 'hinge',
  'single-leg-calf-raise': 'calfRaise',
  'bulgarian-split-squat': 'bulgarian',
  'pallof-press': 'pallof',
  'seated-calf-raise-soleus': 'seatedCalf',
  'tibialis-raise': 'tibialis',
  'band-pull-aparts': 'facePull',
  'wall-slides': 'wallSlide',
  'thoracic-rotation': 'tSpine',
  'lat-pulldown': 'pulldown',
  'incline-db-press': 'inclinePress',
  'chest-supported-row': 'row',
  'db-overhead-press': 'press',
  'straight-arm-pulldown': 'straightArmPd',
  'face-pull': 'facePull',
  'incline-db-curl': 'curl',
  'rope-pushdown': 'pushdown',
  'side-plank': 'sidePlank',
  'hollow-hold': 'hollow',
  'broad-jump-to-stick': 'broadJump',
  'lateral-skater-hop': 'skater',
  'nordic-ham-curl': 'nordic',
  'copenhagen-plank': 'copenhagen',
  'toe-walks': 'walks',
  'heel-walks': 'walks',
  'daily-tibialis-raise': 'tibialis',
  'daily-single-leg-calf': 'calfRaise',
  'short-foot': 'foot',
  'toe-yoga': 'foot',
  'ankle-circles': 'foot',
  'hip-flexor-mobility': 'hipFlexor',
  'calf-mobility': 'calfMobility',
  't-spine-mobility': 'tSpine',
  'glute-mobility': 'hipFlexor',
  'warmup-walk': 'walk',
}

export const ExerciseFigure: React.FC<FigureProps> = ({ exercise, className = '' }) => {
  const figKey = EXERCISE_FIG[exercise.id]
  const fig = figKey ? FIGS[figKey] : undefined

  if (!fig) {
    // Generic fallback figure
    return (
      <svg viewBox="0 0 80 100" className={className} role="img" aria-label={exercise.name}>
        <Stick j={{
          head: [40, 12], neck: [40, 19], chest: [40, 32], hip: [40, 50],
          lShoulder: [33, 22], lElbow: [30, 35], lHand: [28, 48],
          rShoulder: [47, 22], rElbow: [50, 35], rHand: [52, 48],
          lKnee: [38, 70], lFoot: [38, 92],
          rKnee: [42, 70], rFoot: [42, 92],
        }} color="#9ca3af" />
      </svg>
    )
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 80 100" className="w-full h-auto" role="img" aria-label={`${exercise.name} — start position`}>
          {fig.start}
        </svg>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center">
          {fig.caption?.start ?? 'Start'}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 80 100" className="w-full h-auto" role="img" aria-label={`${exercise.name} — finish position`}>
          {fig.finish}
        </svg>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center">
          {fig.caption?.finish ?? 'Finish'}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MuscleMap — SVG body outline with primary (red) + secondary (yellow) highlights
// ─────────────────────────────────────────────────────────────────────────────

interface MuscleMapProps {
  exercise: Exercise
  className?: string
}

// Crude body region highlight — we tint the parts that match `primary` and `secondary`
const matchRegions = (exercise: Exercise): { primary: string[]; secondary: string[] } => {
  const text = (exercise.primary.join(' ') + ' ' + exercise.secondary.join(' ')).toLowerCase()
  const primary: string[] = []
  const secondary: string[] = []

  if (/quad|rectus femoris|vastus/.test(text)) primary.push('quads')
  if (/glute/.test(text)) primary.push('glutes')
  if (/hamstring|biceps femoris|semitendinosus|semimembranosus/.test(text)) primary.push('hams')
  if (/calf|gastrocnemius|soleus/.test(text)) primary.push('calf')
  if (/tibialis/.test(text)) primary.push('shin')
  if (/adductor/.test(text)) primary.push('adductors')
  if (/lat/.test(text)) primary.push('lats')
  if (/pec|chest/.test(text)) primary.push('chest')
  if (/deltoid|shoulder/.test(text)) primary.push('delts')
  if (/biceps/.test(text)) primary.push('biceps')
  if (/triceps/.test(text)) primary.push('triceps')
  if (/rhomboid|trapezius|upper back|mid-back/.test(text)) primary.push('upperback')
  if (/oblique|rectus abdominis|transvers|core/.test(text)) primary.push('core')
  if (/hip flexor|iliopsoas/.test(text)) primary.push('hipflexor')
  if (/rotator cuff|infraspinatus|teres/.test(text)) primary.push('rotator')
  if (/plantar|foot|arch/.test(text)) primary.push('foot')
  if (/achilles|tendon/.test(text)) secondary.push('achilles')
  if (/forearm|brachioradialis/.test(text)) secondary.push('forearm')
  if (/erector/.test(text)) secondary.push('spine')

  // Re-classify: if too many primary, demote secondary-stated muscles
  if (primary.length > 4) {
    const demote = primary.splice(4)
    secondary.push(...demote)
  }

  return { primary, secondary }
}

export const MuscleMap: React.FC<MuscleMapProps> = ({ exercise, className = '' }) => {
  const { primary, secondary } = matchRegions(exercise)
  const has = (r: string, list: string[]) => list.includes(r)

  // Body outline + highlightable regions. Viewbox 100×200.
  const Body = ({ regions, color, opacity }: { regions: string[]; color: string; opacity: number }) => (
    <g fill={color} opacity={opacity}>
      {/* head */}
      <circle cx="50" cy="18" r="9" />
      {/* neck */}
      <rect x="46" y="26" width="8" height="6" />
      {/* chest */}
      {has('chest', regions) && <path d="M 35 32 Q 50 30 65 32 L 65 50 Q 50 52 35 50 Z" />}
      {/* delts */}
      {has('delts', regions) && <><circle cx="33" cy="35" r="6" /><circle cx="67" cy="35" r="6" /></>}
      {/* lats */}
      {has('lats', regions) && <><path d="M 35 48 Q 38 56 40 64 L 46 64 L 46 48 Z" /><path d="M 65 48 Q 62 56 60 64 L 54 64 L 54 48 Z" /></>}
      {/* upper back (posterior) — shown as back shading on the same silhouette */}
      {has('upperback', regions) && <><path d="M 35 36 L 65 36 L 65 50 L 35 50 Z" opacity="0.6" /></>}
      {/* biceps */}
      {has('biceps', regions) && <><ellipse cx="28" cy="50" rx="4" ry="8" /><ellipse cx="72" cy="50" rx="4" ry="8" /></>}
      {/* triceps */}
      {has('triceps', regions) && <><ellipse cx="22" cy="50" rx="4" ry="8" /><ellipse cx="78" cy="50" rx="4" ry="8" /></>}
      {/* forearms */}
      {has('forearm', regions) && <><ellipse cx="24" cy="68" rx="4" ry="10" /><ellipse cx="76" cy="68" rx="4" ry="10" /></>}
      {/* core */}
      {has('core', regions) && <path d="M 40 50 L 60 50 L 60 72 L 40 72 Z" />}
      {/* hip flexor */}
      {has('hipflexor', regions) && <><path d="M 42 70 L 50 70 L 50 80 L 42 78 Z" /><path d="M 50 70 L 58 70 L 58 78 L 50 80 Z" /></>}
      {/* glutes */}
      {has('glutes', regions) && <path d="M 35 72 Q 50 70 65 72 L 65 88 Q 50 90 35 88 Z" />}
      {/* quads */}
      {has('quads', regions) && <><path d="M 38 84 L 48 84 L 48 110 L 38 110 Z" /><path d="M 52 84 L 62 84 L 62 110 L 52 110 Z" /></>}
      {/* hams */}
      {has('hams', regions) && <><path d="M 34 84 L 38 84 L 38 110 L 34 110 Z" /><path d="M 62 84 L 66 84 L 66 110 L 62 110 Z" /></>}
      {/* adductors */}
      {has('adductors', regions) && <path d="M 46 84 L 54 84 L 54 105 L 46 105 Z" opacity="0.85" />}
      {/* calf */}
      {has('calf', regions) && <><path d="M 38 112 L 48 112 L 48 138 L 38 138 Z" /><path d="M 52 112 L 62 112 L 62 138 L 52 138 Z" /></>}
      {/* shin */}
      {has('shin', regions) && <><path d="M 40 112 L 46 112 L 46 140 L 40 140 Z" /><path d="M 54 112 L 60 112 L 60 140 L 54 140 Z" /></>}
      {/* achilles */}
      {has('achilles', regions) && <><path d="M 38 138 L 42 138 L 42 152 L 38 152 Z" opacity="0.7" /><path d="M 58 138 L 62 138 L 62 152 L 58 152 Z" opacity="0.7" /></>}
      {/* foot */}
      {has('foot', regions) && <><ellipse cx="43" cy="160" rx="6" ry="3" /><ellipse cx="57" cy="160" rx="6" ry="3" /></>}
      {/* rotator cuff */}
      {has('rotator', regions) && <><circle cx="36" cy="40" r="3" /><circle cx="64" cy="40" r="3" /></>}
    </g>
  )

  return (
    <div className={className}>
      <svg viewBox="0 0 100 180" className="w-full h-auto" role="img" aria-label={`Muscles worked: ${exercise.name}`}>
        {/* body outline */}
        <g fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-700">
          <circle cx="50" cy="18" r="9" />
          <rect x="46" y="26" width="8" height="6" />
          <path d="M 35 32 Q 50 30 65 32 L 65 50 Q 50 52 35 50 Z" />
          <circle cx="33" cy="35" r="6" /><circle cx="67" cy="35" r="6" />
          <path d="M 27 40 L 33 70" /><path d="M 73 40 L 67 70" />
          <path d="M 27 70 L 32 78" /><path d="M 73 70 L 68 78" />
          <path d="M 40 50 L 60 50 L 60 72 L 40 72 Z" />
          <path d="M 35 72 Q 50 70 65 72 L 65 88 Q 50 90 35 88 Z" />
          <path d="M 38 84 L 48 84 L 48 110 L 38 110 Z" /><path d="M 52 84 L 62 84 L 62 110 L 52 110 Z" />
          <path d="M 38 112 L 48 112 L 48 140 L 38 140 Z" /><path d="M 52 112 L 62 112 L 62 140 L 52 140 Z" />
          <ellipse cx="43" cy="160" rx="6" ry="3" /><ellipse cx="57" cy="160" rx="6" ry="3" />
        </g>
        {/* primary */}
        <Body regions={primary} color="#ef4444" opacity={0.55} />
        {/* secondary */}
        <Body regions={secondary} color="#eab308" opacity={0.4} />
      </svg>
      <div className="flex gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-1 justify-center">
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 align-middle mr-1" />Primary</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 align-middle mr-1" />Secondary</span>
      </div>
    </div>
  )
}
