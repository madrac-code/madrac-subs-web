'use client'

import { useMemo, useState } from 'react'
import { crearPedido } from '@/lib/supabase'
import type { CarritoItem, MenuItem, Mesa } from '@/types'
import { MenuItemCard } from '@/components/MenuItemCard'
import { CarritoBar } from '@/components/CarritoBar'

interface MesaClienteProps {
  mesa: Mesa
  menuItems: MenuItem[]
  restauranteId: string
}

function cantidadEnCarrito(carrito: CarritoItem[], menuItemId: string): number {
  return carrito.find((c) => c.menuItem.id === menuItemId)?.cantidad ?? 0
}

export function MesaCliente({ mesa, menuItems, restauranteId }: MesaClienteProps) {
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pedidoEnviadoId, setPedidoEnviadoId] = useState<string | null>(null)

  const categorias = useMemo(
    () => [...new Set(menuItems.map((i) => i.categoria))],
    [menuItems]
  )

  const totalItems = carrito.reduce((sum, c) => sum + c.cantidad, 0)
  const totalPrecio = carrito.reduce(
    (sum, c) => sum + c.menuItem.precio * c.cantidad,
    0
  )

  function agregarItem(item: MenuItem) {
    setError(null)
    setCarrito((prev) => {
      const existente = prev.find((c) => c.menuItem.id === item.id)
      if (existente) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c
        )
      }
      return [...prev, { menuItem: item, cantidad: 1 }]
    })
  }

  function quitarItem(item: MenuItem) {
    setError(null)
    setCarrito((prev) => {
      const existente = prev.find((c) => c.menuItem.id === item.id)
      if (!existente) return prev
      if (existente.cantidad <= 1) {
        return prev.filter((c) => c.menuItem.id !== item.id)
      }
      return prev.map((c) =>
        c.menuItem.id === item.id ? { ...c, cantidad: c.cantidad - 1 } : c
      )
    })
  }

  async function enviarPedido() {
    if (carrito.length === 0) return
    setEnviando(true)
    setError(null)

    const resultado = await crearPedido(mesa.id, carrito, restauranteId)

    setEnviando(false)

    if (!resultado.ok) {
      setError(resultado.error)
      return
    }

    setPedidoEnviadoId(resultado.pedidoId)
    setCarrito([])
  }

  function nuevoPedido() {
    setPedidoEnviadoId(null)
    setError(null)
  }

  if (pedidoEnviadoId) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold text-amber-400">¡Pedido enviado!</h1>
          <p className="text-zinc-400">
            Tu pedido fue recibido en cocina. Te avisamos cuando esté listo.
          </p>
          <p className="text-sm text-zinc-500">
            Pedido #{pedidoEnviadoId.slice(0, 8)}
          </p>
          <button
            type="button"
            onClick={nuevoPedido}
            className="w-full bg-zinc-800 hover:bg-zinc-700 font-semibold py-3 rounded-xl"
          >
            Hacer otro pedido
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 pb-28">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400">🍽️ Mesa {mesa.numero}</h1>
          <p className="text-zinc-400 mt-1">Elegí lo que querés pedir</p>
        </header>

        {error && (
          <p className="mb-4 p-3 rounded-lg bg-red-950 text-red-300 text-sm text-center">
            {error}
          </p>
        )}

        <div className="space-y-6">
          {categorias.map((cat) => (
            <section key={cat}>
              <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2 mb-3">
                {cat}
              </h2>
              <div className="space-y-3">
                {menuItems
                  .filter((i) => i.categoria === cat)
                  .map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      cantidadEnCarrito={cantidadEnCarrito(carrito, item.id)}
                      onAgregar={() => agregarItem(item)}
                      onQuitar={() => quitarItem(item)}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <CarritoBar
        totalItems={totalItems}
        totalPrecio={totalPrecio}
        enviando={enviando}
        onEnviar={enviarPedido}
      />
    </main>
  )
}
