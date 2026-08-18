// ─────────────────────────────────────────────────────────────────────────────
// Supabase Edge Function stub — Web Push reminder (v2)
// Deploys with: supabase functions deploy push-reminder
// See README.md → "Enable Supabase (v2)".
//
// Sends scheduled push notifications to the athlete's Amazfit (via the phone's
// Web Push subscription). Used for: pacing band cues, 9:1 interval, gel timings,
// daily shin routine, in-cab breaks, Sunday green-light checklist, etc.
// ─────────────────────────────────────────────────────────────────────────────

// TODO v2: import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface PushRequest {
  athleteId: string
  title: string
  body: string
  /** Optional: when to fire (ISO). If absent, fire immediately. */
  scheduledFor?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: PushRequest
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // TODO v2:
  // 1. Load VAPID keys from env: Deno.env.get('VAPID_PUBLIC_KEY'), Deno.env.get('VAPID_PRIVATE_KEY')
  // 2. Query push_subscriptions for payload.athleteId
  // 3. For each subscription, call web-push with the payload.title + body
  // 4. If payload.scheduledFor is set, queue via pg_cron or Supabase schedules
  // 5. Return 200 with the count of successful pushes

  console.log('push-reminder stub received:', payload)

  return new Response(
    JSON.stringify({ ok: true, delivered: 0, stub: true }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
