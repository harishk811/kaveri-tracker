import type { InjuryInfo } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────────────
// Safety data — from PDF Section 05
// Pain traffic light, stress-fracture red flags, the five named injuries,
// the Sunday green-light checklist, and the calf-raise capacity gate.
// ─────────────────────────────────────────────────────────────────────────────────────

export interface PainTrafficLight {
  level: 'green' | 'amber' | 'red'
  looksLike: string
  action: string
}

export const PAIN_TRAFFIC_LIGHT: PainTrafficLight[] = [
  {
    level: 'green',
    looksLike: 'Up to 3/10. Warms up and disappears within ten minutes. Gone by the next morning. No change to how you run.',
    action: 'Continue as planned. Log it. Watch it for three days.',
  },
  {
    level: 'amber',
    looksLike: '4–5/10. Present throughout the run. Still sore the next morning. Gait still normal.',
    action: 'Cut running volume by 40% for five days, remove all quality work, replace with swimming or walking. Reassess before resuming. Never race through amber.',
  },
  {
    level: 'red',
    looksLike: 'Above 5/10, or it changes your gait, or it hurts at rest or at night, or it worsens as the run goes on, or there is pinpoint tenderness on the bone you can cover with one fingertip.',
    action: 'Stop running entirely. Physiotherapist or sports physician within the week. Minimum seven days of no running. Cross-train freely if painless.',
  },
]

export const STRESS_FRACTURE_WARNINGS: string[] = [
  'Pain that is pinpoint on the bone rather than spread along it.',
  'Pain that worsens the longer you run instead of warming up.',
  'Pain at night or at rest.',
  'Pain on hopping on one leg.',
]

export const STRESS_FRACTURE_ACTION: string =
  'Any of these means stop and get imaging, not rest and hope. A stress reaction caught in week one costs three weeks; missed, it costs the marathon and three months.'

export const INJURIES: InjuryInfo[] = [
  {
    name: "Runner's knee",
    firstSign: 'Vague ache under or around the kneecap, worse on stairs, downhills, and after sitting.',
    immediateAction: 'Cut downhill running, raise cadence, glute-medius work daily.',
    defendedBy: 'Bulgarian split squats, banded lateral walks, Pallof press.',
  },
  {
    name: 'IT band syndrome',
    firstSign: 'Sharp pain outside the knee, appearing at a predictable time into every run.',
    immediateAction: 'Stop that run — it will not run off. Hip abductor work; avoid cambered roads and track curves.',
    defendedBy: 'Copenhagen planks, skater hops, single-leg strength.',
  },
  {
    name: 'Achilles tendinopathy',
    firstSign: 'Stiffness in the first steps out of bed; tender to pinch 3–5 cm above the heel.',
    immediateAction: 'Remove speed work and hills. Heavy slow eccentric calf raises daily. Do not stretch aggressively.',
    defendedBy: 'Three-second eccentric calf raises in every lower session; capped plyometric volume.',
  },
  {
    name: 'Plantar fasciitis',
    firstSign: 'Sharp heel pain on the first steps in the morning that eases with walking.',
    immediateAction: 'Calf and foot loading, supportive shoes indoors, roll the arch.',
    defendedBy: 'Short-foot work, toe yoga, calf capacity in the daily routine.',
  },
  {
    name: 'Hamstring strain',
    firstSign: 'A grab or pull during strides or tempo, usually high in the back of the thigh.',
    immediateAction: 'Stop the session. No strides or speed for ten days. Keep loading gently — rest alone makes it worse.',
    defendedBy: 'Nordic / Swiss-ball curls kept in all fourteen weeks, Romanian deadlifts.',
  },
]

// Sunday green-light checklist — 8 checks from PDF Section 10
export interface GreenLightCheck {
  id: string
  label: string
  description: string
}

export const GREEN_LIGHT_CHECKS: GreenLightCheck[] = [
  { id: 'rhr', label: 'Resting HR within 5 bpm of baseline', description: 'On waking, before getting up.' },
  { id: 'shin', label: 'No shin pain past first 10 min', description: 'Should warm up and disappear within ten minutes of running.' },
  { id: 'calves', label: 'Both calves feel the same', description: 'No one-sided swelling, tenderness, or firm cord-like lump under the skin.' },
  { id: 'skin', label: 'No new skin discolouration or breaks', description: 'Around either ankle.' },
  { id: 'weight', label: 'Weight 4-week avg in 74–76 kg', description: 'Same time, after toilet, before food.' },
  { id: 'sleep', label: 'Sleep averaged 7 h+', description: 'Across the week.' },
  { id: 'recovery', label: 'Legs recovered within 48 h', description: 'Of last Sunday\'s long run.' },
  { id: 'gait', label: 'No pain that changes how you run', description: 'Any limp means stop, not push through.' },
]

export const GREEN_LIGHT_ACTION: string =
  'Two or more unchecked: cut the coming week\'s running volume by 30% and hold the long run at the previous week\'s distance. Do not make it up later. This checklist is the safety valve that lets the plan be aggressive at all.'

// Stop training and get seen the same day if any of these appear
export const RED_FLAG_SYMPTOMS: string[] = [
  'Swelling, pain or warmth in one calf but not the other.',
  'A firm, tender, cord-like line under the skin.',
  'Redness spreading over a leg.',
  'Any skin break near the ankle that is not healing.',
  'Sudden breathlessness or chest pain.',
]

// Calf-raise capacity gate — end of Week 6
export const CALF_RAISE_GATE = {
  description: '25 consecutive single-leg calf raises to full height on each side',
  threshold: 'No more than a two-rep difference between legs',
  actionIfFailed: 'Hold running volume flat until you can. This is a genuine gate, not a suggestion.',
  week: 6,
}

// Daily six-minute lower-leg routine — every morning, barefoot
export const DAILY_SHIN_SUMMARY: string =
  'Tibialis raise against wall · single-leg calf raise slow · short-foot / arch doming · toe yoga · ankle circles & alphabet. Every morning, barefoot, before the day starts.'
