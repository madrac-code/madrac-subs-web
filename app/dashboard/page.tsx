import { DashboardPanel } from '@/components/DashboardPanel'
import { requireRestaurante } from '@/lib/auth-server'
import { getResumenAdmin, getUltimosPedidos } from '@/lib/supabase'

export default async function DashboardPage() {
  const { supabase, restaurante } = await requireRestaurante()

  const [resumen, ultimosPedidos] = await Promise.all([
    getResumenAdmin(restaurante.id, supabase),
    getUltimosPedidos(10, restaurante.id, supabase),
  ])

  return (
    <DashboardPanel
      restaurante={restaurante}
      resumen={resumen}
      ultimosPedidos={ultimosPedidos}
    />
  )
}
