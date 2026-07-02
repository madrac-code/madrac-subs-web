import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  const subtitleId = request.nextUrl.searchParams.get('id')
  if (!subtitleId) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }

  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Config error' }, { status: 500 })
  }

  try {
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/subtitles?id=eq.${subtitleId}&select=filename,original_video_name`,
      { headers }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Subtítulo no encontrado' }, { status: 404 })
    }

    const rows = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Subtítulo no encontrado' }, { status: 404 })
    }

    const { filename, original_video_name } = rows[0]
    if (!filename) {
      return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
    }

    const storageRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/subtitle-files/${filename}`,
      { headers }
    )

    if (!storageRes.ok) {
      return NextResponse.json({ error: 'Error al descargar archivo' }, { status: 500 })
    }

    const cleanName = (original_video_name || filename)
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w\s\-.,()[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200) + '.srt'

    const body = await storageRes.arrayBuffer()

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/x-subrip',
        'Content-Disposition': `attachment; filename="${cleanName}"`,
        'Content-Length': body.byteLength.toString(),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
