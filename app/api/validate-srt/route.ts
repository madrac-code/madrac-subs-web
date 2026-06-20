import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 10
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

const MAX_FILE_SIZE = 2 * 1024 * 1024
const MAX_LINE_LENGTH = 200
const MAX_TOTAL_LINES = 5000

const SUSPICIOUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*['"]/i,
  /data:\s*text\/html/i,
  /eval\s*\(/i,
  /<embed[\s>]/i,
  /<object[\s>]/i,
  /<iframe[\s>]/i,
]

function isLikelySrt(text: string): { valid: boolean; reason?: string } {
  if (text.length > MAX_FILE_SIZE) {
    return { valid: false, reason: 'Archivo demasiado grande (máx 2MB)' }
  }

  const lines = text.split(/\r?\n/)
  if (lines.length > MAX_TOTAL_LINES) {
    return { valid: false, reason: 'Demasiadas líneas (máx 5000)' }
  }

  if (lines.length < 4) {
    return { valid: false, reason: 'Archivo muy corto para ser un SRT' }
  }

  if (!/^\d+$/.test(lines[0]?.trim())) {
    return { valid: false, reason: 'El SRT debe comenzar con un número de secuencia' }
  }

  const timeLine = lines[1] || ''
  const timePattern = /^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}$/
  if (!timePattern.test(timeLine.trim())) {
    return { valid: false, reason: 'Formato de tiempo SRT inválido' }
  }

  for (const line of lines) {
    if (line.length > MAX_LINE_LENGTH) {
      return { valid: false, reason: `Línea demasiado larga (>${MAX_LINE_LENGTH} caracteres)` }
    }
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(line)) {
        return { valid: false, reason: 'Contenido sospechoso detectado' }
      }
    }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

  let body: { content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content requerido' }, { status: 400 })
  }

  const result = isLikelySrt(body.content)

  if (!result.valid) {
    return NextResponse.json({ valid: false, reason: result.reason })
  }

  return NextResponse.json({ valid: true })
}
