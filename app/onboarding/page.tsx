'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { esSlugValido, slugDesdeNombre } from '@/lib/slug'

export default function OnboardingPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    async function verificarSesion() {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: restaurante } = await supabase
        .from('restaurantes')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

      if (restaurante) {
        router.replace('/dashboard')
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (perfil) {
        router.replace('/dashboard')
        return
      }

      setVerificando(false)
    }

    verificarSesion()
  }, [router])

  function handleNombreChange(value: string) {
    setNombre(value)
    if (!slugManual) {
      setSlug(slugDesdeNombre(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const slugFinal = slug.trim()
    if (!nombre.trim()) {
      setError('Ingresá el nombre del restaurante')
      return
    }
    if (!esSlugValido(slugFinal)) {
      setError('El slug solo puede tener minúsculas, números y guiones (2–50 caracteres)')
      return
    }

    setGuardando(true)
    const supabase = createBrowserSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { error: insertError } = await supabase.from('restaurantes').insert({
      nombre: nombre.trim(),
      slug: slugFinal,
      owner_id: user.id,
    })

    setGuardando(false)

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Ese slug ya está en uso. Elegí otro.')
      } else {
        setError(insertError.message)
      }
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (verificando) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-500">Cargando…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-400">Creá tu restaurante</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Un paso más para empezar a usar RestoPOS
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/50 rounded-lg p-3 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div>
            <label htmlFor="nombre" className="text-xs text-zinc-400 block mb-1">
              Nombre del restaurante
            </label>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              placeholder="Ej: La Parrilla de Juan"
            />
          </div>

          <div>
            <label htmlFor="slug" className="text-xs text-zinc-400 block mb-1">
              URL del menú (slug)
            </label>
            <div className="flex items-center gap-1 text-sm text-zinc-500 mb-1">
              <span>restopos.app/</span>
            </div>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugManual(true)
                setSlug(e.target.value.toLowerCase())
              }}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 font-mono"
              placeholder="la-parrilla-de-juan"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Solo letras minúsculas, números y guiones
            </p>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-amber-400 text-black font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {guardando ? 'Creando…' : 'Crear restaurante'}
          </button>
        </form>
      </div>
    </main>
  )
}
