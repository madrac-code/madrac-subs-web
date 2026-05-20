'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

function LoginForm() {
  const searchParams = useSearchParams()
  const errorAuth = searchParams.get('error') === 'auth'
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function iniciarSesionGoogle() {
    setCargando(true)
    setError(null)

    const supabase = createBrowserSupabaseClient()
    const redirectTo = `${window.location.origin}/auth/callback`

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (oauthError) {
      setError(oauthError.message)
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-400">RestoPOS</h1>
          <p className="text-zinc-400 mt-2 text-sm">Panel de gestión para tu restaurante</p>
        </div>

        {(errorAuth || error) && (
          <p className="text-sm text-red-400 bg-red-950/50 rounded-lg p-3">
            {error ?? 'No se pudo iniciar sesión. Intentá de nuevo.'}
          </p>
        )}

        <button
          type="button"
          onClick={iniciarSesionGoogle}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold py-3 px-4 rounded-xl hover:bg-zinc-100 disabled:opacity-60 transition-colors"
        >
          <GoogleIcon />
          {cargando ? 'Redirigiendo…' : 'Iniciar sesión con Google'}
        </button>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
          Cargando…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
