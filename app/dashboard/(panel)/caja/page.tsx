import { CajaPanel } from '@/components/CajaPanel'
import { requireRestaurante } from '@/lib/auth-server'
import { getResumenCaja } from '@/lib/supabase'

export default async function CajaPage() {
  const { supabase, restaurante } = await requireRestaurante()
  const resumen = await getResumenCaja(restaurante.id, supabase)

  return <CajaPanel restaurante={restaurante} resumen={resumen} />
}
