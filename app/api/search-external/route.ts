import { NextRequest, NextResponse } from 'next/server'

let lastFetch = 0

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
    return NextResponse.json({ items: data.items || [] })
  } catch {
    return NextResponse.json({ items: [] })
  } finally {
    clearTimeout(timeout)
  }
}
