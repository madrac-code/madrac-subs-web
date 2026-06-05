'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { SUPABASE_URL } from '@/lib/constants'

type DesktopSubtitle = {
  id: string
  original_video_name: string
  language: string
  filename: string
  download_count: number
  duration_sec: number | null
  version: number
  avg_confidence: number | null
  user_id: string | null
  created_at: string
}

type Profile = {
  id: string
  honor_points: number
}

type SortTab = 'recent' | 'popular'

const LEVELS = [
  { min: 1000, label: 'Leyenda MADRAC', color: 'text-red-400' },
  { min: 500, label: 'Maestro de Subtítulos', color: 'text-orange-400' },
  { min: 200, label: 'Colaborador', color: 'text-purple-400' },
  { min: 50, label: 'Traductor', color: 'text-blue-400' },
  { min: 0, label: 'Novato', color: 'text-zinc-400' },
]

function reputationLevel(points: number) {
  return LEVELS.find((l) => points >= l.min) ?? LEVELS[LEVELS.length - 1]
}

function formatDuration(sec: number | null) {
  if (!sec) return null
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function CommunityLibrary() {
  const [subtitles, setSubtitles] = useState<DesktopSubtitle[]>([])
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map())
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<SortTab>('recent')

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const orderColumn = sortBy === 'popular' ? 'download_count' : 'created_at'

    supabase
      .from('subtitles')
      .select('id, original_video_name, language, filename, download_count, duration_sec, version, avg_confidence, user_id, created_at', { count: 'exact' })
      .eq('status', 'published')
      .order(orderColumn, { ascending: false })
      .limit(20)
      .then(({ data, error, count }) => {
        if (!error && data) {
          setSubtitles(data as DesktopSubtitle[])
          if (count !== null) setTotal(count)

          const userIds = data
            .map((s) => (s as DesktopSubtitle).user_id)
            .filter(Boolean) as string[]

          if (userIds.length > 0) {
            supabase
              .from('profiles')
              .select('id, honor_points')
              .in('id', userIds)
              .then(({ data: profilesData }) => {
                if (profilesData) {
                  const map = new Map<string, Profile>()
                  for (const p of profilesData as Profile[]) {
                    map.set(p.id, p)
                  }
                  setProfiles(map)
                }
              })
          }
        }
        setLoading(false)
      })
  }, [sortBy])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function handleDownload(sub: DesktopSubtitle) {
    const supabase = createBrowserSupabaseClient()
    supabase.from('subtitle_downloads').insert({
      subtitle_id: sub.id,
    }).then(({ error }) => {
      if (error) console.warn('[downloads] error:', error.message)
    })
    const url = `${SUPABASE_URL}/storage/v1/object/public/subtitle-files/${sub.filename}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-white">
          Biblioteca de la Comunidad
        </h3>
        {!loading && (
          <span className="text-xs text-zinc-500">{total} subtítulos</span>
        )}
      </div>

      <div className="flex gap-1 mb-3 bg-zinc-800/50 rounded-lg p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setSortBy('recent')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            sortBy === 'recent'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Recientes
        </button>
        <button
          type="button"
          onClick={() => setSortBy('popular')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            sortBy === 'popular'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Más descargados
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Cargando…</p>
        </div>
      ) : subtitles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Aún no hay subtítulos compartidos</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto max-h-72 sm:max-h-80 scrollbar-thin">
          {subtitles.map((sub) => {
            const profile = sub.user_id ? profiles.get(sub.user_id) : undefined
            const level = profile ? reputationLevel(profile.honor_points) : null
            const duration = formatDuration(sub.duration_sec)

            return (
              <li
                key={sub.id}
                className="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200 truncate font-medium">
                    {sub.original_video_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 flex-wrap">
                    <span>{sub.language}</span>
                    <span>•</span>
                    <span>{formatDate(sub.created_at)}</span>
                    {duration && (
                      <>
                        <span>•</span>
                        <span>{duration}</span>
                      </>
                    )}
                    {sub.download_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{sub.download_count} descargas</span>
                      </>
                    )}
                    {level && (
                      <>
                        <span>•</span>
                        <span className={level.color}>{level.label}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(sub)}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
