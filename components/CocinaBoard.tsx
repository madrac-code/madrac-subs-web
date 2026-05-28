'use client'

import { useCallback, useEffect, useState } from 'react'
import { ModalCobro } from '@/components/ModalCobro'
import { PedidoCocinaCard } from '@/components/PedidoCocinaCard'
import {
  avanzarEstadoPedido,
  getMesasPendientesCobro,
  getPedidosActivos,
  registrarPago,
  supabase,
} from '@/lib/supabase'
import type { EstadoCocina, MedioPago, MesaParaCobro, PedidoActivo } from '@/types'
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

interface CocinaBoardProps {
  restauranteId: string
  restauranteNombre: string
}

export function CocinaBoard({ restauranteId, restauranteNombre }: CocinaBoardProps) {
  const [pedidos, setPedidos] = useState<PedidoActivo[]>([])
  const [mesasParaCobro, setMesasParaCobro] = useState<MesaParaCobro[]>([])
  const [cargando, setCargando] = useState(true)
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null)
  const [mesaCobro, setMesaCobro] = useState<MesaParaCobro | null>(null)
  const [procesandoCobro, setProcesandoCobro] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    const [activos, cobro] = await Promise.all([
      getPedidosActivos(restauranteId),
      getMesasPendientesCobro(restauranteId),
    ])
    setPedidos(activos)
    setMesasParaCobro(cobro)
    setCargando(false)
  }, [restauranteId])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void cargarDatos()
    }, 0)

    const channel = supabase
      .channel(`cocina-pedidos-${restauranteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `restaurante_id=eq.${restauranteId}`,
        },
        () => {
          void cargarDatos()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mesas',
          filter: `restaurante_id=eq.${restauranteId}`,
        },
        () => {
          void cargarDatos()
        }
      )
      .subscribe()

    return () => {
      window.clearTimeout(id)
      supabase.removeChannel(channel)
    }
  }, [restauranteId, cargarDatos])

  async function handleAvanzar(pedido: PedidoActivo) {
    setAvanzandoId(pedido.id)
    const resultado = await avanzarEstadoPedido(pedido.id, pedido.estado)
    setAvanzandoId(null)

    if (resultado.ok) {
      await cargarDatos()

      if (pedido.estado === 'listo') {
        const cobro = await getMesasPendientesCobro(restauranteId)
        const mesa = cobro.find((m) => m.mesaId === pedido.mesa_id)
        if (mesa) {
          setMesaCobro(mesa)
        }
      }
    }
  }

  async function handleConfirmarCobro(monto: number, medio: MedioPago) {
    if (!mesaCobro) return
    setProcesandoCobro(true)

    const resultado = await registrarPago(
      mesaCobro.pedidoId,
      mesaCobro.mesaId,
      restauranteId,
      monto,
      medio
    )

    setProcesandoCobro(false)

    if (resultado.ok) {
      setMesaCobro(null)
      await cargarDatos()
    }
  }

  function abrirCobroMesa(mesa: MesaParaCobro) {
    setMesaCobro(mesa)
  }

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto">
      <header className="mb-6 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-400">👨‍🍳 Cocina</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {restauranteNombre} · Pedidos en vivo
        </p>
      </header>

      {mesasParaCobro.length > 0 && (
        <section className="mb-6 space-y-2">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
            Pendientes de cobro
          </h2>
          <div className="flex flex-wrap gap-2">
            {mesasParaCobro.map((mesa) => (
              <button
                key={mesa.mesaId}
                type="button"
                onClick={() => abrirCobroMesa(mesa)}
                className="px-4 py-2 rounded-xl bg-green-950 border border-green-700 text-green-400 text-sm font-semibold hover:bg-green-900"
              >
                Mesa {mesa.numeroMesa} · ${mesa.total.toLocaleString('es-AR')} · Cobrar y cerrar
              </button>
            ))}
          </div>
        </section>
      )}

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

      {mesaCobro && (
        <ModalCobro
          numeroMesa={mesaCobro.numeroMesa}
          total={mesaCobro.total}
          procesando={procesandoCobro}
          onConfirmar={handleConfirmarCobro}
          onCancelar={() => setMesaCobro(null)}
        />
      )}
    </main>
  )
}
