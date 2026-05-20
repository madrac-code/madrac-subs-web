'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { urlMesaQr } from '@/lib/constants'
import type { Mesa, Restaurante } from '@/types'

interface MesasImprimirViewProps {
  restaurante: Restaurante
  mesas: Mesa[]
}

export function MesasImprimirView({ restaurante, mesas }: MesasImprimirViewProps) {
  return (
    <>
      <div className="no-print fixed top-4 right-4 left-4 flex justify-between items-center gap-4 z-10">
        <Link
          href="/dashboard/mesas"
          className="text-sm text-zinc-400 hover:text-amber-400"
        >
          ← Volver
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold text-sm"
        >
          Imprimir
        </button>
      </div>

      <div className="print-page p-8 pt-20 print:pt-8">
        <h1 className="text-center text-2xl font-bold mb-2 print:text-black">
          {restaurante.nombre}
        </h1>
        <p className="text-center text-zinc-500 text-sm mb-10 print:text-gray-600">
          Escaneá el QR de tu mesa para ver el menú
        </p>

        {mesas.length === 0 ? (
          <p className="text-center text-zinc-500">No hay mesas configuradas</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto print:grid-cols-3">
            {mesas.map((mesa) => {
              const qrUrl = urlMesaQr(restaurante.slug, mesa.numero)
              return (
                <div
                  key={mesa.id}
                  className="flex flex-col items-center break-inside-avoid page-break-inside-avoid"
                >
                  <div className="bg-white p-3 rounded-lg print:p-2">
                    <QRCodeSVG value={qrUrl} size={140} level="M" />
                  </div>
                  <p className="mt-3 font-bold text-lg print:text-black">
                    Mesa {mesa.numero}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 print:text-gray-500">
                    {restaurante.nombre}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </>
  )
}
