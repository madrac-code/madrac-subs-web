import Link from 'next/link'
import { getResumenAdmin, getUltimosPedidos } from '@/lib/supabase'
import type { EstadoPedido } from '@/types'

const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_cocina: 'En cocina',
  listo: 'Listo',
  entregado: 'Entregado',
}

const COLOR_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'text-red-400',
  en_cocina: 'text-amber-400',
  listo: 'text-green-400',
  entregado: 'text-zinc-400',
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatItems(items: { nombre: string; cantidad: number }[]): string {
  return items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')
}

interface TarjetaResumenProps {
  titulo: string
  valor: string
  subtitulo?: string
}

function TarjetaResumen({ titulo, valor, subtitulo }: TarjetaResumenProps) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <p className="text-zinc-400 text-sm">{titulo}</p>
      <p className="text-2xl font-bold text-amber-400 mt-1">{valor}</p>
      {subtitulo && <p className="text-zinc-500 text-xs mt-1">{subtitulo}</p>}
    </div>
  )
}

export default async function AdminPage() {
  const [resumen, ultimosPedidos] = await Promise.all([
    getResumenAdmin(),
    getUltimosPedidos(10),
  ])

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-400">Panel Admin</h1>
          <p className="text-zinc-400 text-sm mt-1">Resumen del día</p>
        </div>
        <Link
          href="/admin/menu"
          className="inline-flex justify-center px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold"
        >
          Gestionar menú →
        </Link>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <TarjetaResumen
          titulo="Ventas del día"
          valor={`$${resumen.ventasDelDia.toLocaleString('es-AR')}`}
          subtitulo="Pedidos entregados hoy"
        />
        <TarjetaResumen
          titulo="Pedidos hoy"
          valor={String(resumen.pedidosHoy)}
        />
        <TarjetaResumen
          titulo="Mesas ocupadas"
          valor={String(resumen.mesasOcupadas)}
        />
        <TarjetaResumen
          titulo="Plato más pedido"
          valor={resumen.platoMasPedido ?? '—'}
          subtitulo="Hoy"
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Últimos pedidos</h2>

        <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className="p-3 font-medium">Mesa</th>
                <th className="p-3 font-medium">Ítems</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">Hora</th>
              </tr>
            </thead>
            <tbody>
              {ultimosPedidos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500">
                    No hay pedidos todavía
                  </td>
                </tr>
              ) : (
                ultimosPedidos.map((pedido) => (
                  <tr key={pedido.id} className="border-t border-zinc-800">
                    <td className="p-3 font-medium">
                      {pedido.mesaNumero ?? '?'}
                    </td>
                    <td className="p-3 text-zinc-300 max-w-xs truncate">
                      {formatItems(pedido.items)}
                    </td>
                    <td className="p-3 text-amber-400 font-semibold">
                      ${pedido.total.toLocaleString('es-AR')}
                    </td>
                    <td className={`p-3 font-medium ${COLOR_ESTADO[pedido.estado]}`}>
                      {ETIQUETA_ESTADO[pedido.estado]}
                    </td>
                    <td className="p-3 text-zinc-400">
                      {formatHora(pedido.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista mobile: tarjetas */}
        <div className="md:hidden space-y-3">
          {ultimosPedidos.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No hay pedidos todavía</p>
          ) : (
            ultimosPedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">Mesa {pedido.mesaNumero ?? '?'}</span>
                  <span className="text-zinc-400 text-sm">
                    {formatHora(pedido.created_at)}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{formatItems(pedido.items)}</p>
                <div className="flex justify-between items-center pt-1">
                  <span className={`text-sm font-medium ${COLOR_ESTADO[pedido.estado]}`}>
                    {ETIQUETA_ESTADO[pedido.estado]}
                  </span>
                  <span className="text-amber-400 font-bold">
                    ${pedido.total.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
