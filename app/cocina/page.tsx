import { CocinaBoard } from '@/components/CocinaBoard'
import { LegacyRouteBanner } from '@/components/LegacyRouteBanner'
import { RESTAURANTE_DEMO_SLUG } from '@/lib/constants'
import { getRestaurantePorSlug } from '@/lib/auth-server'
import { notFound } from 'next/navigation'

export default async function CocinaLegacyPage() {
  const restaurante = await getRestaurantePorSlug(RESTAURANTE_DEMO_SLUG)
  if (!restaurante) {
    notFound()
  }

  const nuevaRuta = `/${RESTAURANTE_DEMO_SLUG}/cocina`

  return (
    <>
      <LegacyRouteBanner
        nuevaRuta={nuevaRuta}
        descripcion="la cocina ahora es por restaurante"
      />
      <CocinaBoard
        restauranteId={restaurante.id}
        restauranteNombre={restaurante.nombre}
      />
    </>
  )
}
