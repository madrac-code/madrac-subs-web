'use client'

import { useCallback, useEffect, useState } from 'react'
import { PedidoCocinaCard } from '@/components/PedidoCocinaCard'
import {
  avanzarEstadoPedido,
  getPedidosActivos,
  supabase,
} from '@/lib/supabase'
import type { EstadoCocina, PedidoActivo } from '@/types'
import { ESTADOS_COCINA } from '@/types'

const TITULO_COLUMNA: Record<EstadoCocina, string> = {
  pendiente: 'Pendientes',
  en_cocina: 'En cocina',
  listo: 'Listos',
}

const COLOR_COLUMNA: Record<EstadoCocina, string> = {
  pendiente: 'text-red-400',
  en_cocina: 'text-amber-400',
  listo: 'text-green-400',
}

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<PedidoActivo[]>([])
  const [cargando, setCargando] = useState(true)
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null)

  const cargarPedidos = useCallback(async () => {
    const data = await getPedidosActivos()
    setPedidos(data)
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarPedidos()

    const channel = supabase
      .channel('cocina-pedidos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          cargarPedidos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cargarPedidos])

  async function handleAvanzar(pedido: PedidoActivo) {
    setAvanzandoId(pedido.id)
    const resultado = await avanzarEstadoPedido(pedido.id, pedido.estado)
    setAvanzandoId(null)

    if (resultado.ok) {
      // El realtime también dispara recarga; esto actualiza al instante si hay lag
      await cargarPedidos()
    }
  }

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto">
      <header className="mb-6 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-400">👨‍🍳 Cocina</h1>
        <p className="text-zinc-400 text-sm mt-1">Pedidos en vivo</p>
      </header>

      {cargando ? (
        <p className="text-center text-zinc-500">Cargando pedidos…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {ESTADOS_COCINA.map((estado) => {
            const pedidosColumna = pedidos.filter((p) => p.estado === estado)

            return (
              <section key={estado} className="flex flex-col min-h-0">
                <h2
                  className={`text-lg font-semibold mb-3 sticky top-0 bg-zinc-950 py-2 ${COLOR_COLUMNA[estado]}`}
                >
                  {TITULO_COLUMNA[estado]}
                  <span className="ml-2 text-zinc-500 font-normal">
                    ({pedidosColumna.length})
                  </span>
                </h2>

                <div className="space-y-3 flex-1">
                  {pedidosColumna.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                      Sin pedidos
                    </p>
                  ) : (
                    pedidosColumna.map((pedido) => (
                      <PedidoCocinaCard
                        key={pedido.id}
                        pedido={pedido}
                        avanzando={avanzandoId === pedido.id}
                        onAvanzar={() => handleAvanzar(pedido)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
