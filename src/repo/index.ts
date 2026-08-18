import type { Repository } from './Repository'
import { LocalRepo } from './LocalRepo'
import { SupabaseRepo } from './SupabaseRepo'

// ─────────────────────────────────────────────────────────────────────────────
// Repo switch — flip here to enable Supabase in v2.
// v1 uses LocalRepo (localStorage). v2: set USE_SUPABASE to true after wiring.
// ─────────────────────────────────────────────────────────────────────────────

const USE_SUPABASE = false

export const repo: Repository = USE_SUPABASE ? new SupabaseRepo() : new LocalRepo()

export type { Repository, ExportPayload } from './Repository'
