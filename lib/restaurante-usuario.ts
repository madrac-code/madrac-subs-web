import type { SupabaseClient } from '@supabase/supabase-js'
import type { Restaurante } from '@/types'

function restauranteDesdePerfil(
  restaurantes: Restaurante | Restaurante[] | null
): Restaurante | null {
  if (!restaurantes) return null
  if (Array.isArray(restaurantes)) {
    return restaurantes[0] ?? null
  }
  return restaurantes
}

/**
 * Restaurante activo del usuario: primero por perfil (staff/admin),
 * luego por owner_id (dueño que creó el local).
 */
export async function resolverRestauranteDelUsuario(
  client: SupabaseClient,
  userId: string
): Promise<Restaurante | null> {
  const { data: perfil } = await client
    .from('perfiles')
    .select('restaurantes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const desdePerfil = restauranteDesdePerfil(
    perfil?.restaurantes as Restaurante | Restaurante[] | null
  )
  if (desdePerfil) return desdePerfil

  const { data: owned } = await client
    .from('restaurantes')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (owned as Restaurante) ?? null
}
