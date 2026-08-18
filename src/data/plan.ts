import { differenceInCalendarDays } from 'date-fns'
import type {
  GateBand, PlanWeek, Session, StageTag, WeekStage, Zone, Step2Block, FuellingPhase, PacingSegment, GlossaryTerm,
} from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING ZONES · MHR 190 — from PDF Section 01
// ─────────────────────────────────────────────────────────────────────────────

export const ZONES: Record<string, Zone> = {
  recovery: {
    key: 'recovery',
    name: 'Recovery jog',
    technical: 'Recovery · < 140 bpm',
    paceRange: '8:30–9:15/km',
    hrRange: '< 140',
    explain: 'So slow it feels almost embarrassing. That is the point — you are warming up blood flow and clearing fatigue, not training fitness.',
    feelsLike: 'You could hold a long conversation and barely notice you are running. Barely out of breath.',
    why: 'Recovery jogs add gentle volume without taxing the legs. Done faster, they stop being recovery and start being junk miles that steal from your quality days.',
    colour: 'zone-recovery',
  },
  easy: {
    key: 'easy',
    name: 'Easy / Aerobic',
    technical: 'Easy · 140–152 bpm',
    paceRange: '7:55–8:35/km',
    hrRange: '140–152',
    explain: 'The default. 75–80% of all your kilometres run in this zone. Full-sentence conversation throughout.',
    feelsLike: 'Conversational. You can speak in full sentences without pausing for breath. If you cannot, you are too fast.',
    why: 'This is where your aerobic engine is built — the engine a marathon runs on. Running faster than easy on easy days is the single most common way amateurs ruin a marathon block.',
    colour: 'zone-easy',
  },
  steady: {
    key: 'steady',
    name: 'Long-run steady',
    technical: 'Steady · 150–158 bpm',
    paceRange: '7:35–8:05/km',
    hrRange: '150–158',
    explain: 'Sunday long runs. A touch firmer than easy, drifting up in the final third as you fatigue. That upward drift is normal.',
    feelsLike: 'Comfortably working. You can still talk, but in shorter phrases. The last few km may feel harder — that is the point of a long run.',
    why: 'Builds endurance, capillary density, and teaches your body to burn fat at running pace. The long run is the single most important session of the week by a distance.',
    colour: 'zone-steady',
  },
  mp: {
    key: 'mp',
    name: 'Marathon Pace',
    technical: 'MP · 157–165 bpm',
    paceRange: 'Set on 27 Sep',
    hrRange: '157–165',
    explain: 'Deliberately blank until the decision gate fills it in. Working assumption 6:55–7:05/km. The pace you will hold for 42.2 km on 22 November.',
    feelsLike: 'Focused and rhythmic. You can speak in three-word phrases. It is a pace you could hold for a long time but not indefinitely.',
    why: 'Rehearsal. Every MP block in October is a chance to practise fuelling, cadence, and form at the exact effort you will hold on race day.',
    colour: 'zone-steady',
  },
  half: {
    key: 'half',
    name: 'Half-marathon effort',
    technical: 'Half · 163–171 bpm',
    paceRange: '6:35–6:50/km',
    hrRange: '163–171',
    explain: 'The effort you will race the Wipro Bengaluru Half at on 27 September, and the long threshold blocks in October.',
    feelsLike: 'Hard work. Short sentences only. You can hold it for 21.1 km but it is uncomfortable from km 12 onward.',
    why: 'Honest reading. The half is the decision gate — run it at true half-effort and the clock tells you what marathon band is genuinely available.',
    colour: 'zone-threshold',
  },
  threshold: {
    key: 'threshold',
    name: 'Threshold / Tempo',
    technical: 'Threshold · 168–176 bpm',
    paceRange: '6:20–6:35/km',
    hrRange: '168–176',
    explain: 'Friday blocks of 5–15 minutes. Three-word answers only. The pace you could hold for roughly one hour flat-out.',
    feelsLike: 'Hard. You can get three words out before needing a breath. By the end of a block you are relieved it is over.',
    why: 'Raises the ceiling — pushes your lactate threshold up so your "hard" pace gets faster without going anaerobic. The second of only two hard sessions a week.',
    colour: 'zone-threshold',
  },
  '10k': {
    key: '10k',
    name: '10K race pace',
    technical: '10K · 172–180 bpm',
    paceRange: '6:00–6:15/km',
    hrRange: '172–180',
    explain: '19 September only. Hard and controlled, but not emptied out — the half is eight days later.',
    feelsLike: 'Very hard, very controlled. You are working, but you know you have another gear. You finish feeling you could have gone a minute faster.',
    why: 'Early warning. A sub-58:00 here is the first sign the 4:30 band is genuinely in play. Anything over 1:05 means the half target moves down a band.',
    colour: 'zone-race',
  },
  strides: {
    key: 'strides',
    name: 'Strides & plyo',
    technical: 'Strides · 5:30–5:45/km',
    paceRange: '5:30–5:45/km',
    hrRange: 'n/a — too short',
    explain: '15–20 second accelerations after easy runs. Never a full session. Build running economy and form.',
    feelsLike: 'Quick and light, relaxed, not strained. Like a sprint but at 80% effort, staying smooth.',
    why: 'Strides teach your legs to turn over quickly without the fatigue of a sprint session. Free running economy, no recovery cost.',
    colour: 'zone-race',
  },
  raceMarathon: {
    key: 'raceMarathon',
    name: 'Marathon race pace',
    technical: 'Race · 6:24/km avg',
    paceRange: '6:24/km average (band set on 27 Sep)',
    hrRange: 'set on 27 Sep',
    explain: 'The pace you hold for 42.2 km on 22 November. Set by the decision gate on 27 September — not by hope.',
    feelsLike: 'Rhythmic and sustainable. 9:1 run-walk keeps HR in check. You can hold it for hours but discipline is everything.',
    why: 'Everything in the block builds toward this pace. The pacing band on the Race tab is the exact effort you hold on race day.',
    colour: 'zone-race',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK STAGES — what each tag means, plain language
// ─────────────────────────────────────────────────────────────────────────────

export const STAGES: Record<StageTag, WeekStage> = {
  Build: {
    tag: 'Build',
    meaning: 'Volume and intensity are climbing. Your body is adapting to more work.',
    bodyAdaptation: 'Aerobic engine expanding, capillaries growing, tendons stiffening, bone remodelling.',
    goodFeelsLike: 'Tired on Monday, fresh by Wednesday. Legs feel springy by Friday. Long run feels achievable.',
    concerning: 'Shin soreness that does not warm up. Resting HR up 7+ bpm two mornings running. Weight dropping more than 1 kg in a fortnight.',
    colour: 'zone-easy',
  },
  Deload: {
    tag: 'Deload',
    meaning: 'Volume drops deliberately so your bone and tendons can catch up. Fitness does not drop in a deload — fatigue does.',
    bodyAdaptation: 'Bone remodelling completes. Tendon and connective tissue absorb the prior three weeks of work.',
    goodFeelsLike: 'Legs feel fresh by midweek. You might feel "undertrained" — that is the point. Resist the urge to do more.',
    concerning: 'Nothing. A deload is the safest week in the block. If anything hurts here, it was already building before.',
    colour: 'zone-deload',
  },
  Peak: {
    tag: 'Peak',
    meaning: 'Highest volume and the longest runs. The hardest weeks of the block. Everything before was preparation for this.',
    bodyAdaptation: 'Maximal aerobic capacity, fuel-burning efficiency, mental rehearsal for race distance.',
    goodFeelsLike: 'Tired but coping. Long runs feel long but doable. Slightly hungry all week — eat more, not less.',
    concerning: 'Any pain that changes your gait. Weight dropping fast. Resting HR climbing. These are the weeks that make or break the marathon.',
    colour: 'zone-threshold',
  },
  Taper: {
    tag: 'Taper',
    meaning: 'Volume comes down sharply so you arrive at race day with fitness stored and fatigue shed. You cannot gain fitness now — only lose it.',
    bodyAdaptation: 'Fatigue clears. Glycogen stores refill (with carb loading). Muscle damage from the peak heals.',
    goodFeelsLike: 'Restless and "too fresh". Legs feel springy on easy runs. You will want to do more — do not.',
    concerning: 'New pain. Old pain that does not settle. Illness. Sleep disturbance. Otherwise, taper tantrums (feeling anxious and sluggish) are normal.',
    colour: 'zone-deload',
  },
  Race: {
    tag: 'Race',
    meaning: 'Race week. Volume minimal. Sharpening only. Everything now is about arriving at the start line fresh, fuelled, and confident.',
    bodyAdaptation: 'Full recovery. Glycogen supercompensation from carb load. Hydration topped up.',
    goodFeelsLike: 'Light and springy on the shakeout. Slightly nervous — that is good, not bad. Appetite strong.',
    concerning: 'Any hint of illness. New pain. Bad sleep the night before is normal and does not matter — two nights before is the one that counts.',
    colour: 'zone-race',
  },
  Recovery: {
    tag: 'Recovery',
    meaning: 'The week after a race or hard effort. Everything gentle. No quality. Let the body actually absorb what you just did.',
    bodyAdaptation: 'Muscle damage repair. Inflammation resolves. Glycogen restored. Hormones normalise.',
    goodFeelsLike: 'Heavy legs on Monday, gradually lightening. Appetite high. Sleep deep.',
    concerning: 'Pain from the race that is not settling day by day. Anything that makes you limp.',
    colour: 'zone-recovery',
  },
  Hurdle: {
    tag: 'Hurdle',
    meaning: 'A race that sits inside the training block — not the goal, but an honest checkpoint. Run it controlled, not emptied out.',
    bodyAdaptation: 'Same as Build — this is a hard training stimulus wrapped in a race.',
    goodFeelsLike: 'Strong and controlled. You finish knowing you had more to give, because you should have.',
    concerning: 'Going out too fast. Emptying yourself so completely that the following week is lost.',
    colour: 'zone-race',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 14-WEEK PLAN · 17 Aug – 22 Nov 2026 · from PDF Section 12
// ─────────────────────────────────────────────────────────────────────────────

// Helper to build session ids
const sid = (w: number, d: number, s: number) => `w${w}d${d}s${s}`

export const PLAN: PlanWeek[] = [
  // WEEK 1 — 17–23 Aug · Build · 26 km · 13 km long
  {
    week: 1, dateRange: '17–23 Aug', startDate: '2026-08-17',
    stageTags: ['Build'], volumeKm: 26, longRunKm: 13,
    focus: 'First week. Easy everything. Record your cadence baseline on Wednesday.',
    rationale: 'Open the block at the current weekly volume (~26 km). No quality work yet — let the gym and the long run establish the rhythm.',
    sessions: [
      { id: sid(1,0,1), week: 1, day: 0, kind: 'run', slotOfDay: 1, title: 'Recovery jog 4 km', purpose: 'Easy blood flow, shake out legs', whyToday: 'A short, very easy jog to wake the legs after Sunday. Slow enough to feel almost silly — that is correct.', run: { distanceKm: 4, pace: '8:30–9:15/km', zone: 'recovery', notes: 'Easy. Record cadence baseline for the week.' }, stageTags: ['Build'] },
      { id: sid(1,1,1), week: 1, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A — Lower + Plyo + Shin', purpose: 'Heavy leg day — the only one of the week', whyToday: 'Tuesday is an office day with 3.5h in a cab. Better to lift on tired commuter legs than to do a quality run on them. Three days clear of Sunday, three clear of Friday.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance', duration: 45, when: 'Tuesday PM · 45 min' }, stageTags: ['Build'] },
      { id: sid(1,2,1), week: 1, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy run 6 km', purpose: 'Pure aerobic volume, conversational', whyToday: 'Wednesday is your midweek aerobic volume. Metronome on — this is where the cadence habit starts. Office gym cross-trainer is a free swap any week the shins complain.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: 'baseline + 5', notes: 'Conversational. Record cadence baseline.' }, stageTags: ['Build'] },
      { id: sid(1,3,1), week: 1, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B — Upper & Pull', purpose: 'Pull-dominant. Builds swim catch, undoes desk posture', whyToday: 'Thursday is another office day. Pull-dominant work builds the swim catch (a year early) and corrects eight hours of desk and cab posture.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core', duration: 40, when: 'Thursday PM · 40 min' }, stageTags: ['Build'] },
      { id: sid(1,4,1), week: 1, day: 4, kind: 'run', slotOfDay: 1, title: 'Easy 5 km + 6 × 20 s strides', purpose: 'Easy run with light strides for economy', whyToday: 'Friday is a WFH day — fresh legs in the morning, perfect for a quality slot. This week it is just easy + strides; threshold starts Week 2.', run: { distanceKm: 5, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, strides: '6 × 20 s', notes: 'Easy 5 km, then 6 × 20 s relaxed strides after.' }, stageTags: ['Build'] },
      { id: sid(1,5,1), week: 1, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (technique) + easy run 4 km + Strength C', purpose: 'Technique work + plyo durability', whyToday: 'Saturday morning is light. The swim is recovery and skill, not training. Strength C is short, unloaded, and is where the plyometrics live.', swim: { distance: '400 m', drills: '4 × 25 m fingertip-drag · 4 × 25 m catch-up · 4 × 25 m free with pull buoy', goal: 'Exhale fully underwater. Nothing else.', type: 'technique' }, stageTags: ['Build'] },
      { id: sid(1,5,2), week: 1, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy run 4 km', purpose: 'Pre-Conditioning shakeout', whyToday: 'Short easy run before Strength C, just to turn the legs over.', run: { distanceKm: 4, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 4 km before Strength C.' }, stageTags: ['Build'] },
      { id: sid(1,5,3), week: 1, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C — Plyometrics & Durability', purpose: 'Plyo + durability, 20 min', whyToday: 'Plyometrics on fresh legs, the day before the long run. Low-volume, high-quality, grass or mat only.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 20, when: 'Saturday AM · 20 min' }, stageTags: ['Build'] },
      { id: sid(1,6,1), week: 1, day: 6, kind: 'run', slotOfDay: 1, title: 'Long run 13 km', purpose: 'The most important session of the week', whyToday: 'Sunday is the long run — the one session that is non-negotiable. Miss a gym session, miss a swim, miss a midweek run — but move heaven and earth for the long run. Start 9:1 from km 1.', run: { distanceKm: 13, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 158, runWalk91: true, notes: 'Long run, 9:1 run-walk from km 1.' }, stageTags: ['Build'], keySession: true },
      { id: sid(1,6,2), week: 1, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (easy flush)', purpose: 'Recovery, not training', whyToday: 'Sunday evening swim is a recovery tool first and a swim second. Easy, long, relaxed, no intervals. The water pressure itself is part of the recovery after the long run.', swim: { distance: '300 m', drills: '4 × 50 m long-glide freestyle, very easy · 4 × 25 m backstroke', goal: 'Easy flush after the long run.', type: 'flush' }, stageTags: ['Build'] },
    ],
  },

  // WEEK 2 — 24–30 Aug · Build · 30 km · 15 km long
  {
    week: 2, dateRange: '24–30 Aug', startDate: '2026-08-24',
    stageTags: ['Build'], volumeKm: 30, longRunKm: 15,
    focus: 'First threshold work appears Friday. Long run grows to 15 km.',
    rationale: 'Three-week build phase begins. Friday gets the first threshold blocks — short, controlled, three-word-answer pace.',
    sessions: [
      { id: sid(2,0,1), week: 2, day: 0, kind: 'run', slotOfDay: 1, title: 'Recovery jog 4 km', purpose: 'Easy blood flow', whyToday: 'Same as Week 1. Short and slow — this is recovery, not training.', run: { distanceKm: 4, pace: '8:30–9:15/km', zone: 'recovery', notes: 'Easy recovery jog.' }, stageTags: ['Build'] },
      { id: sid(2,1,1), week: 2, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A', purpose: 'Heavy leg day', whyToday: 'Same Tuesday slot. Lifts continue uninterrupted through all 14 weeks.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance', duration: 45, when: 'Tuesday PM · 45 min' }, stageTags: ['Build'] },
      { id: sid(2,2,1), week: 2, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy run 7 km', purpose: 'Aerobic volume, cadence +5', whyToday: 'Wednesday easy. Add 5 spm to your baseline cadence — the metronome is your single most powerful shin-splint defence.', run: { distanceKm: 7, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: 'baseline + 5', notes: 'Conversational. Cadence +5 spm.' }, stageTags: ['Build'] },
      { id: sid(2,3,1), week: 2, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B', purpose: 'Pull-dominant upper', whyToday: 'Same Thursday slot. The gym schedule is never interrupted — that is the muscle-retention mechanism.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core', duration: 40, when: 'Thursday PM · 40 min' }, stageTags: ['Build'] },
      { id: sid(2,4,1), week: 2, day: 4, kind: 'run', slotOfDay: 1, title: '6 km with 3 × 5 min threshold', purpose: 'First quality session — threshold blocks', whyToday: 'Friday WFH morning, fresh legs. The first hard session of the block. Three-word-answer pace — controlled, not all-out.', run: { distanceKm: 6, pace: '6:20–6:35/km', zone: 'threshold', hrCeiling: 176, thresholdBlock: '3 × 5 min (2 min jog)', notes: 'Easy warm-up, then 3 × 5 min threshold with 2 min jog recovery.' }, stageTags: ['Build'], keySession: true },
      { id: sid(2,5,1), week: 2, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (450 m) + easy 3 km + Strength C', purpose: 'Technique + plyo', whyToday: 'Saturday swim grows slightly. Easy run is short to keep legs fresh for Sunday.', swim: { distance: '450 m', drills: '4 × 25 m fingertip-drag · 4 × 25 m catch-up · 4 × 25 m free with pull buoy', goal: 'Exhale fully underwater.', type: 'technique' }, stageTags: ['Build'] },
      { id: sid(2,5,2), week: 2, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy run 3 km', purpose: 'Shakeout', whyToday: 'Short and easy before Strength C.', run: { distanceKm: 3, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 3 km.' }, stageTags: ['Build'] },
      { id: sid(2,5,3), week: 2, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C', purpose: 'Plyo + durability', whyToday: 'Plyo on fresh legs, day before long run.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 20, when: 'Saturday AM · 20 min' }, stageTags: ['Build'] },
      { id: sid(2,6,1), week: 2, day: 6, kind: 'run', slotOfDay: 1, title: 'Long run 15 km', purpose: 'Long run grows', whyToday: 'The long run is the week\'s priority. 9:1 from km 1 — set the alarm and obey it even when it feels ridiculous at km 3.', run: { distanceKm: 15, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 158, runWalk91: true, notes: 'Long run, 9:1 from km 1.' }, stageTags: ['Build'], keySession: true },
      { id: sid(2,6,2), week: 2, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush after the long run.', swim: { distance: '350 m', drills: '4 × 50 m long-glide freestyle · 4 × 25 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Build'] },
    ],
  },

  // WEEK 3 — 31 Aug–6 Sep · Build · 34 km · 17 km long
  {
    week: 3, dateRange: '31 Aug–6 Sep', startDate: '2026-08-31',
    stageTags: ['Build'], volumeKm: 34, longRunKm: 17,
    focus: 'Threshold grows to 4 × 5 min. Long run to 17 km. First gel practice on Sunday.',
    rationale: 'Last week of the first build. Threshold volume increases. First gel on the long run — purely to practise swallowing it while moving.',
    sessions: [
      { id: sid(3,0,1), week: 3, day: 0, kind: 'run', slotOfDay: 1, title: 'Recovery jog 4 km', purpose: 'Easy blood flow', whyToday: 'Same pattern. Easy and short.', run: { distanceKm: 4, pace: '8:30–9:15/km', zone: 'recovery', notes: 'Easy recovery jog.' }, stageTags: ['Build'] },
      { id: sid(3,1,1), week: 3, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A', purpose: 'Heavy leg day', whyToday: 'Tuesday lift — the only heavy leg day of the week.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance', duration: 45, when: 'Tuesday PM · 45 min' }, stageTags: ['Build'] },
      { id: sid(3,2,1), week: 3, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy run 7 km', purpose: 'Aerobic volume, cadence +5', whyToday: 'Wednesday easy. Hold the cadence gain from Week 2.', run: { distanceKm: 7, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: 'baseline + 5', notes: 'Conversational. Cadence held.' }, stageTags: ['Build'] },
      { id: sid(3,3,1), week: 3, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B', purpose: 'Pull-dominant upper', whyToday: 'Thursday lift continues uninterrupted.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core', duration: 40, when: 'Thursday PM · 40 min' }, stageTags: ['Build'] },
      { id: sid(3,4,1), week: 3, day: 4, kind: 'run', slotOfDay: 1, title: '7 km with 4 × 5 min threshold', purpose: 'Threshold volume builds', whyToday: 'Friday quality. One more threshold block than Week 2 — same pace, more time at it.', run: { distanceKm: 7, pace: '6:20–6:35/km', zone: 'threshold', hrCeiling: 176, thresholdBlock: '4 × 5 min (2 min jog)', notes: 'Easy warm-up, then 4 × 5 min threshold.' }, stageTags: ['Build'], keySession: true },
      { id: sid(3,5,1), week: 3, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (500 m) + easy 4 km + Strength C', purpose: 'Technique + plyo', whyToday: 'Saturday swim to 500 m. Easy 4 km run before Strength C.', swim: { distance: '500 m', drills: '4 × 25 m fingertip-drag · 4 × 25 m catch-up · 4 × 25 m free with pull buoy · 50 m backstroke', goal: 'Exhale fully underwater.', type: 'technique' }, stageTags: ['Build'] },
      { id: sid(3,5,2), week: 3, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy run 4 km', purpose: 'Shakeout', whyToday: 'Easy 4 km before Strength C.', run: { distanceKm: 4, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 4 km.' }, stageTags: ['Build'] },
      { id: sid(3,5,3), week: 3, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C', purpose: 'Plyo + durability', whyToday: 'Plyo on fresh legs.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 20, when: 'Saturday AM · 20 min' }, stageTags: ['Build'] },
      { id: sid(3,6,1), week: 3, day: 6, kind: 'run', slotOfDay: 1, title: 'Long run 17 km', purpose: 'Long run grows, first gel practice', whyToday: 'The long run. First gel at minute 45 — purely to practise swallowing it while moving. 9:1 from km 1.', run: { distanceKm: 17, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 158, runWalk91: true, notes: 'Long run, 9:1. First gel at min 45.' }, stageTags: ['Build'], keySession: true },
      { id: sid(3,6,2), week: 3, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush after long run.', swim: { distance: '350 m', drills: '4 × 50 m long-glide · 4 × 25 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Build'] },
    ],
  },

  // WEEK 4 — 7–13 Sep · DELOAD · 26 km · 13 km long
  {
    week: 4, dateRange: '7–13 Sep', startDate: '2026-09-07',
    stageTags: ['Deload'], volumeKm: 26, longRunKm: 13,
    focus: 'First deload. Volume drops, gym light, no quality. Bone remodels.',
    rationale: 'Bone remodels more slowly than muscle adapts. Fitness will feel ready for more before the tibia is. The deload exists for the bone, not the lungs.',
    sessions: [
      { id: sid(4,0,1), week: 4, day: 0, kind: 'rest', slotOfDay: 1, title: 'Rest', purpose: 'Full rest day', whyToday: 'Deload week opens with rest. Take it. Do not "make up" anything.', stageTags: ['Deload'] },
      { id: sid(4,1,1), week: 4, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A (light)', purpose: 'Halve sets, hold weights', whyToday: 'The taper rule: cut sets, never load. Half the sets at the same weight as Week 3.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance (light)', duration: 30, when: 'Tuesday PM · 30 min', taper: 'light' }, stageTags: ['Deload'] },
      { id: sid(4,2,1), week: 4, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 6 km (cadence +10)', purpose: 'Easy aerobic, push cadence', whyToday: 'Deload run — easy only. Add another 5 spm to cadence; you should be near 172–178 by now.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: 'baseline + 10', notes: 'Easy. Cadence +10.' }, stageTags: ['Deload'] },
      { id: sid(4,3,1), week: 4, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B (light)', purpose: 'Halve sets, hold weights', whyToday: 'Same rule — half sets, same weight.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core (light)', duration: 25, when: 'Thursday PM · 25 min', taper: 'light' }, stageTags: ['Deload'] },
      { id: sid(4,4,1), week: 4, day: 4, kind: 'run', slotOfDay: 1, title: 'Easy 5 km + 6 strides', purpose: 'Easy with light strides', whyToday: 'No quality in a deload — just easy plus strides to keep the legs snappy.', run: { distanceKm: 5, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, strides: '6 × 20 s', notes: 'Easy 5 km + 6 strides.' }, stageTags: ['Deload'] },
      { id: sid(4,5,1), week: 4, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (550 m) + easy 2 km + Strength C (half)', purpose: 'Light plyo', whyToday: 'Half the plyo volume in a deload. Still on grass, still quality over quantity.', swim: { distance: '550 m', drills: '4 × 25 m fingertip-drag · 4 × 25 m catch-up · 4 × 25 m free with pull buoy', goal: 'Exhale fully underwater.', type: 'technique' }, stageTags: ['Deload'] },
      { id: sid(4,5,2), week: 4, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy run 2 km', purpose: 'Shakeout', whyToday: 'Very short easy run before light Strength C.', run: { distanceKm: 2, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 2 km.' }, stageTags: ['Deload'] },
      { id: sid(4,5,3), week: 4, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C (half)', purpose: 'Half plyo volume', whyToday: 'Half volume, same quality. Grass only.', strength: { slot: 'C', name: 'Plyo · Durability (half)', duration: 12, when: 'Saturday AM · 12 min', taper: 'half' }, stageTags: ['Deload'] },
      { id: sid(4,6,1), week: 4, day: 6, kind: 'run', slotOfDay: 1, title: 'Easy 13 km', purpose: 'Easy long run, no MP work', whyToday: 'Long run stays in a deload but is purely easy — no MP blocks this week.', run: { distanceKm: 13, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, runWalk91: true, notes: 'Easy 13 km, no MP work.' }, stageTags: ['Deload'], keySession: true },
      { id: sid(4,6,2), week: 4, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush after long run.', swim: { distance: '350 m', drills: '4 × 50 m long-glide · 4 × 25 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Deload'] },
    ],
  },

  // WEEK 5 — 14–20 Sep · Build + HURDLE · 30 km · 10K race Saturday
  {
    week: 5, dateRange: '14–20 Sep', startDate: '2026-09-14',
    stageTags: ['Build', 'Hurdle'], volumeKm: 30, longRunKm: 10,
    focus: '10K race on Saturday 19 Sep. Sub-58:00 opens the 4:30 conversation.',
    rationale: 'The 10K is the early warning. Run it at 6:00–6:15/km, negative split, targeting 1:00:00–1:03:00 — hard and controlled, but not emptied out, because the half is eight days later.',
    sessions: [
      { id: sid(5,0,1), week: 5, day: 0, kind: 'run', slotOfDay: 1, title: 'Recovery 4 km', purpose: 'Easy blood flow', whyToday: 'Last easy jog before race week sharpening. Keep it short and slow.', run: { distanceKm: 4, pace: '8:30–9:15/km', zone: 'recovery', notes: 'Easy recovery.' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(5,1,1), week: 5, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A (halve sets, same weights)', purpose: 'Maintain load, reduce volume before race', whyToday: 'Halve the sets, hold the weights — the muscle-retention rule, applied before a race.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance (half sets)', duration: 30, when: 'Tuesday PM · 30 min', taper: 'half' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(5,2,1), week: 5, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 6 km', purpose: 'Easy aerobic, race-week-sharp', whyToday: 'Easy only. No threshold this week — the 10K is the hard effort.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 6 km.' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(5,3,1), week: 5, day: 3, kind: 'run', slotOfDay: 2, title: '4 km with 4 × 20 s strides', purpose: 'Sharpening strides', whyToday: 'Short run with light strides — keeps the legs snappy for Saturday without tiring them.', run: { distanceKm: 4, pace: '7:55–8:35/km', zone: 'easy', strides: '4 × 20 s', notes: '4 km + 4 × 20 s strides.' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(5,4,1), week: 5, day: 4, kind: 'rest', slotOfDay: 1, title: 'Rest + mobility', purpose: 'Full rest, light mobility', whyToday: 'Rest day before the 10K. Mobility only — hip flexors, calves, T-spine.', stageTags: ['Build', 'Hurdle'] },
      { id: sid(5,5,1), week: 5, day: 5, kind: 'race', slotOfDay: 1, title: '10K RACE — 19 Sep', purpose: 'Early-warning hurdle. Sub-58:00 = 4:30 in play', whyToday: 'Race day. 6:00–6:15/km, negative split. Target 1:00:00–1:03:00. Hard and controlled, but not emptied out — the half is eight days later. A sub-58:00 here is the first sign the 4:30 band is genuinely in play. Anything over 1:05 means the half target moves down a band before you start it.', run: { distanceKm: 10, pace: '6:00–6:15/km', zone: '10k', hrCeiling: 180, notes: 'Negative split. Target 1:00:00–1:03:00.' }, stageTags: ['Hurdle', 'Race'], keySession: true },
      { id: sid(5,6,1), week: 5, day: 6, kind: 'run', slotOfDay: 1, title: 'Very easy 8 km', purpose: 'Active recovery post-race', whyToday: 'Recovery jog the day after the 10K. Very easy — if the watch goes above 152, walk until it comes down.', run: { distanceKm: 8, pace: '8:30–9:15/km', zone: 'recovery', notes: 'Very easy 8 km post-race.' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(5,6,2), week: 5, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush after the 10K.', swim: { distance: '350 m', drills: '4 × 50 m long-glide · 4 × 25 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Build', 'Hurdle'] },
    ],
  },

  // WEEK 6 — 21–27 Sep · Build + HURDLE · 36 km · Half marathon Sunday
  {
    week: 6, dateRange: '21–27 Sep', startDate: '2026-09-21',
    stageTags: ['Build', 'Hurdle'], volumeKm: 36, longRunKm: 21,
    focus: 'WIPRO BENGALURU HALF — Sunday 27 Sep. The decision gate. Even pacing, 9:1, 50 g carbs/h.',
    rationale: 'The half is the gate. Run it honestly at half-effort, read the clock, take the band it gives you. Under 2:10 and 4:30 is live. This is the deal.',
    sessions: [
      { id: sid(6,0,1), week: 6, day: 0, kind: 'walk', slotOfDay: 1, title: 'Rest or 20 min walk', purpose: 'Pre-race taper begins', whyToday: 'Either full rest or a 20-min walk. Race week sharpening starts here.', stageTags: ['Build', 'Hurdle'] },
      { id: sid(6,1,1), week: 6, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength B only (light)', purpose: 'Maintain pull strength, skip heavy legs', whyToday: 'Only Strength B this week — pull-dominant, light. Skip Strength A so the legs are fresh for Sunday.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core (light)', duration: 25, when: 'Tuesday PM · 25 min', taper: 'light' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(6,2,1), week: 6, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 7 km', purpose: 'Easy aerobic', whyToday: 'Easy run midweek. Keep the legs moving without tiring them.', run: { distanceKm: 7, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 7 km.' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(6,3,1), week: 6, day: 3, kind: 'run', slotOfDay: 2, title: '5 km + 4 strides', purpose: 'Sharpening strides', whyToday: 'Short with strides to keep legs snappy for Sunday.', run: { distanceKm: 5, pace: '7:55–8:35/km', zone: 'easy', strides: '4 × 20 s', notes: '5 km + 4 strides.' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(6,4,1), week: 6, day: 4, kind: 'rest', slotOfDay: 1, title: 'Rest', purpose: 'Full rest', whyToday: 'Rest two days out from the half.', stageTags: ['Build', 'Hurdle'] },
      { id: sid(6,5,1), week: 6, day: 5, kind: 'run', slotOfDay: 1, title: '3 km shakeout, bib collection', purpose: 'Pre-race shakeout', whyToday: 'Very short shakeout. Bib collection, early night. Carb-load begins properly.', run: { distanceKm: 3, pace: '8:00–8:30/km', zone: 'easy', notes: '3 km shakeout. Bib collection. Early night.' }, stageTags: ['Build', 'Hurdle'] },
      { id: sid(6,6,1), week: 6, day: 6, kind: 'race', slotOfDay: 1, title: 'WIPRO BENGALURU HALF — 27 Sep', purpose: 'The decision gate. Even pacing, 9:1, 50 g carbs/h', whyToday: 'THE GATE. Run it honestly at half-effort. Even pacing, 9:1 from km 1, 50 g carbs per hour. The clock at the finish tells you what marathon band is genuinely available. Sub-2:10 = 4:30 is live. This is not pessimism about your ceiling — it is a refusal to set a pace in August that the body has not yet agreed to in September.', run: { distanceKm: 21.1, pace: '6:35–6:50/km', zone: 'half', hrCeiling: 171, runWalk91: true, carbsPerHour: '50 g/h', notes: 'Even pacing, 9:1, 50 g carbs/h. Read the clock at the finish.' }, stageTags: ['Hurdle', 'Race'], keySession: true },
    ],
  },

  // WEEK 7 — 28 Sep–4 Oct · RECOVERY · 30 km · 14 km long
  {
    week: 7, dateRange: '28 Sep–4 Oct', startDate: '2026-09-28',
    stageTags: ['Recovery'], volumeKm: 30, longRunKm: 14,
    focus: 'Recovery week. SET THE MARATHON BAND. CALF-RAISE GATE CHECK.',
    rationale: 'Let the half absorb. Easy everything. Set the marathon band from the half result. Run the calf-raise capacity gate — 25 single-leg raises to full height each side, max 2-rep difference.',
    sessions: [
      { id: sid(7,0,1), week: 7, day: 0, kind: 'rest', slotOfDay: 1, title: 'Full rest', purpose: 'Post-half recovery', whyToday: 'Full rest the day after the half. Do not run. The race does its work during recovery, not during the race.', stageTags: ['Recovery'] },
      { id: sid(7,1,1), week: 7, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A (light)', purpose: 'Return to lifting, light', whyToday: 'First lift after the half — light. The gym schedule never stops.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance (light)', duration: 30, when: 'Tuesday PM · 30 min', taper: 'light' }, stageTags: ['Recovery'] },
      { id: sid(7,2,1), week: 7, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 6 km', purpose: 'Easy aerobic', whyToday: 'Easy return to running. If anything is sore from the half, swap for 35 min cross-trainer.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 6 km. Cross-trainer swap if sore.' }, stageTags: ['Recovery'] },
      { id: sid(7,3,1), week: 7, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B', purpose: 'Pull-dominant upper', whyToday: 'Normal Strength B. Loads held.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core', duration: 40, when: 'Thursday PM · 40 min' }, stageTags: ['Recovery'] },
      { id: sid(7,4,1), week: 7, day: 4, kind: 'run', slotOfDay: 1, title: 'Easy 6 km', purpose: 'Easy aerobic', whyToday: 'Easy Friday. No quality this week — let the half absorb.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 6 km.' }, stageTags: ['Recovery'] },
      { id: sid(7,5,1), week: 7, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (600 m) + easy 4 km + Strength C', purpose: 'Technique + plyo', whyToday: 'Swim grows to 600 m. Normal plyo — the recovery week does not stop plyo, only running quality.', swim: { distance: '600 m', drills: '4 × 25 m single-arm · 6 × 50 m steady with buoy', goal: '100 m continuous, comfortably.', type: 'technique' }, stageTags: ['Recovery'] },
      { id: sid(7,5,2), week: 7, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy 4 km', purpose: 'Shakeout', whyToday: 'Easy before Strength C.', run: { distanceKm: 4, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 4 km.' }, stageTags: ['Recovery'] },
      { id: sid(7,5,3), week: 7, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C', purpose: 'Plyo + durability', whyToday: 'Normal Strength C on fresh legs.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 20, when: 'Saturday AM · 20 min' }, stageTags: ['Recovery'] },
      { id: sid(7,6,1), week: 7, day: 6, kind: 'run', slotOfDay: 1, title: 'Easy 14 km', purpose: 'Easy long run', whyToday: 'Easy long run, no MP work. CALF-RAISE GATE CHECK today: 25 single-leg raises to full height each side, max 2-rep difference. If you cannot, hold running volume flat until you can.', run: { distanceKm: 14, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, runWalk91: true, notes: 'Easy 14 km. Calf-raise gate check today.' }, stageTags: ['Recovery'], keySession: true },
      { id: sid(7,6,2), week: 7, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush.', swim: { distance: '350 m', drills: '3 × 100 m very easy · 4 × 50 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Recovery'] },
    ],
  },

  // WEEK 8 — 5–11 Oct · Build · 38 km · 19 km long · MONDAY BECOMES A WALK
  {
    week: 8, dateRange: '5–11 Oct', startDate: '2026-10-05',
    stageTags: ['Build'], volumeKm: 38, longRunKm: 19,
    focus: 'First week at four impact days. Monday is now a walk, not a run.',
    rationale: 'From Week 8, Monday\'s recovery jog is replaced by a 30-min walk plus mobility. With no bike available until January, the way to remove impact from the highest-risk phase is simply to stop running on Mondays once volume passes 38 km. Four impact days at peak, not five.',
    sessions: [
      { id: sid(8,0,1), week: 8, day: 0, kind: 'walk', slotOfDay: 1, title: 'WALK 30 min + mobility — no run', purpose: 'Bone remodelling day, not a run', whyToday: 'This is the most important change in the plan. Monday is no longer a run. With no bike available until January, removing one landing session per week from the highest-risk phase costs almost nothing aerobically and buys a great deal of tibial recovery.', stageTags: ['Build'] },
      { id: sid(8,1,1), week: 8, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A', purpose: 'Heavy leg day', whyToday: 'Normal Strength A. Loads held.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance', duration: 45, when: 'Tuesday PM · 45 min' }, stageTags: ['Build'] },
      { id: sid(8,2,1), week: 8, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 9 km', purpose: 'Aerobic volume grows', whyToday: 'Wednesday easy grows to 9 km. Cadence 172–178 at all paces now.', run: { distanceKm: 9, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: '172–178', notes: 'Easy 9 km. Cadence 172–178.' }, stageTags: ['Build'] },
      { id: sid(8,3,1), week: 8, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B', purpose: 'Pull-dominant upper', whyToday: 'Normal Strength B.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core', duration: 40, when: 'Thursday PM · 40 min' }, stageTags: ['Build'] },
      { id: sid(8,4,1), week: 8, day: 4, kind: 'run', slotOfDay: 1, title: '8 km with 2 × 10 min threshold', purpose: 'Threshold blocks extend', whyToday: 'Friday quality. Threshold blocks extend from 5 min to 10 min — same pace, longer time at it.', run: { distanceKm: 8, pace: '6:20–6:35/km', zone: 'threshold', hrCeiling: 176, thresholdBlock: '2 × 10 min (2 min jog)', notes: 'Easy warm-up, then 2 × 10 min threshold.' }, stageTags: ['Build'], keySession: true },
      { id: sid(8,5,1), week: 8, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (650 m) + easy 5 km + Strength C (reduced plyo)', purpose: 'Technique + reduced plyo', whyToday: 'Plyo volume starts tapering as running climbs. Still quality, fewer reps.', swim: { distance: '650 m', drills: '4 × 25 m single-arm · 6 × 50 m steady with buoy · 4 × 25 m kickboard', goal: '100 m continuous, comfortably.', type: 'technique' }, stageTags: ['Build'] },
      { id: sid(8,5,2), week: 8, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy 5 km', purpose: 'Shakeout', whyToday: 'Easy before Strength C.', run: { distanceKm: 5, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 5 km.' }, stageTags: ['Build'] },
      { id: sid(8,5,3), week: 8, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C (reduced plyo)', purpose: 'Plyo volume tapering', whyToday: 'Plyo volume drops as running climbs. Same quality, fewer reps.', strength: { slot: 'C', name: 'Plyo · Durability (reduced)', duration: 18, when: 'Saturday AM · 18 min', taper: 'half' }, stageTags: ['Build'] },
      { id: sid(8,6,1), week: 8, day: 6, kind: 'run', slotOfDay: 1, title: 'Long run 19 km, last 4 km at MP', purpose: 'First MP block inside a long run', whyToday: 'First taste of marathon pace inside a long run. Last 4 km at MP — rehearsal for race day. 40 g carbs/h. 9:1 from km 1.', run: { distanceKm: 19, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 165, runWalk91: true, carbsPerHour: '40 g/h', mpBlock: { distanceKm: 4, pace: 'MP (set on 27 Sep)', carbsPerHour: '40 g/h' }, notes: 'Long run, 9:1, last 4 km at MP. 40 g carbs/h.' }, stageTags: ['Build'], keySession: true },
      { id: sid(8,6,2), week: 8, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush.', swim: { distance: '400 m', drills: '3 × 100 m very easy · 4 × 50 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Build'] },
    ],
  },

  // WEEK 9 — 12–18 Oct · Build · 44 km · 23 km long
  {
    week: 9, dateRange: '12–18 Oct', startDate: '2026-10-12',
    stageTags: ['Build'], volumeKm: 44, longRunKm: 23,
    focus: 'Volume to 44 km. Long run to 23 km on dirt, last 5 km at MP. Race socks tested.',
    rationale: 'October climb. Long run grows and adds more MP work. Test the exact race socks — compression, knee-high, run in before race day.',
    sessions: [
      { id: sid(9,0,1), week: 9, day: 0, kind: 'walk', slotOfDay: 1, title: 'WALK + mobility', purpose: 'No run — bone remodelling', whyToday: 'Monday walk continues. No fifth run.', stageTags: ['Build'] },
      { id: sid(9,1,1), week: 9, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A', purpose: 'Heavy leg day', whyToday: 'Loads held. Three sessions a week, every week.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance', duration: 45, when: 'Tuesday PM · 45 min' }, stageTags: ['Build'] },
      { id: sid(9,2,1), week: 9, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 10 km', purpose: 'Aerobic volume', whyToday: 'Wednesday easy grows to 10 km. Cadence 172–178.', run: { distanceKm: 10, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: '172–178', notes: 'Easy 10 km.' }, stageTags: ['Build'] },
      { id: sid(9,3,1), week: 9, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B', purpose: 'Pull-dominant upper', whyToday: 'Normal Strength B.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core', duration: 40, when: 'Thursday PM · 40 min' }, stageTags: ['Build'] },
      { id: sid(9,4,1), week: 9, day: 4, kind: 'run', slotOfDay: 1, title: '8 km with 3 × 10 min half-marathon effort', purpose: 'Long threshold blocks', whyToday: 'Friday quality. Three 10-min blocks at half-marathon effort — the longest threshold work of the block. 50 g carbs/h.', run: { distanceKm: 8, pace: '6:35–6:50/km', zone: 'half', hrCeiling: 171, thresholdBlock: '3 × 10 min (2 min jog)', carbsPerHour: '50 g/h', notes: '3 × 10 min at half-effort. 50 g carbs/h.' }, stageTags: ['Build'], keySession: true },
      { id: sid(9,5,1), week: 9, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (700 m) + easy 5 km + Strength C', purpose: 'Technique + plyo', whyToday: 'Swim to 700 m. Plyo reduced volume.', swim: { distance: '700 m', drills: '4 × 25 m single-arm · 6 × 50 m steady with buoy · 4 × 25 m kickboard build', goal: '100 m continuous, comfortably.', type: 'technique' }, stageTags: ['Build'] },
      { id: sid(9,5,2), week: 9, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy 5 km', purpose: 'Shakeout', whyToday: 'Easy before Strength C.', run: { distanceKm: 5, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 5 km.' }, stageTags: ['Build'] },
      { id: sid(9,5,3), week: 9, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C', purpose: 'Plyo + durability', whyToday: 'Reduced plyo volume.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 18, when: 'Saturday AM · 18 min', taper: 'half' }, stageTags: ['Build'] },
      { id: sid(9,6,1), week: 9, day: 6, kind: 'run', slotOfDay: 1, title: 'Long run 23 km on dirt, last 5 km at MP', purpose: 'Long run on softer surface, MP rehearsal', whyToday: 'Long run on dirt — softer surface protects the tibia in the high-volume phase. Last 5 km at MP. 50 g carbs/h. RACE SOCKS tested today — same compression socks you will wear on 22 Nov.', run: { distanceKm: 23, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 165, runWalk91: true, carbsPerHour: '50 g/h', mpBlock: { distanceKm: 5, pace: 'MP (set on 27 Sep)', carbsPerHour: '50 g/h' }, notes: 'Dirt. 9:1. Last 5 km at MP. 50 g carbs/h. Race socks.' }, stageTags: ['Build'], keySession: true },
      { id: sid(9,6,2), week: 9, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush.', swim: { distance: '400 m', drills: '3 × 100 m very easy · 4 × 50 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Build'] },
    ],
  },

  // WEEK 10 — 19–25 Oct · DELOAD · 40 km · 26 km long
  {
    week: 10, dateRange: '19–25 Oct', startDate: '2026-10-19',
    stageTags: ['Deload'], volumeKm: 40, longRunKm: 26,
    focus: 'Deload midweek but long run grows. 55 g carbs/h. Cut hard so the long run can grow.',
    rationale: 'Midweek cut hard so the Sunday long run can grow even in a deload. Long run stays steady — no MP work this week.',
    sessions: [
      { id: sid(10,0,1), week: 10, day: 0, kind: 'walk', slotOfDay: 1, title: 'WALK + mobility', purpose: 'No run', whyToday: 'Monday walk.', stageTags: ['Deload'] },
      { id: sid(10,1,1), week: 10, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A (light)', purpose: 'Halve sets, hold weights', whyToday: 'Deload rule — half sets, same weight.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance (light)', duration: 30, when: 'Tuesday PM · 30 min', taper: 'light' }, stageTags: ['Deload'] },
      { id: sid(10,2,1), week: 10, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 6 km', purpose: 'Easy aerobic', whyToday: 'Short and easy midweek — the cut is here so the long run can grow.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 6 km.' }, stageTags: ['Deload'] },
      { id: sid(10,3,1), week: 10, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B (light)', purpose: 'Halve sets, hold weights', whyToday: 'Half sets, same weight.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core (light)', duration: 25, when: 'Thursday PM · 25 min', taper: 'light' }, stageTags: ['Deload'] },
      { id: sid(10,4,1), week: 10, day: 4, kind: 'run', slotOfDay: 1, title: 'Easy 5 km + strides', purpose: 'Easy with light strides', whyToday: 'No quality in a deload — just easy plus strides.', run: { distanceKm: 5, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, strides: '6 × 20 s', notes: 'Easy 5 km + 6 strides.' }, stageTags: ['Deload'] },
      { id: sid(10,5,1), week: 10, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (750 m) + easy 3 km + Strength C', purpose: 'Technique + light plyo', whyToday: 'Light plyo in deload.', swim: { distance: '750 m', drills: '4 × 25 m single-arm · 6 × 50 m steady with buoy', goal: '100 m continuous, comfortably.', type: 'technique' }, stageTags: ['Deload'] },
      { id: sid(10,5,2), week: 10, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy 3 km', purpose: 'Shakeout', whyToday: 'Short and easy before light Strength C.', run: { distanceKm: 3, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 3 km.' }, stageTags: ['Deload'] },
      { id: sid(10,5,3), week: 10, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C', purpose: 'Light plyo', whyToday: 'Light plyo, grass only.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 15, when: 'Saturday AM · 15 min', taper: 'half' }, stageTags: ['Deload'] },
      { id: sid(10,6,1), week: 10, day: 6, kind: 'run', slotOfDay: 1, title: 'Long run 26 km steady', purpose: 'Long run grows even in deload', whyToday: 'Long run grows even in a deload — but steady only, no MP work. 55 g carbs/h. The midweek cut bought this.', run: { distanceKm: 26, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 158, runWalk91: true, carbsPerHour: '55 g/h', notes: '26 km steady, no MP. 55 g carbs/h.' }, stageTags: ['Deload'], keySession: true },
      { id: sid(10,6,2), week: 10, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush.', swim: { distance: '400 m', drills: '3 × 100 m very easy · 4 × 50 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Deload'] },
    ],
  },

  // WEEK 11 — 26 Oct–1 Nov · PEAK · 50 km · 30 km long
  {
    week: 11, dateRange: '26 Oct–1 Nov', startDate: '2026-10-26',
    stageTags: ['Peak'], volumeKm: 50, longRunKm: 30,
    focus: 'PEAK WEEK. 50 km, four impact days, 30 km long run with last 6 km at MP. Full race kit.',
    rationale: 'Peak is 50 km with four impact days. The 30 km run sits three weeks out, not two — at this pace it takes about three and a half hours, and two weeks does not absorb it. Full race kit on the long run: shoes, socks, gels, everything.',
    sessions: [
      { id: sid(11,0,1), week: 11, day: 0, kind: 'walk', slotOfDay: 1, title: 'WALK + mobility', purpose: 'No run — protect the tibia at peak', whyToday: 'Monday walk in peak week — the fifth run is the thing that gets cut to protect the tibia during the October climb.', stageTags: ['Peak'] },
      { id: sid(11,1,1), week: 11, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A', purpose: 'Heavy leg day — loads held at peak', whyToday: 'Loads held even at peak volume. Three sessions a week, every week — that is the muscle-retention mechanism.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance', duration: 45, when: 'Tuesday PM · 45 min' }, stageTags: ['Peak'] },
      { id: sid(11,2,1), week: 11, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 10 km', purpose: 'Aerobic volume at peak', whyToday: 'Wednesday easy at peak volume. Cadence 172–178.', run: { distanceKm: 10, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: '172–178', notes: 'Easy 10 km.' }, stageTags: ['Peak'] },
      { id: sid(11,3,1), week: 11, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B', purpose: 'Pull-dominant upper', whyToday: 'Loads held.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core', duration: 40, when: 'Thursday PM · 40 min' }, stageTags: ['Peak'] },
      { id: sid(11,4,1), week: 11, day: 4, kind: 'run', slotOfDay: 1, title: 'Easy 6 km + strides (no quality)', purpose: 'Easy — the long run is the session', whyToday: 'No Friday quality in peak week — the long run is the session this week. Just easy plus strides.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, strides: '6 × 20 s', notes: 'Easy 6 km + strides. No quality.' }, stageTags: ['Peak'] },
      { id: sid(11,5,1), week: 11, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (800 m) + easy 4 km + Strength C', purpose: 'Technique + light plyo', whyToday: 'Swim to 800 m. Plyo reduced — the long run is the priority.', swim: { distance: '800 m', drills: '3 × 100 m continuous easy · 4 × 50 m high-elbow catch drill', goal: '200 m continuous by race week.', type: 'technique' }, stageTags: ['Peak'] },
      { id: sid(11,5,2), week: 11, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy 4 km', purpose: 'Shakeout', whyToday: 'Easy 4 km before Strength C.', run: { distanceKm: 4, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 4 km.' }, stageTags: ['Peak'] },
      { id: sid(11,5,3), week: 11, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C', purpose: 'Plyo + durability', whyToday: 'Reduced plyo — long run is the session.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 15, when: 'Saturday AM · 15 min', taper: 'half' }, stageTags: ['Peak'] },
      { id: sid(11,6,1), week: 11, day: 6, kind: 'run', slotOfDay: 1, title: 'SUN 1 NOV — 30 K, last 6 km at MP', purpose: 'Peak long run — three weeks out', whyToday: 'THE PEAK. 30 km, last 6 km at MP, full race kit on (shoes, socks, gels, breakfast — everything you will wear and eat on 22 Nov). 60 g carbs/h. This is the rehearsal. 9:1 from km 1.', run: { distanceKm: 30, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 165, runWalk91: true, carbsPerHour: '60 g/h', mpBlock: { distanceKm: 6, pace: 'MP (set on 27 Sep)', carbsPerHour: '60 g/h' }, notes: '30 km, 9:1, last 6 km at MP. Full race kit. 60 g carbs/h.' }, stageTags: ['Peak'], keySession: true },
      { id: sid(11,6,2), week: 11, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush after the peak long run.', swim: { distance: '400 m', drills: '3 × 100 m very easy · 4 × 50 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Peak'] },
    ],
  },

  // WEEK 12 — 2–8 Nov · Build (post-peak) · 46 km · 24 km dress rehearsal
  {
    week: 12, dateRange: '2–8 Nov', startDate: '2026-11-02',
    stageTags: ['Build'], volumeKm: 46, longRunKm: 24,
    focus: 'Dress rehearsal long run: 14 km at MP, exact race kit and fuel. 65 g carbs/h — race rate.',
    rationale: 'Dress rehearsal week. Long run shorter than peak but with the longest MP block — 14 km at MP, exact race kit and fuel, 65 g carbs/h (race rate). This is the last hard session before the taper. Nothing new after this week — shoes, socks, gels, breakfast all frozen.',
    sessions: [
      { id: sid(12,0,1), week: 12, day: 0, kind: 'walk', slotOfDay: 1, title: 'WALK + mobility', purpose: 'No run', whyToday: 'Monday walk.', stageTags: ['Build'] },
      { id: sid(12,1,1), week: 12, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A (60% sets, same weights)', purpose: 'Taper begins — 60% sets, loads held', whyToday: 'Taper rule starts: 60% of the sets at the same weight. Sets come down; load does not.', strength: { slot: 'A', name: 'Warm-up · Main lifts · Shin insurance (60%)', duration: 30, when: 'Tuesday PM · 30 min', taper: 'half' }, stageTags: ['Build'] },
      { id: sid(12,2,1), week: 12, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 9 km', purpose: 'Aerobic volume', whyToday: 'Easy 9 km midweek.', run: { distanceKm: 9, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, cadence: '172–178', notes: 'Easy 9 km.' }, stageTags: ['Build'] },
      { id: sid(12,3,1), week: 12, day: 3, kind: 'strength', slotOfDay: 2, title: 'Strength B (60%)', purpose: '60% sets, loads held', whyToday: '60% sets, same weight.', strength: { slot: 'B', name: 'Warm-up · Main lifts · Arms · Core (60%)', duration: 25, when: 'Thursday PM · 25 min', taper: 'half' }, stageTags: ['Build'] },
      { id: sid(12,4,1), week: 12, day: 4, kind: 'run', slotOfDay: 1, title: '9 km with 3 × 12 min at MP', purpose: 'Long MP blocks — rehearsal', whyToday: 'Friday quality. Three 12-min blocks at MP — rehearsal for race-day effort. The last hard quality before the taper.', run: { distanceKm: 9, pace: 'MP (set on 27 Sep)', zone: 'mp', hrCeiling: 165, thresholdBlock: '3 × 12 min at MP (2 min jog)', notes: '3 × 12 min at MP. Last hard quality before taper.' }, stageTags: ['Build'], keySession: true },
      { id: sid(12,5,1), week: 12, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (800 m) + easy 4 km + Strength C', purpose: 'Technique + light plyo', whyToday: 'Swim 800 m. Light plyo.', swim: { distance: '800 m', drills: '3 × 100 m continuous easy · 4 × 50 m high-elbow catch drill', goal: '200 m continuous by race week.', type: 'technique' }, stageTags: ['Build'] },
      { id: sid(12,5,2), week: 12, day: 5, kind: 'run', slotOfDay: 1, title: 'Easy 4 km', purpose: 'Shakeout', whyToday: 'Easy 4 km before Strength C.', run: { distanceKm: 4, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 4 km.' }, stageTags: ['Build'] },
      { id: sid(12,5,3), week: 12, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C', purpose: 'Plyo + durability', whyToday: 'Light plyo.', strength: { slot: 'C', name: 'Plyo · Durability', duration: 15, when: 'Saturday AM · 15 min', taper: 'half' }, stageTags: ['Build'] },
      { id: sid(12,6,1), week: 12, day: 6, kind: 'run', slotOfDay: 1, title: '24 km dress rehearsal — 14 km at MP', purpose: 'The rehearsal — exact race kit and fuel', whyToday: 'DRESS REHEARSAL. 14 km at MP inside a 24 km long run. Exact race kit and fuel. 65 g carbs/h — race rate. This is the last chance to test everything. Nothing new after today: shoes, socks, gels, breakfast all frozen from this point.', run: { distanceKm: 24, pace: '7:35–8:05/km', zone: 'steady', hrCeiling: 165, runWalk91: true, carbsPerHour: '65 g/h', mpBlock: { distanceKm: 14, pace: 'MP (set on 27 Sep)', carbsPerHour: '65 g/h' }, notes: '24 km, 9:1, 14 km at MP. Exact race kit and fuel. 65 g carbs/h. NOTHING NEW AFTER TODAY.' }, stageTags: ['Build'], keySession: true },
      { id: sid(12,6,2), week: 12, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush.', swim: { distance: '400 m', drills: '3 × 100 m long, relaxed · 4 × 50 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Build'] },
    ],
  },

  // WEEK 13 — 9–15 Nov · TAPER · 32 km · 16 km long
  {
    week: 13, dateRange: '9–15 Nov', startDate: '2026-11-09',
    stageTags: ['Taper'], volumeKm: 32, longRunKm: 16,
    focus: 'Taper begins. Volume drops sharply. Gym 60% sets combined.',
    rationale: 'Volume comes down so you arrive at race day with fitness stored and fatigue shed. You cannot gain fitness now — only lose it. Restlessness is normal.',
    sessions: [
      { id: sid(13,0,1), week: 13, day: 0, kind: 'rest', slotOfDay: 1, title: 'Rest', purpose: 'Taper rest', whyToday: 'Taper opens with rest. The urge to do more will be strong — resist it.', stageTags: ['Taper'] },
      { id: sid(13,1,1), week: 13, day: 1, kind: 'strength', slotOfDay: 2, title: 'Strength A + B combined, 60% sets', purpose: 'Combined session, loads held', whyToday: 'A and B combined into one 60%-set session. Loads held — sets come down, load does not.', strength: { slot: 'A', name: 'Warm-up · Main lifts combined (60%)', duration: 40, when: 'Tuesday PM · 40 min', taper: 'combined' }, stageTags: ['Taper'] },
      { id: sid(13,2,1), week: 13, day: 2, kind: 'run', slotOfDay: 2, title: 'Easy 6 km', purpose: 'Easy aerobic', whyToday: 'Easy and short. Taper is happening.', run: { distanceKm: 6, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 6 km.' }, stageTags: ['Taper'] },
      { id: sid(13,3,1), week: 13, day: 3, kind: 'run', slotOfDay: 2, title: '6 km with 3 km at MP', purpose: 'Light MP touch', whyToday: 'Light MP touch — just enough to keep the rhythm. 3 km at MP inside an easy 6 km.', run: { distanceKm: 6, pace: 'MP (set on 27 Sep)', zone: 'mp', hrCeiling: 165, mpBlock: { distanceKm: 3, pace: 'MP (set on 27 Sep)', carbsPerHour: 'water only' }, notes: 'Easy 6 km with 3 km at MP.' }, stageTags: ['Taper'] },
      { id: sid(13,4,1), week: 13, day: 4, kind: 'rest', slotOfDay: 1, title: 'Rest', purpose: 'Taper rest', whyToday: 'Rest. Carb loading begins properly from here.', stageTags: ['Taper'] },
      { id: sid(13,5,1), week: 13, day: 5, kind: 'swim', slotOfDay: 1, title: 'Swim 1 (700 m) + 4 km shakeout + Strength C (minimal)', purpose: 'Light shakeout, minimal plyo', whyToday: 'Minimal Strength C — keep the routine, drop the volume.', swim: { distance: '700 m', drills: '3 × 100 m continuous easy · 4 × 50 m high-elbow catch drill', goal: '200 m continuous by race week.', type: 'technique' }, stageTags: ['Taper'] },
      { id: sid(13,5,2), week: 13, day: 5, kind: 'run', slotOfDay: 1, title: '4 km shakeout', purpose: 'Pre-race-week shakeout', whyToday: 'Short, easy, snappy. Just to turn the legs over.', run: { distanceKm: 4, pace: '8:00–8:30/km', zone: 'easy', hrCeiling: 152, notes: 'Easy 4 km shakeout.' }, stageTags: ['Taper'] },
      { id: sid(13,5,3), week: 13, day: 5, kind: 'strength', slotOfDay: 1, title: 'Strength C (minimal)', purpose: 'Minimal plyo', whyToday: 'Minimal plyo — keep the routine, drop the volume.', strength: { slot: 'C', name: 'Plyo · Durability (minimal)', duration: 10, when: 'Saturday AM · 10 min', taper: 'half' }, stageTags: ['Taper'] },
      { id: sid(13,6,1), week: 13, day: 6, kind: 'run', slotOfDay: 1, title: 'Easy 16 km', purpose: 'Easy long run, taper volume', whyToday: 'Easy long run in taper — no MP, just easy. Volume dropping fast now.', run: { distanceKm: 16, pace: '7:55–8:35/km', zone: 'easy', hrCeiling: 152, runWalk91: true, notes: 'Easy 16 km, no MP.' }, stageTags: ['Taper'], keySession: true },
      { id: sid(13,6,2), week: 13, day: 6, kind: 'swim', slotOfDay: 2, title: 'Swim 2 (flush)', purpose: 'Recovery', whyToday: 'Easy flush.', swim: { distance: '350 m', drills: '3 × 100 m long, relaxed · 4 × 50 m backstroke', goal: 'Easy flush.', type: 'flush' }, stageTags: ['Taper'] },
    ],
  },

  // WEEK 14 — 16–22 Nov · RACE · 12 km + 42.2 km · Kaveri Trail Marathon Sunday
  {
    week: 14, dateRange: '16–22 Nov', startDate: '2026-11-16',
    stageTags: ['Race', 'Taper'], volumeKm: 12, longRunKm: 42,
    focus: 'RACE WEEK. Kaveri Trail Marathon — Sunday 22 Nov, 6:15 a.m., 6-hour cutoff.',
    rationale: 'Race week. Volume minimal. Tuesday gym is the only strength — 20 min, two sets of the main lifts at normal weight, nothing to failure. Travel to Srirangapatna Saturday, not race morning. Carb load Thu–Sat. Nothing new. Read the pacing band on the start line.',
    sessions: [
      { id: sid(14,0,1), week: 14, day: 0, kind: 'rest', slotOfDay: 1, title: 'Rest', purpose: 'Race week rest', whyToday: 'Race week opens with rest. Carb loading starts Thursday.', stageTags: ['Taper', 'Race'] },
      { id: sid(14,1,1), week: 14, day: 1, kind: 'strength', slotOfDay: 2, title: 'Gym: 20 min, 2 sets main lifts, normal weight', purpose: 'Maintain muscle, nothing to failure', whyToday: 'The only strength session of race week. 20 minutes, two sets of the main lifts at normal weight, nothing to failure. The gym schedule is not interrupted even in race week — that is the muscle-retention rule.', strength: { slot: 'A', name: 'Race-week gym — 2 sets main lifts, normal weight', duration: 20, when: 'Tuesday PM · 20 min', taper: 'race-week' }, stageTags: ['Taper', 'Race'] },
      { id: sid(14,1,2), week: 14, day: 1, kind: 'run', slotOfDay: 1, title: 'Easy 5 km + 4 strides', purpose: 'Light leg turnover', whyToday: 'Short and easy with strides. Just enough to keep the legs snappy.', run: { distanceKm: 5, pace: '8:00–8:30/km', zone: 'easy', strides: '4 × 20 s', notes: 'Easy 5 km + 4 strides.' }, stageTags: ['Taper', 'Race'] },
      { id: sid(14,2,1), week: 14, day: 2, kind: 'mobility', slotOfDay: 1, title: '20 min mobility', purpose: 'Keep loose, no running', whyToday: 'Mobility only — hip flexors, calves, T-spine. No running today.', stageTags: ['Taper', 'Race'] },
      { id: sid(14,3,1), week: 14, day: 3, kind: 'run', slotOfDay: 1, title: '5 km with 1 km at MP', purpose: 'Light MP touch', whyToday: 'Last MP touch — 1 km at race pace inside an easy 5 km. Carb load in full swing.', run: { distanceKm: 5, pace: 'MP (set on 27 Sep)', zone: 'mp', hrCeiling: 165, mpBlock: { distanceKm: 1, pace: 'MP (set on 27 Sep)', carbsPerHour: 'water only' }, notes: 'Easy 5 km with 1 km at MP.' }, stageTags: ['Taper', 'Race'] },
      { id: sid(14,4,1), week: 14, day: 4, kind: 'rest', slotOfDay: 1, title: 'Rest, travel prep, carb load', purpose: 'Rest and fuel', whyToday: 'Rest. Travel prep. Carb load in full swing — 525–675 g carb/day Thu–Sat.', stageTags: ['Taper', 'Race'] },
      { id: sid(14,5,1), week: 14, day: 5, kind: 'run', slotOfDay: 1, title: 'Travel to Srirangapatna, 2 km shakeout', purpose: 'Pre-race shakeout at race location', whyToday: 'Travel Saturday, not race morning — a 6:15 a.m. start from Bengaluru means a 2 a.m. departure otherwise. 2 km shakeout on arrival. Feet up by 9 p.m. Dinner familiar, low fibre, eaten early. No experiments.', run: { distanceKm: 2, pace: '8:00–8:30/km', zone: 'easy', notes: '2 km shakeout on arrival. Feet up by 9 p.m.' }, stageTags: ['Taper', 'Race'] },
      { id: sid(14,6,1), week: 14, day: 6, kind: 'race', slotOfDay: 1, title: 'SUN 22 NOV, 6:15 a.m. — KAVERI TRAIL MARATHON', purpose: 'The goal. 42.2 km. 6:15 a.m. start, 6-hour cutoff.', whyToday: 'RACE DAY. 42.2 km on the Kaveri canal bund. 6:15 a.m. start, 6-hour cutoff. Alarm 3:00 a.m. for breakfast (90–110 g carb — idli/upma/toast + banana + honey + 500 ml). 5:45 a.m. one gel + 200 ml. Compression socks on before leaving the room. 9:1 from km 1 — set the interval alarm and obey it. Read the pacing band. Hold the discipline. This is what the whole fourteen weeks was for.', run: { distanceKm: 42.2, pace: '6:24/km average (band set on 27 Sep)', zone: 'raceMarathon', runWalk91: true, carbsPerHour: '65 g/h — race rate', notes: '6:15 a.m. start. 9:1 from km 1. Read the pacing band. Hold discipline.' }, stageTags: ['Race'], keySession: true },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// DECISION GATE — 27 Sep half → marathon band — from PDF Section 02
// ─────────────────────────────────────────────────────────────────────────────

// Helper to convert "M:SS" or "H:MM:SS" to seconds
export const timeToSeconds = (t: string): number => {
  const parts = t.split(':').map((p) => parseInt(p, 10))
  if (parts.some(isNaN)) return NaN
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return NaN
}

export const GATE_BANDS: GateBand[] = [
  { halfRange: 'Under 2:10', marathonBand: '4:30 — target live', runPace: '6:10–6:15/km',
    october: 'The stated goal is on. Peak stays 50 km, but every marathon-pace block runs at 6:12/km and the Week 12 rehearsal extends to 16 km at pace.',
    minSeconds: 0, maxSeconds: 2 * 3600 + 10 * 60 },
  { halfRange: '2:10 – 2:20', marathonBand: '4:45 – 4:55', runPace: '6:35–6:45/km',
    october: 'Add one extra marathon-pace block to the Week 12 long run. Everything else as written.',
    minSeconds: 2 * 3600 + 10 * 60, maxSeconds: 2 * 3600 + 20 * 60 },
  { halfRange: '2:20 – 2:28', marathonBand: '4:55 – 5:10', runPace: '6:50–7:00/km',
    october: 'The plan exactly as written. This is the statistically expected outcome.',
    minSeconds: 2 * 3600 + 20 * 60, maxSeconds: 2 * 3600 + 28 * 60 },
  { halfRange: '2:28 – 2:36', marathonBand: '5:10 – 5:25', runPace: '7:10–7:20/km',
    october: 'Hold peak at 44 km rather than 50. Long runs unchanged; pace segments slowed.',
    minSeconds: 2 * 3600 + 28 * 60, maxSeconds: 2 * 3600 + 36 * 60 },
  { halfRange: 'Over 2:36', marathonBand: 'Sub 5:40', runPace: '7:30–7:40/km',
    october: 'Cap peak at 42 km, drop Friday quality to steady running, make finishing the whole goal.',
    minSeconds: 2 * 3600 + 36 * 60, maxSeconds: Infinity },
]

export const findBand = (halfSeconds: number): GateBand => {
  return GATE_BANDS.find((b) => halfSeconds >= (b.minSeconds ?? 0) && halfSeconds < (b.maxSeconds ?? Infinity))
    ?? GATE_BANDS[GATE_BANDS.length - 1]
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — 70.3 Goa — from PDF Section 13
// ─────────────────────────────────────────────────────────────────────────────

export const STEP2_BLOCKS: Step2Block[] = [
  { block: '0', label: 'Block 0', dates: '23 Nov – 20 Dec 2026', focus: 'Recover, then rebuild size',
    content: 'Week 1: no running — walking and easy swimming only. Week 2: three easy 20–30 min jogs; return to the gym at moderate load. Weeks 3–4: four runs, ~25 km/week, lifting back to four days. This is the single best window in the whole two-year plan to rebuild any size lost — running is low and recovery is high. Use it.' },
  { block: '1', label: 'Block 1', dates: 'Dec 2026 – Feb 2027', focus: 'Swim build + bike entry',
    content: 'Swim becomes real training: 3×/week, 800 m → 1,500 m, with a coached technique session if at all possible — it is the highest-return money he can spend. Cycling starts in January: 3×/week indoors, 45–75 min easy, building to 4 h/week by end February. Lift 4×/week in 8–12 rep hypertrophy ranges. Run 30 km/week maintenance. Professional bike fit in January before the volume starts — everything downstream depends on it.' },
  { block: '2', label: 'Block 2', dates: 'Mar – Jun 2027', focus: 'Multi-sport aerobic build',
    content: 'Bike 4–6 h/week including one 2.5–3 h outdoor ride. Weekly brick: 60–90 min bike straight into a 15–25 min run. Swim 3×/week, continuous 1,500–2,000 m. Open water and sighting practice from April. Run 30–35 km/week. Lifting drops to 3×/week, loads maintained.' },
  { block: '3', label: 'Block 3', dates: 'Jul – Sep 2027', focus: 'Race specific',
    content: 'Continuous 1.9 km open-water swims in sea conditions. Rides of 90–100 km held in the aero position. One long brick per fortnight: 75 km bike into 8 km run. Deliberate heat and humidity acclimatisation for Goa. Lifting 2×/week, loads held.' },
  { block: '4', label: 'Block 4', dates: 'Race month 2027', focus: 'Peak, simulate, taper',
    content: 'One race-simulation weekend at 70–80% of race distance with exact nutrition and kit, then a three-week taper. T1 and T2 transitions practised until boring. Confirm the Goa race date and register as early as entries open.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// FUELLING — from PDF Section 09
// ─────────────────────────────────────────────────────────────────────────────

export const FUELLING_PHASES: FuellingPhase[] = [
  { weeks: 'Weeks 1–7', carbsPerHour: 'Water only under 75 min. One gel on longer runs (practise swallowing).', notes: 'Building the gut starts here.' },
  { weeks: 'Week 8', carbsPerHour: '40 g/h', notes: 'First real fuel on the long run.' },
  { weeks: 'Weeks 9–10', carbsPerHour: '50 g/h', notes: 'Volume climbs; fuel climbs with it.' },
  { weeks: 'Weeks 11–12', carbsPerHour: '60–70 g/h', notes: 'Race rate. Test exact race-day brand on Weeks 9, 11 and 12. Nothing new after Week 12. Ever.' },
]

export const RACE_DAY_FUEL = {
  thursdayToSaturday: '525–675 g carbohydrate per day (7–9 g/kg). Low fibre on Saturday.',
  raceMorning3am: '90–110 g carbohydrate — idli, upma, or toast with banana and honey — plus 500 ml.',
  raceMorning545: 'One gel and 200 ml.',
  duringRace: '65 g carbs per hour (race rate). Drink at every station regardless of thirst.',
  fluidPerHour: '500–700 ml with 500–700 mg sodium. At 75 kg in canal humidity, target 60–70% of sweat rate.',
  postLongRun: 'Within 45 minutes: ~90 g carbohydrate plus 30 g protein.',
  beforeBed: '30–40 g slow protein — curd, paneer, milk, or casein.',
  dailyProtein: '135–165 g per day (1.8–2.2 g/kg) in 4–5 feeds of 30–40 g.',
  dailyCarb: '375–525 g on long-run and quality days (5–7 g/kg); lower on rest days.',
  creatine: '3–5 g monohydrate daily, any time. Expect ~1 kg water weight — that is the mechanism working.',
  dailyFluid: '3–3.5 L, more on office days. Electrolyte bottle in the cab.',
}

// ─────────────────────────────────────────────────────────────────────────────
// PACING BAND — Kaveri Trail Marathon race day — from PDF Section 11
// Working band 4:55–5:10; the decision gate replaces it if September says otherwise
// ─────────────────────────────────────────────────────────────────────────────

export const PACING_BAND: PacingSegment[] = [
  { segment: '0–10 km', paceRange: '7:05–7:15/km', hrCeiling: 155, cumulative: '1:13',
    execution: 'Must feel absurdly easy. If it feels like racing, he is already too fast. This is where the last half was lost.' },
  { segment: '10–21.1 km', paceRange: '6:50–7:00/km', hrCeiling: 160, cumulative: '2:32',
    execution: 'Settle in. First gel already taken at minute 30. Drink at every station regardless of thirst.' },
  { segment: '21.1–32 km', paceRange: '6:50–7:00/km', hrCeiling: 165, cumulative: '3:48',
    execution: 'The honest part of the race. Hold form; keep walk breaks disciplined even when they feel unnecessary.' },
  { segment: '32–42.2 km', paceRange: 'whatever remains', hrCeiling: 0, cumulative: '5:00',
    execution: 'Shorten the stride, hold cadence at 172–178, keep taking fuel. Walk breaks are now doing real work.' },
]

export const RACE_KIT_CHECKLIST = [
  'Max-cushion trainers with 80–150 km already on them. Nothing new, nothing past 800 km.',
  'Knee-high graduated compression socks, run in on the Week 9, 11 and 12 long runs.',
  'Cap, sunglasses, anti-chafe balm on everything that touches anything.',
  'Handheld or belt flask — do not rely solely on aid stations in humidity.',
  'Gels counted out and pocketed the night before.',
]

export const RACE_WEEK_LOGISTICS = [
  'Travel to Srirangapatna Saturday, not race morning. A 6:15 a.m. start from Bengaluru means a 2 a.m. departure otherwise.',
  'Saturday: 2 km shakeout, feet up by 9 p.m.',
  'Dinner: familiar, low fibre, eaten early. No experiments.',
  'Alarm 3:00 a.m. for breakfast, back to bed until 4:30 if possible.',
  'Compression socks on before leaving the room.',
]

// ─────────────────────────────────────────────────────────────────────────────
// GLOSSARY — tap-to-explain terms — plain language + why it matters
// ─────────────────────────────────────────────────────────────────────────────

export const GLOSSARY: GlossaryTerm[] = [
  // Zones
  { term: 'Recovery', category: 'zone', plain: 'So slow it feels embarrassing. That is the point.',
    why: 'Blood flow without training stress. Clears fatigue from the day before.' },
  { term: 'Easy / Aerobic', category: 'zone', plain: 'Conversational pace, 140–152 bpm. 75–80% of all your km.',
    why: 'This is where the aerobic engine is built — the engine a marathon runs on.' },
  { term: 'Threshold / Tempo', category: 'zone', plain: 'Three-word-answer pace. Hard but sustainable for ~1 hour.',
    why: 'Raises your lactate threshold — your "hard" pace gets faster without going anaerobic.' },
  { term: 'Marathon Pace (MP)', category: 'zone', plain: 'The pace you will hold for 42.2 km on 22 Nov. Set on 27 Sep.',
    why: 'Rehearsal. Every MP block in October practises fuelling, cadence, and form at race-day effort.' },
  { term: 'Strides', category: 'zone', plain: '15–20 second accelerations after easy runs. Relaxed, not strained.',
    why: 'Teaches your legs to turn over quickly without the fatigue of a sprint session. Free running economy.' },
  // Sessions
  { term: 'Long run', category: 'session', plain: 'Sunday\'s longest run of the week. The most important session by a distance.',
    why: 'Builds endurance, capillary density, and teaches your body to burn fat at running pace. Miss anything else, not this.' },
  { term: 'Deload', category: 'session', plain: 'A week where volume drops deliberately so bone and tendons can catch up.',
    why: 'Bone remodels more slowly than muscle adapts. Fitness will feel ready for more before the tibia is. The deload exists for the bone, not the lungs.' },
  { term: 'Taper', category: 'session', plain: 'The last 2–3 weeks before a race. Volume drops sharply.',
    why: 'You cannot gain fitness in a taper — only lose it. The work is done. Taper sheds fatigue so you arrive at the start line fresh.' },
  { term: 'Shakeout', category: 'session', plain: 'A very short, easy run (2–5 km) the day before a race.',
    why: 'Keeps the legs snappy without tiring them. Nothing more than that.' },
  { term: 'Negative split', category: 'session', plain: 'Running the second half faster than the first.',
    why: 'The most reliable way to race well. Going out too fast is the most common way to ruin a race — it is exactly the pattern in the Nov 2025 half that finished at 9:41/km.' },
  // Strength
  { term: 'Superset (A1/A2)', category: 'strength', plain: 'Two exercises done back-to-back with no rest between, rest only after the pair.',
    why: 'Density — more work in less time. The A1/A2 pairing in Strength A lets a heavy lower-body lift share a slot with a core exercise.' },
  { term: 'Reps in reserve (RIR)', category: 'strength', plain: 'How many more reps you could have done before failing. 2–3 RIR = stop with 2–3 reps left in the tank.',
    why: 'The muscle-retention mechanism. Every set stops with 2–3 reps in the tank. No maximal attempts across the whole block — that is what preserves muscle while running 50 km/week.' },
  { term: 'RPE', category: 'strength', plain: 'Rate of Perceived Exertion, 1–10. 7 = hard but could do 3 more reps. 10 = absolute max.',
    why: 'A way to log effort without needing a 1-rep max test. Track RPE over the block — if it drops at the same weight, you are getting stronger.' },
  { term: 'Eccentric', category: 'strength', plain: 'The lowering phase of a movement. "3 s lower" = take three seconds to lower.',
    why: 'Eccentric strength is what stops hamstrings from tearing during strides. Nordic curls and 3-second calf lowers build exactly this.' },
  { term: 'Cut sets, never load', category: 'strength', plain: 'When tapering or deloading, reduce the number of sets but keep the weight on the bar the same.',
    why: 'Held working weights on three sessions a week preserves mass comfortably; three sessions at reduced intensity does not. Switching to light weights and high reps is precisely what causes the muscle loss he is worried about.' },
  { term: 'Working weight', category: 'strength', plain: 'The weight you normally lift for a given rep range. Not your 1-rep max — your working weight.',
    why: 'The number the app tracks across 14 weeks. If it stays flat or goes up, muscle is being retained. If it drops, that is the earliest sign of muscle being spent as fuel.' },
  // Shin
  { term: 'Cadence', category: 'shin', plain: 'Steps per minute. Target 172–178 at all paces.',
    why: 'The single most powerful shin-splint intervention available. A 5–10% cadence increase shortens the stride, moves footstrike under the body, and measurably cuts the loading rate through the tibia on every one of thousands of strides.' },
  { term: 'Tibialis anterior', category: 'shin', plain: 'The muscle on the front of your shin. It controls the foot on landing.',
    why: 'When it is weak or fatigued, the bone takes the landing force directly. Tibialis raises 3 × 25 every Tuesday build this exact muscle.' },
  { term: 'Soleus', category: 'shin', plain: 'The deeper calf muscle. Absorbs 6–8× bodyweight per stride.',
    why: 'The exact tissue that fails when volume is added quickly. Seated calf raises 3 × 20 target the soleus specifically (standing calf raises hit the gastrocnemius more).' },
  { term: 'Medial tibial stress syndrome', category: 'shin', plain: 'Shin splints. Pain along the inner edge of the shin bone.',
    why: 'By far the most likely injury in this project — every one of its main risk factors is present: novice runner, rapid ramp, low cadence, hard surfaces. Section 05 of the PDF exists because of this risk.' },
  { term: 'Stress fracture', category: 'shin', plain: 'A crack in the bone from repetitive load. Not the same as shin splints.',
    why: 'The thing shin splints become if ignored. Pain that is pinpoint on the bone, worsens as you run, or hurts at rest means stop and get imaging — not rest and hope. A stress reaction caught in week one costs three weeks; missed, it costs the marathon and three months.' },
  { term: 'Bone remodels slower than muscle', category: 'shin', plain: 'Muscle adapts to training in days. Bone takes weeks.',
    why: 'The reason for the four deloads. Fitness will feel ready for more before the tibia is. The deloads exist for the bone, not the lungs.' },
  // Gate
  { term: 'Decision gate', category: 'gate', plain: 'The Wipro Bengaluru Half on 27 Sep. Run it honestly, read the clock, take the band it gives you.',
    why: 'A refusal to set a pace in August that the body has not yet agreed to in September. Sub-2:10 and 4:30 is live. That is the deal.' },
  { term: 'Band', category: 'gate', plain: 'The marathon finish-time range your half result says is realistically available.',
    why: 'Pace on 22 Nov is set by the band, not by hope. Forcing a pace the body has not earned is how a 6-hour cutoff gets missed.' },
  { term: 'AIMS-certified', category: 'gate', plain: 'Association of International Marathons and Distance Races. The course is measured accurately.',
    why: 'A half time only counts as a real reading if the course is accurately measured. The Wipro Bengaluru Half is AIMS-certified — the clock tells the truth.' },
  // Fuelling
  { term: 'Gel', category: 'fuelling', plain: 'A small sachet of concentrated carbohydrate (~25 g). Eaten during running.',
    why: 'The form your carb intake takes during a run. Practise swallowing it while moving — that is the skill being trained from Week 3.' },
  { term: 'Carb loading', category: 'fuelling', plain: 'Eating extra carbohydrate for 3 days before a race to fill your glycogen stores.',
    why: 'Full glycogen stores delay hitting the wall. Thursday–Saturday before the marathon: 525–675 g carb/day. Low fibre on Saturday.' },
  { term: 'Building the gut', category: 'fuelling', plain: 'Training your stomach to absorb more carbohydrate per hour while running.',
    why: 'Untrained, you absorb ~30 g/h. Race day needs 65 g/h. You build up to it across Weeks 1–12 so race day is not a shock.' },
  { term: 'Nothing new after Week 12', category: 'fuelling', plain: 'After the Week 12 dress rehearsal, shoes, socks, gels, and breakfast are frozen. No experiments.',
    why: 'Race-day disaster stories are almost all "I tried a new gel" or "I wore new socks". Test everything by Week 12, then change nothing.' },
  { term: 'Sweat rate', category: 'fuelling', plain: 'How much fluid you lose per hour. At 75 kg in canal humidity: 1.0–1.4 L/h.',
    why: 'Full replacement is impossible at that rate. Target 60–70% — 500–700 ml/h with 500–700 mg sodium. Drink at every station regardless of thirst.' },
  // Recovery
  { term: 'Resting heart rate (RHR)', category: 'recovery', plain: 'Your pulse on waking, before getting up.',
    why: 'A rise of more than 7 bpm above baseline for two consecutive mornings means take an unplanned easy day. Catches overreaching early — costs nothing.' },
  { term: 'Overreaching', category: 'recovery', plain: 'The state just before overtraining. Fatigue accumulating faster than recovery.',
    why: 'Caught early (RHR, sleep, mood), an extra easy day fixes it in 48 hours. Missed, it becomes overtraining — weeks of forced rest.' },
  { term: 'Compression socks', category: 'recovery', plain: 'Knee-high graduated socks, 20–30 mmHg. Tighter at the ankle, looser at the knee.',
    why: 'Improve venous return. Wear them for every long run, every quality run, both cab legs. On before getting out of bed on long-run mornings. Removed at night — never slept in.' },
  { term: 'Legs elevated', category: 'recovery', plain: 'Lie flat on your back, legs up a wall, for 10–15 minutes.',
    why: 'Drains pooled venous blood from the lower legs. Do it on returning home from the evening commute and after every Sunday long run.' },
  { term: 'Flush', category: 'recovery', plain: 'A very easy swim or jog done purely to aid recovery, not to train.',
    why: 'The Sunday evening swim is a recovery tool first and a swim second. Easy, long, relaxed, no intervals.' },
  // Swim
  { term: 'Catch', category: 'swim', plain: 'The moment your hand grips the water at the front of the stroke.',
    why: 'A good catch is what propels you. Lat pulldowns and straight-arm pulldowns in Strength B build the catch a year early.' },
  { term: 'Pull buoy', category: 'swim', plain: 'A foam figure-eight between your thighs. Lifts your hips so you can focus on the arms.',
    why: 'Lets you isolate the pull without sinking. Used in Saturday technique sessions through November.' },
  { term: 'Bilateral breathing', category: 'swim', plain: 'Breathing on both sides, alternating.',
    why: 'Balances the stroke and lets you breathe away from waves or the sun on race day. Practise from Week 1.' },
  { term: 'Fins', category: 'swim', plain: 'Short swim fins. Allowed in warm-up through November.',
    why: 'Help focus on the arm catch without worrying about staying afloat. A learning aid, not a crutch.' },
  // Step 2
  { term: 'Aero position', category: 'step2', plain: 'The forward-leaning, elbows-resting-on-bars cycling posture that reduces wind drag.',
    why: 'Holds for 90 km on race day. Romanian deadlifts and Bulgarian split squats build the glute and hamstring endurance that holds the position.' },
  { term: 'Brick', category: 'step2', plain: 'A bike session immediately followed by a run. "Bike-then-run."',
    why: 'Trains the legs to transition from cycling to running — they feel strange for the first km. Race day has two bricks: T1 (swim→bike) and T2 (bike→run).' },
  { term: 'Bike fit', category: 'step2', plain: 'A professional session to set your saddle height, reach, and bar position to your body.',
    why: 'Everything downstream depends on it. Get it done in January before the cycling volume starts — riding 4–6 h/week in a wrong position causes injuries that take months to fix.' },
  { term: '70.3', category: 'step2', plain: 'Half-Ironman distance: 1.9 km swim, 90 km bike, 21.1 km run.',
    why: 'Ironman 70.3 Goa, 2027. Step 2 of the plan. The run leg is the easy leg — by then you will have raced 42.2 km.' },
  { term: 'T1 / T2', category: 'step2', plain: 'The transitions. T1 = swim to bike. T2 = bike to run.',
    why: 'Practised until boring in Block 4. A smooth T1/T2 saves minutes for free; a botched one costs them.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const getSessionsForDate = (date: Date): Session[] => {
  const start = new Date('2026-08-17T00:00:00')
  const dayDiff = differenceInCalendarDays(date, start)
  if (dayDiff < 0 || dayDiff >= 14 * 7) return []
  const week = Math.floor(dayDiff / 7) + 1
  const day = dayDiff % 7
  return PLAN.find((w) => w.week === week)?.sessions.filter((s) => s.day === day) ?? []
}

export const getCurrentWeek = (date: Date = new Date()): number => {
  const start = new Date('2026-08-17T00:00:00')
  const dayDiff = differenceInCalendarDays(date, start)
  if (dayDiff < 0) return 0
  return Math.min(14, Math.floor(dayDiff / 7) + 1)
}

export const getTodayDate = (): string => new Date().toISOString().slice(0, 10)

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
