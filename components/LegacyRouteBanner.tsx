import Link from 'next/link'

interface LegacyRouteBannerProps {
  nuevaRuta: string
  descripcion: string
}

export function LegacyRouteBanner({ nuevaRuta, descripcion }: LegacyRouteBannerProps) {
  return (
    <div className="bg-amber-400/10 border border-amber-400/30 text-amber-200 text-sm px-4 py-3 text-center">
      <p>
        Ruta legacy — {descripcion}. Usá{' '}
        <Link href={nuevaRuta} className="font-semibold text-amber-400 underline">
          {nuevaRuta}
        </Link>
      </p>
    </div>
  )
}
