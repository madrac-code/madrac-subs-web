interface CarritoBarProps {
  totalItems: number
  totalPrecio: number
  enviando: boolean
  onEnviar: () => void
}

export function CarritoBar({
  totalItems,
  totalPrecio,
  enviando,
  onEnviar,
}: CarritoBarProps) {
  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-sm">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm text-zinc-400">
            {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
          </p>
          <p className="text-lg font-bold text-amber-400">
            ${totalPrecio.toLocaleString('es-AR')}
          </p>
        </div>
        <button
          type="button"
          onClick={onEnviar}
          disabled={enviando}
          className="flex-1 bg-amber-400 text-black font-bold py-3 rounded-xl disabled:opacity-60"
        >
          {enviando ? 'Enviando…' : 'Enviar pedido'}
        </button>
      </div>
    </div>
  )
}
