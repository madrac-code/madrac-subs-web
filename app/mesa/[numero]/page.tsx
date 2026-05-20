import { notFound } from 'next/navigation'
import { MesaCliente } from '@/components/MesaCliente'
import { getMesaDemo, getMenuDisponible } from '@/lib/supabase'

interface MesaPageProps {
  params: Promise<{ numero: string }>
}

export default async function MesaPage({ params }: MesaPageProps) {
  const { numero } = await params
  const numeroMesa = Number.parseInt(numero, 10)

  if (Number.isNaN(numeroMesa) || numeroMesa < 1) {
    notFound()
  }

  const demo = await getMesaDemo(numeroMesa)
  if (!demo) {
    notFound()
  }

  const { mesa } = demo
  const menuItems = await getMenuDisponible(demo.restaurante.id)

  return <MesaCliente mesa={mesa} menuItems={menuItems} />
}
