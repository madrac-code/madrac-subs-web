import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let body: { platform?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.platform || typeof body.platform !== 'string') {
    return NextResponse.json({ error: 'platform requerido' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Config error' }, { status: 500 })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/download_stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ platform: body.platform, source: 'lasombrademadrac' }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Error registrando descarga' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
