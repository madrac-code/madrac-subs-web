import { NextRequest, NextResponse } from 'next/server'

let lastFetch = 0

async function fetchSubdivxId(uuid: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://subx-api.duckdns.org/api/subtitles/${uuid}/download`,
      { method: 'HEAD', headers: { Authorization: `Bearer ${token}` } }
    )
    const disposition = res.headers.get('content-disposition') || ''
    const match = disposition.match(/_(\d+)_.*\.rar$/)
    return match ? match[1] : null
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
    const items = data.items || []

    const token = process.env.SUBX_API_TOKEN || ''
    const ids = await Promise.all(
      items.slice(0, 5).map((item: any) => fetchSubdivxId(item.id, token))
    )

    const enriched = items.slice(0, 5).map((item: any, i: number) => ({
      ...item,
      subdivx_id: ids[i],
    }))

    return NextResponse.json({ items: enriched })
  } catch {
    return NextResponse.json({ items: [] })
  } finally {
    clearTimeout(timeout)
  }
}
