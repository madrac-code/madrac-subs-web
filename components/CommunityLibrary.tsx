'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

type Subtitle = {
  id: string
  video_name: string
  language: string
  srt_url: string
  uploader_name: string | null
  downloads: number
  created_at: string
}

export function CommunityLibrary() {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    supabase
      .from('community_subtitles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error, count }) => {
        if (!error && data) {
          setSubtitles(data as Subtitle[])
          if (count !== null) setTotal(count)
        }
        setLoading(false)
      })
  }, [])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
          {subtitles.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200 truncate font-medium">
                  {sub.video_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  <span>{sub.language}</span>
                  <span>•</span>
                  <span>{formatDate(sub.created_at)}</span>
                  {sub.downloads > 0 && (
                    <>
                      <span>•</span>
                      <span>{sub.downloads} descargas</span>
                    </>
                  )}
                </div>
              </div>
              <a
                href={sub.srt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar
              </a>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}
