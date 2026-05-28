'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cerrarCaja } from '@/lib/supabase'
import {
  ETIQUETA_MEDIO_PAGO,
  MEDIOS_PAGO,
  type ResumenCaja,
  type Restaurante,
} from '@/types'

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface TarjetaMedioProps {
  medio: (typeof MEDIOS_PAGO)[number]
  monto: number
}

function TarjetaMedio({ medio, monto }: TarjetaMedioProps) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <p className="text-zinc-400 text-sm">{ETIQUETA_MEDIO_PAGO[medio]}</p>
      <p className="text-xl font-bold text-amber-400 mt-1">
        ${monto.toLocaleString('es-AR')}
      </p>
    </div>
  )
}

interface CajaPanelProps {
  restaurante: Restaurante
  resumen: ResumenCaja
}

export function CajaPanel({ restaurante, resumen: resumenInicial }: CajaPanelProps) {
  const [resumen, setResumen] = useState(resumenInicial)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  async function handleCerrarCaja() {
    setCerrando(true)
    setError(null)
    const resultado = await cerrarCaja(restaurante.id)
    setCerrando(false)

    if (!resultado.ok) {
      setError(resultado.error)
      return
    }

    setExito(true)
    setResumen((prev) => ({ ...prev, cajaCerradaHoy: true }))
  }

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-400">Caja del día</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {restaurante.nombre} · {new Date().toLocaleDateString('es-AR')}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex justify-center px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold"
        >
          ← Dashboard
        </Link>
      </header>

      {error && (
        <p className="mb-4 p-3 rounded-lg bg-red-950 text-red-300 text-sm">{error}</p>
      )}
      {exito && (
        <p className="mb-4 p-3 rounded-lg bg-green-950 text-green-300 text-sm">
          Caja cerrada correctamente
        </p>
      )}

      <section className="mb-6">
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 mb-4">
          <p className="text-zinc-400 text-sm">Total vendido hoy</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">
            ${resumen.totalVendido.toLocaleString('es-AR')}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {MEDIOS_PAGO.map((medio) => (
            <TarjetaMedio key={medio} medio={medio} monto={resumen.porMedio[medio]} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Pagos del día</h2>
          <span className="text-zinc-500 text-sm">{resumen.pagos.length} pagos</span>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className="p-3 font-medium">Mesa</th>
                <th className="p-3 font-medium">Ítems</th>
                <th className="p-3 font-medium">Monto</th>
                <th className="p-3 font-medium">Medio</th>
                <th className="p-3 font-medium">Hora</th>
              </tr>
            </thead>
            <tbody>
              {resumen.pagos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500">
                    No hay pagos registrados hoy
                  </td>
                </tr>
              ) : (
                resumen.pagos.map((pago) => (
                  <tr key={pago.id} className="border-t border-zinc-800">
                    <td className="p-3 font-medium">{pago.mesaNumero}</td>
                    <td className="p-3 text-zinc-300 max-w-xs truncate">
                      {pago.itemsResumen}
                    </td>
                    <td className="p-3 text-amber-400 font-semibold">
                      ${pago.monto.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3">{ETIQUETA_MEDIO_PAGO[pago.medio]}</td>
                    <td className="p-3 text-zinc-400">{formatHora(pago.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {resumen.pagos.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No hay pagos registrados hoy</p>
          ) : (
            resumen.pagos.map((pago) => (
              <div
                key={pago.id}
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">Mesa {pago.mesaNumero}</span>
                  <span className="text-zinc-400 text-sm">
                    {formatHora(pago.created_at)}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{pago.itemsResumen}</p>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm text-zinc-400">
                    {ETIQUETA_MEDIO_PAGO[pago.medio]}
                  </span>
                  <span className="text-amber-400 font-bold">
                    ${pago.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={handleCerrarCaja}
        disabled={cerrando || resumen.cajaCerradaHoy || resumen.pagos.length === 0}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {resumen.cajaCerradaHoy
          ? 'Caja ya cerrada hoy'
          : cerrando
            ? 'Cerrando…'
            : 'Cerrar caja'}
      </button>
    </main>
  )
}
