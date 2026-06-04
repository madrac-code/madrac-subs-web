'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

type Profile = {
  username: string | null
  honor_points: number
  subtitles_uploaded: number
  total_downloads_received: number
  helpful_votes: number
}

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

export function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase
      .from('community_profiles')
      .select('username, honor_points, subtitles_uploaded, total_downloads_received, helpful_votes')
      .order('honor_points', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data) setProfiles(data as Profile[])
        setLoading(false)
      })
  }, [])

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
      <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
        Ranking de Colaboradores
      </h3>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay colaboradores</p>
      ) : (
        <ul className="space-y-1.5">
          {profiles.map((p, i) => {
            const level = reputationLevel(p.honor_points)
            return (
              <li
                key={p.username ?? i}
                className="flex items-center gap-3 rounded-xl bg-zinc-800/30 px-3 py-2"
              >
                <span className="w-5 text-center text-xs font-bold text-zinc-500 shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200 truncate font-medium">
                    {p.username ?? 'Anónimo'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span className={level.color}>{level.label}</span>
                    <span>•</span>
                    <span>{p.honor_points} pts</span>
                    {p.subtitles_uploaded > 0 && (
                      <>
                        <span>•</span>
                        <span>{p.subtitles_uploaded} subidas</span>
                      </>
                    )}
                  </div>
                </div>
                {p.helpful_votes > 0 && (
                  <span className="shrink-0 text-xs text-zinc-500">
                    👍 {p.helpful_votes}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
