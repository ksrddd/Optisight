import { $fetch } from 'ofetch'
import type { ThreatEvent } from './types'

/**
 * REST calls for the SOC surface.
 *
 * Every HTTP request this feature makes lives here. Components and composables
 * import from this module; they never construct a URL or read a token
 * themselves. That keeps auth headers, base URLs and error shapes in one place
 * when the endpoints move behind a gateway.
 */

export interface ApiContext {
  baseUrl: string
  token?: string | null
}

const authHeaders = (token?: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {}

/**
 * Historical backfill for the feed.
 *
 * Resolves to an empty array rather than throwing: the console must still open
 * when the API is down, because the socket tail is the primary source and the
 * UI already reports degraded transport in the command bar.
 */
export async function fetchThreatHistory(ctx: ApiContext, limit = 500): Promise<ThreatEvent[]> {
  try {
    const data = await $fetch<ThreatEvent[]>(`${ctx.baseUrl}/api/security`, {
      headers: authHeaders(ctx.token),
      query: { limit },
      retry: 0,
      timeout: 5000
    })
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Aggregate counters used by the dashboard header. */
export async function fetchSecurityStats(ctx: ApiContext): Promise<Record<string, unknown> | null> {
  try {
    return await $fetch<Record<string, unknown>>(`${ctx.baseUrl}/api/stats`, {
      headers: authHeaders(ctx.token),
      retry: 0,
      timeout: 5000
    })
  } catch {
    return null
  }
}
