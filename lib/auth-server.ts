import { notFound, redirect } from 'next/navigation'
import { resolverRestauranteDelUsuario } from '@/lib/restaurante-usuario'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Restaurante, RolPerfil } from '@/types'

const ROLES_COCINA: RolPerfil[] = ['admin', 'cocinero']

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

/** Restaurante del usuario (perfil primero, luego owner) o null */
export async function getRestauranteDelUsuario(
  userId: string
): Promise<Restaurante | null> {
  const supabase = await createServerSupabaseClient()
  return resolverRestauranteDelUsuario(supabase, userId)
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

/** Restaurante por slug (server) */
export async function getRestaurantePorSlug(slug: string): Promise<Restaurante | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('restaurantes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return data as Restaurante
}

/** Sesión + rol cocinero/admin en el restaurante del slug */
export async function requireAccesoCocina(slug: string) {
  const { supabase, user } = await requireUser()
  const restaurante = await getRestaurantePorSlug(slug)

  if (!restaurante) {
    notFound()
  }

  const esOwner = restaurante.owner_id === user.id

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('user_id', user.id)
    .eq('restaurante_id', restaurante.id)
    .maybeSingle()

  const tieneRol =
    perfil !== null && ROLES_COCINA.includes(perfil.rol as RolPerfil)

  if (!esOwner && !tieneRol) {
    redirect('/login')
  }

  return { supabase, user, restaurante }
}
