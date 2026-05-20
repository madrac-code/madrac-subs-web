import Link from 'next/link'

export default function MesaSlugNotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-amber-400">No encontrado</h1>
        <p className="text-zinc-400">
          El restaurante o la mesa no existe. Escaneá el código QR de tu mesa.
        </p>
        <Link href="/login" className="inline-block mt-4 text-zinc-500 text-sm hover:text-amber-400">
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}
