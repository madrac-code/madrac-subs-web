import { notFound } from 'next/navigation'
import { MesaCliente } from '@/components/MesaCliente'
import { getRestaurantePorSlug } from '@/lib/auth-server'
import { getMesaPorNumero, getMenuDisponible } from '@/lib/supabase'

interface MesaSlugPageProps {
  params: Promise<{ slug: string; numero: string }>
}

export default async function MesaSlugPage({ params }: MesaSlugPageProps) {
  const { slug, numero } = await params
  const numeroMesa = Number.parseInt(numero, 10)

  if (Number.isNaN(numeroMesa) || numeroMesa < 1) {
    notFound()
  }

  const restaurante = await getRestaurantePorSlug(slug)
  if (!restaurante) {
    notFound()
  }

  const mesa = await getMesaPorNumero(numeroMesa, restaurante.id)
  if (!mesa) {
    notFound()
  }

  const menuItems = await getMenuDisponible(restaurante.id)

  return (
    <MesaCliente
      mesa={mesa}
      menuItems={menuItems}
      restauranteId={restaurante.id}
    />
  )
}
