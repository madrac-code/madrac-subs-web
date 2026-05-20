import { MesasImprimirView } from '@/components/MesasImprimirView'
import { requireRestaurante } from '@/lib/auth-server'
import { getMesasDelRestaurante } from '@/lib/supabase'

export default async function ImprimirMesasPage() {
  const { supabase, restaurante } = await requireRestaurante()
  const mesas = await getMesasDelRestaurante(restaurante.id, supabase)

  return <MesasImprimirView restaurante={restaurante} mesas={mesas} />
}
