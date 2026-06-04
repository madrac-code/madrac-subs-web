'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { APP_NAME, APP_TAGLINE, DOWNLOAD_WINDOWS, DOWNLOAD_LINUX } from '@/lib/constants'

function logDownload(platform: string) {
  const supabase = createBrowserSupabaseClient()
  supabase.from('download_stats').insert({ platform }).then(({ error }) => {
    if (error) console.warn('[tracking] Error registrando descarga:', error.message)
  })
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
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight text-white">{APP_NAME}</span>
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

function DownloadButton({ href, label, platform }: { href: string; label: string; platform: string }) {
  function handleClick() {
    logDownload(platform)
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </button>
  )
}

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-16">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <div className="space-y-5">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white">
              {APP_NAME}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <DownloadButton href={DOWNLOAD_WINDOWS} platform="Windows" label="Descargar para Windows (.exe)" />
            <DownloadButton href={DOWNLOAD_LINUX} platform="Linux" label="Descargar para Linux" />
          </div>

          <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 aspect-video max-w-2xl mx-auto flex items-center justify-center">
            <div className="text-center text-zinc-600">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Captura de pantalla del software</p>
            </div>
          </div>
        </div>

        <footer className="mt-20 pb-8 text-center text-sm text-zinc-600">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
        </footer>
      </main>
    </>
  )
}
