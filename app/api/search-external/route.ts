import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20
const CLEANUP_INTERVAL = 300_000

const hits = new Map<string, number[]>()

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || '127.0.0.1'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = hits.get(ip) || []
  const recent = timestamps.filter(t => now - t < WINDOW_MS)

  if (recent.length >= MAX_REQUESTS) {
    return false
  }

  recent.push(now)
  hits.set(ip, recent)
  return true
}

function cleanupStale() {
  const now = Date.now()
  for (const [ip, timestamps] of hits) {
    const recent = timestamps.filter(t => now - t < WINDOW_MS)
    if (recent.length === 0) {
      hits.delete(ip)
    } else {
      hits.set(ip, recent)
    }
  }
}

setInterval(cleanupStale, CLEANUP_INTERVAL)

let lastFetch = 0

async function fetchNumericalId(uuid: string, token: string): Promise<string | null> {
  const controller = new AbortController()
  try {
    const res = await fetch(
      `https://subx-api.duckdns.org/api/subtitles/${uuid}/download`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    )
    const disposition = res.headers.get('content-disposition') || ''
    controller.abort()

    const match = disposition.match(/.*_(\d+)_/)
    const id = match ? match[1] : null
    return id && id.length >= 5 ? id : null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429 }
    )
  }

  const query = request.nextUrl.searchParams.get('query')
  const type = request.nextUrl.searchParams.get('type') || 'movie'

  if (!query || query.length < 2) {
    return NextResponse.json({ items: [] })
  }

  const now = Date.now()
  if (now - lastFetch < 5000) {
    return NextResponse.json({ items: [], cooldown: true })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)

  try {
    const res = await fetch(
      `https://subx-api.duckdns.org/api/subtitles/search?title=${encodeURIComponent(query)}&video_type=${type}`,
      {
        headers: { Authorization: `Bearer ${process.env.SUBX_API_TOKEN}` },
        signal: controller.signal,
      }
    )
    lastFetch = Date.now()

    if (!res.ok) {
      return NextResponse.json({ items: [] })
    }

    const data = await res.json()
    const items = (data.items || []).slice(0, 5)
    const token = process.env.SUBX_API_TOKEN || ''

    const ids = await Promise.all(
      items.map((item: any) => fetchNumericalId(item.id, token))
    )

    const enriched = items.map((item: any, i: number) => ({
      ...item,
      numerical_id: ids[i],
    }))

    return NextResponse.json({ items: enriched })
  } catch {
    return NextResponse.json({ items: [] })
  } finally {
    clearTimeout(timeout)
  }
}
