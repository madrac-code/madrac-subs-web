import Link from 'next/link'

export default function MesaNotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-amber-400">Mesa no encontrada</h1>
        <p className="text-zinc-400">
          El número de mesa no existe. Escaneá el código QR de tu mesa.
        </p>
        <Link
          href="/mesa/1"
          className="inline-block mt-4 text-amber-400 underline"
        >
          Ir a mesa 1 (desarrollo)
        </Link>
      </div>
    </main>
  )
}
