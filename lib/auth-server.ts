import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Restaurante } from '@/types'

/** Usuario autenticado o redirect a login */
export async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}

/** Restaurante del usuario (owner o perfil) o null */
export async function getRestauranteDelUsuario(
  userId: string
): Promise<Restaurante | null> {
  const supabase = await createServerSupabaseClient()

  const { data: owned } = await supabase
    .from('restaurantes')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (owned) return owned as Restaurante

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('restaurantes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!perfil?.restaurantes) return null

  const restaurante = perfil.restaurantes
  if (Array.isArray(restaurante)) {
    return (restaurante[0] as Restaurante) ?? null
  }
  return restaurante as Restaurante
}

/** Usuario + restaurante o redirect a onboarding */
export async function requireRestaurante() {
  const { supabase, user } = await requireUser()
  const restaurante = await getRestauranteDelUsuario(user.id)

  if (!restaurante) {
    redirect('/onboarding')
  }

  return { supabase, user, restaurante }
}

/** Indica si el usuario ya tiene un restaurante (para callbacks) */
export async function usuarioTieneRestaurante(userId: string): Promise<boolean> {
  const restaurante = await getRestauranteDelUsuario(userId)
  return restaurante !== null
}
