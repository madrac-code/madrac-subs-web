import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30
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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

  let body: { subtitle_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.subtitle_id || typeof body.subtitle_id !== 'string') {
    return NextResponse.json({ error: 'subtitle_id requerido' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Config error' }, { status: 500 })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/subtitle_downloads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ subtitle_id: body.subtitle_id }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Error registrando descarga' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
