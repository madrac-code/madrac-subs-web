'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { CommunityLibrary } from '@/components/CommunityLibrary'
import { Leaderboard } from '@/components/Leaderboard'
import { useLatestRelease } from '@/hooks/useLatestRelease'
import { useRef, useState, useEffect } from 'react'

function handleDownload(platform: string) {
  const supabase = createBrowserSupabaseClient()
  supabase.from('download_stats').insert({ platform, source: 'lasombrademadrac' }).then(({ error }) => {
    if (error) console.warn('[tracking] Error registrando descarga:', error.message)
  })
}

function SearchInput() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [internalResults, setInternalResults] = useState<any[]>([])
  const [externalResults, setExternalResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const supabaseRef = useRef(createBrowserSupabaseClient())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
        setInternalResults([])
        setExternalResults([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  function handleInput(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setInternalResults([])
      setExternalResults([])
      setSelectedIdx(-1)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)

      const [internal, external] = await Promise.all([
        supabaseRef.current
          .from('subtitles')
          .select('id, original_video_name, language, download_count, filename')
          .ilike('original_video_name', `%${value}%`)
          .eq('status', 'published')
          .order('download_count', { ascending: false })
          .limit(5)
          .then(({ data }) => data || []),
        fetch(`/api/search-external?query=${encodeURIComponent(value)}&type=movie`)
          .then(r => r.json())
          .then(d => d.items || [])
          .catch(() => []),
      ])

      setInternalResults(internal)
      setExternalResults(external)
      setLoading(false)
      setSelectedIdx(-1)
    }, 300)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const total = internalResults.length + externalResults.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIdx(prev => (prev < total - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIdx(prev => (prev > 0 ? prev - 1 : total - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIdx >= 0) {
          if (selectedIdx < internalResults.length) {
            setQuery(internalResults[selectedIdx].original_video_name)
          } else {
            const item = externalResults[selectedIdx - internalResults.length]
            if (item?.id) {
              window.open(
                `https://www.subdivx.com/index.php?accion=5&buscar=${item.id}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
          }
        }
        break
      case 'Escape':
        setOpen(false)
        setQuery('')
        setInternalResults([])
        setExternalResults([])
        setSelectedIdx(-1)
        inputRef.current?.blur()
        break
    }
  }

  const FLAGS: Record<string, string> = {
    es: '🇪🇸', 'es-ES': '🇪🇸', 'es-MX': '🇲🇽',
    en: '🇺🇸', 'en-US': '🇺🇸', 'en-GB': '🇬🇧',
    fr: '🇫🇷', pt: '🇧🇷', 'pt-BR': '🇧🇷',
    de: '🇩🇪', it: '🇮🇹', ja: '🇯🇵', zh: '🇨🇳',
    ru: '🇷🇺', ko: '🇰🇷', ar: '🇸🇦',
  }

  function flagEmoji(lang: string | null) {
    return lang ? FLAGS[lang.toLowerCase()] || '🌐' : '🌐'
  }

  const showDropdown = open && (internalResults.length > 0 || externalResults.length > 0 || (loading && query.length >= 2))

  return (
    <div ref={ref} className="relative flex items-center">
      <div
        className={`flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 transition-all duration-300 overflow-hidden ${
          open ? 'w-[400px] px-3 py-1.5' : 'w-9 h-9 justify-center cursor-pointer hover:bg-zinc-700'
        }`}
        onClick={() => { if (!open) setOpen(true) }}
      >
        <svg className="w-4 h-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar subtítulos…"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`bg-transparent text-sm text-zinc-200 outline-none placeholder-zinc-500 transition-opacity duration-300 ${
            open ? 'opacity-100 w-full' : 'opacity-0 w-0 p-0'
          }`}
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-[400px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {loading && internalResults.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Buscando...</div>
          )}

          {internalResults.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setQuery(item.original_video_name)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                selectedIdx === i ? 'bg-zinc-700' : 'hover:bg-zinc-800'
              }`}
            >
              <span className="shrink-0">📄</span>
              <span className="flex-1 truncate text-zinc-200">{item.original_video_name}</span>
              <span className="shrink-0 text-base">{flagEmoji(item.language)}</span>
              <span className="shrink-0 text-xs text-zinc-500">{item.download_count}↓</span>
            </button>
          ))}

          {externalResults.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-zinc-500 border-t border-zinc-700/50 flex items-center gap-2">
                🌐 Resultados Externos (SubDivX)
              </div>
              {externalResults.slice(0, 5).map((item, i) => {
                const idx = internalResults.length + i
                return (
                  <a
                    key={item.id}
                    href={`https://www.subdivx.com/index.php?accion=5&buscar=${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      selectedIdx === idx ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                    }`}
                  >
                    <span className="shrink-0">📄</span>
                    <span className="flex-1 truncate text-zinc-200">{item.title}</span>
                    <span className="shrink-0 text-xs text-zinc-400 truncate max-w-[80px]">{item.uploader_name}</span>
                    <span className="shrink-0 text-base">🇪🇸</span>
                  </a>
                )
              })}
            </>
          )}

          {!loading && internalResults.length === 0 && externalResults.length === 0 && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  )
}

function Navbar() {
  async function iniciarSesionGoogle() {
    const supabase = createBrowserSupabaseClient()
    const redirectTo = `${window.location.origin}/auth/callback`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800">
      <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <span className="text-base sm:text-lg font-bold tracking-tight text-white">{APP_NAME}</span>
        <button
          type="button"
          onClick={iniciarSesionGoogle}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Iniciar sesión
        </button>
      </div>
    </nav>
  )
}

function WindowsIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.5 3.5H11V11H3.5V3.5Zm9.5 0H20.5V11H13V3.5ZM3.5 13H11v7.5H3.5V13Zm9.5 0H20.5v7.5H13V13Z" />
    </svg>
  )
}

function LinuxIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-1.8 0-3.2.9-4.2 2.3-.5.7-.8 1.5-.8 2.4 0 .6.1 1.2.4 1.7-.6.5-1 1.2-1 2.1 0 .4.1.8.3 1.2-.6.4-1 1.1-1 1.9 0 1.3 1.1 2.4 2.4 2.4H16c1.3 0 2.4-1.1 2.4-2.4 0-.8-.4-1.5-1-1.9.2-.4.3-.8.3-1.2 0-.9-.4-1.6-1-2.1.3-.5.4-1.1.4-1.7 0-.9-.3-1.7-.8-2.4C15.2 3.9 13.8 3 12 3Z" />
      <path d="M8.5 14.5c0 1.5 1 2.8 2.5 3.2-.3.3-.5.7-.5 1.1 0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5c0-.4-.2-.8-.5-1.1 1.5-.4 2.5-1.7 2.5-3.2" />
    </svg>
  )
}

function DownloadButton({ href, label, platform, disabled }: { href: string; label: string; platform: string; disabled?: boolean }) {
  const Icon = platform === 'Windows' ? WindowsIcon : LinuxIcon

  function handleClick() {
    handleDownload(platform)
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-colors ${
        disabled
          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          : 'bg-white text-black hover:bg-zinc-200'
      }`}
      disabled={disabled}
    >
      <Icon />
      {label}
    </button>
  )
}

export default function Home() {
  const { urls, loading } = useLatestRelease()

  return (
    <>
      <Navbar />
      <div className="fixed top-14 sm:top-16 right-4 sm:right-6 z-40 mt-6">
        <SearchInput />
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-14 sm:pt-16">
        <div className="w-full max-w-3xl mx-auto text-center space-y-8 sm:space-y-10">
          <div className="space-y-4 sm:space-y-5">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              {APP_NAME}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
            <DownloadButton href={urls.windows} platform="Windows" label="Windows (.exe)" disabled={loading} />
            <DownloadButton href={urls.linux} platform="Linux" label="Linux (.AppImage)" disabled={loading} />
          </div>

        </div>

        <div className="mt-8 sm:mt-12 w-full flex flex-col lg:flex-row justify-between items-start gap-8 px-4 sm:px-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 min-h-[280px] sm:min-h-[360px] w-full lg:w-[min(45%,480px)] flex items-center justify-center overflow-hidden relative">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src="/videos/demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
            />
            <div className="flex flex-col items-center gap-3 text-zinc-600 pointer-events-none">
              <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-xs sm:text-sm">Demo del software</p>
            </div>
          </div>
          <div className="w-full lg:w-[580px] shrink-0">
            <CommunityLibrary />
          </div>
        </div>

        <div className="mt-8 sm:mt-12 max-w-md mx-auto">
          <Leaderboard />
        </div>

        <footer className="mt-16 sm:mt-20 pb-6 sm:pb-8 text-center text-xs sm:text-sm text-zinc-600">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
        </footer>
      </main>
    </>
  )
}
