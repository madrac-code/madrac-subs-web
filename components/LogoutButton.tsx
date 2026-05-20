'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

export function LogoutButton() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)

  async function cerrarSesion() {
    setCargando(true)
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      disabled={cargando}
      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold disabled:opacity-60"
    >
      {cargando ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}
