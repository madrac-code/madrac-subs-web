import { NextRequest, NextResponse } from 'next/server'

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
    console.log('HEADER COMPLETO:', disposition)

    const match = disposition.match(/.*_(\d+)_/)
    const id = match ? match[1] : null
    console.log('ID EXTRAÍDO:', id)
    return id && id.length >= 5 ? id : null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
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
