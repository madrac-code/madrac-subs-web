'use client'

import { useEffect, useState } from 'react'
import { getPedidoPorId, supabase } from '@/lib/supabase'
import type { EstadoPedido } from '@/types'

const PASOS: { estado: EstadoPedido; etiqueta: string }[] = [
  { estado: 'pendiente', etiqueta: 'Recibido' },
  { estado: 'en_cocina', etiqueta: 'En preparación' },
  { estado: 'listo', etiqueta: 'Listo' },
  { estado: 'entregado', etiqueta: 'Entregado' },
]

const INDICE_ESTADO: Record<EstadoPedido, number> = {
  pendiente: 0,
  en_cocina: 1,
  listo: 2,
  entregado: 3,
}

interface SeguimientoPedidoProps {
  pedidoId: string
  onNuevoPedido: () => void
}

export function SeguimientoPedido({ pedidoId, onNuevoPedido }: SeguimientoPedidoProps) {
  const [estado, setEstado] = useState<EstadoPedido>('pendiente')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargar() {
      const pedido = await getPedidoPorId(pedidoId)
      if (activo && pedido) {
        setEstado(pedido.estado)
      }
      if (activo) setCargando(false)
    }

    void cargar()

    const channel = supabase
      .channel(`pedido-seguimiento-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => {
          const nuevo = payload.new as { estado?: EstadoPedido }
          if (nuevo.estado) {
            setEstado(nuevo.estado)
          }
        }
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [pedidoId])

  const pasoActual = INDICE_ESTADO[estado]
  const listo = estado === 'listo'
  const entregado = estado === 'entregado'

  if (cargando) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-6 flex items-center justify-center">
        <p className="text-zinc-500">Cargando seguimiento…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto w-full space-y-8">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-amber-400">Seguimiento del pedido</h1>
          <p className="text-zinc-500 text-sm mt-1">#{pedidoId.slice(0, 8)}</p>
        </header>

        <div className="relative px-2">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-zinc-800" />
          <div
            className="absolute top-4 left-6 h-0.5 bg-amber-400 transition-all duration-500"
            style={{ width: `calc(${(pasoActual / (PASOS.length - 1)) * 100}% - 1.5rem)` }}
          />
          <ol className="relative flex justify-between">
            {PASOS.map((paso, i) => {
              const completado = i <= pasoActual
              const actual = i === pasoActual
              return (
                <li key={paso.estado} className="flex flex-col items-center gap-2 w-16">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      completado
                        ? 'bg-amber-400 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-600 border-zinc-700'
                    } ${actual ? 'ring-2 ring-amber-400/50 ring-offset-2 ring-offset-zinc-950' : ''}`}
                  >
                    {completado ? '✓' : i + 1}
                  </span>
                  <span
                    className={`text-[10px] text-center leading-tight ${
                      actual ? 'text-amber-400 font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    {paso.etiqueta}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {listo && !entregado && (
          <div className="p-4 rounded-xl bg-green-950 border border-green-700 text-center animate-pulse">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-green-400 font-bold text-lg">¡Tu pedido está listo!</p>
            <p className="text-green-300/70 text-sm mt-1">
              Un mozo lo llevará a tu mesa en breve
            </p>
          </div>
        )}

        {entregado && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-center">
            <p className="text-zinc-300">Pedido entregado. ¡Buen provecho!</p>
          </div>
        )}

        {entregado && (
          <button
            type="button"
            onClick={onNuevoPedido}
            className="w-full bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold py-3 rounded-xl"
          >
            Hacer otro pedido
          </button>
        )}
      </div>
    </main>
  )
}
