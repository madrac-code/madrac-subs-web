import { notFound } from 'next/navigation'
import { LegacyRouteBanner } from '@/components/LegacyRouteBanner'
import { MesaCliente } from '@/components/MesaCliente'
import { RESTAURANTE_DEMO_SLUG } from '@/lib/constants'
import { getMesaDemo, getMenuDisponible } from '@/lib/supabase'

interface MesaPageProps {
  params: Promise<{ numero: string }>
}

export default async function MesaLegacyPage({ params }: MesaPageProps) {
  const { numero } = await params
  const numeroMesa = Number.parseInt(numero, 10)

  if (Number.isNaN(numeroMesa) || numeroMesa < 1) {
    notFound()
  }

  const demo = await getMesaDemo(numeroMesa)
  if (!demo) {
    notFound()
  }

  const { mesa, restaurante } = demo
  const menuItems = await getMenuDisponible(restaurante.id)
  const nuevaRuta = `/${RESTAURANTE_DEMO_SLUG}/mesa/${numeroMesa}`

  return (
    <>
      <LegacyRouteBanner
        nuevaRuta={nuevaRuta}
        descripcion="esta URL de mesa cambió"
      />
      <MesaCliente
        mesa={mesa}
        menuItems={menuItems}
        restauranteId={restaurante.id}
      />
    </>
  )
}
