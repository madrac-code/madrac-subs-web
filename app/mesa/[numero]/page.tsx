import { notFound } from 'next/navigation'
import { MesaCliente } from '@/components/MesaCliente'
import { getMesaPorNumero, getMenuDisponible } from '@/lib/supabase'

interface MesaPageProps {
  params: Promise<{ numero: string }>
}

export default async function MesaPage({ params }: MesaPageProps) {
  const { numero } = await params
  const numeroMesa = Number.parseInt(numero, 10)

  if (Number.isNaN(numeroMesa) || numeroMesa < 1) {
    notFound()
  }

  const mesa = await getMesaPorNumero(numeroMesa)
  if (!mesa) {
    notFound()
  }

  const menuItems = await getMenuDisponible()

  return <MesaCliente mesa={mesa} menuItems={menuItems} />
}
