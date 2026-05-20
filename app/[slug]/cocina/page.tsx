import { CocinaBoard } from '@/components/CocinaBoard'
import { requireAccesoCocina } from '@/lib/auth-server'

interface CocinaSlugPageProps {
  params: Promise<{ slug: string }>
}

export default async function CocinaSlugPage({ params }: CocinaSlugPageProps) {
  const { slug } = await params
  const { restaurante } = await requireAccesoCocina(slug)

  return (
    <CocinaBoard
      restauranteId={restaurante.id}
      restauranteNombre={restaurante.nombre}
    />
  )
}
