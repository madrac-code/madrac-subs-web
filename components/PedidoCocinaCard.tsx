import type { EstadoCocina, PedidoActivo } from '@/types'

const ESTILO_ESTADO: Record<
  EstadoCocina,
  { borde: string; badge: string; etiqueta: string }
> = {
  pendiente: {
    borde: 'border-red-500/60',
    badge: 'bg-red-500/20 text-red-400',
    etiqueta: 'Pendiente',
  },
  en_cocina: {
    borde: 'border-amber-400/60',
    badge: 'bg-amber-400/20 text-amber-400',
    etiqueta: 'En cocina',
  },
  listo: {
    borde: 'border-green-500/60',
    badge: 'bg-green-500/20 text-green-400',
    etiqueta: 'Listo',
  },
}

const TEXTO_BOTON: Record<EstadoCocina, string> = {
  pendiente: '→ A cocina',
  en_cocina: '→ Listo',
  listo: '→ Entregado',
}

interface PedidoCocinaCardProps {
  pedido: PedidoActivo
  avanzando: boolean
  onAvanzar: () => void
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PedidoCocinaCard({ pedido, avanzando, onAvanzar }: PedidoCocinaCardProps) {
  const estado = pedido.estado as EstadoCocina
  const estilo = ESTILO_ESTADO[estado]
  const numeroMesa = pedido.mesas?.numero ?? '?'

  return (
    <article
      className={`bg-zinc-900 rounded-xl p-4 border-2 ${estilo.borde} space-y-3`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold">Mesa {numeroMesa}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${estilo.badge}`}>
          {estilo.etiqueta}
        </span>
      </div>

      <p className="text-zinc-500 text-sm">🕐 {formatHora(pedido.created_at)}</p>

      <ul className="space-y-1.5 text-sm">
        {pedido.pedido_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>
              <span className="font-semibold text-amber-400">{item.cantidad}×</span>{' '}
              {item.menu_items?.nombre ?? 'Ítem'}
            </span>
            {item.nota && (
              <span className="text-zinc-500 text-xs shrink-0">({item.nota})</span>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAvanzar}
        disabled={avanzando}
        className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-semibold text-sm disabled:opacity-50"
      >
        {avanzando ? 'Actualizando…' : TEXTO_BOTON[estado]}
      </button>
    </article>
  )
}
