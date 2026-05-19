import type { MenuItem } from '@/types'

interface MenuItemCardProps {
  item: MenuItem
  cantidadEnCarrito: number
  onAgregar: () => void
  onQuitar: () => void
}

export function MenuItemCard({
  item,
  cantidadEnCarrito,
  onAgregar,
  onQuitar,
}: MenuItemCardProps) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 flex justify-between items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{item.nombre}</p>
        {item.descripcion && (
          <p className="text-zinc-400 text-sm mt-0.5">{item.descripcion}</p>
        )}
        <p className="text-amber-400 font-bold mt-1">
          ${item.precio.toLocaleString('es-AR')}
        </p>
      </div>

      {cantidadEnCarrito > 0 ? (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onQuitar}
            className="w-9 h-9 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700"
            aria-label={`Quitar ${item.nombre}`}
          >
            −
          </button>
          <span className="w-6 text-center font-semibold">{cantidadEnCarrito}</span>
          <button
            type="button"
            onClick={onAgregar}
            className="w-9 h-9 rounded-lg bg-amber-400 text-black font-bold hover:bg-amber-300"
            aria-label={`Agregar ${item.nombre}`}
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAgregar}
          className="shrink-0 px-4 py-2 rounded-lg bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300"
        >
          Agregar
        </button>
      )}
    </div>
  )
}
