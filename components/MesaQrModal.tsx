'use client'

import { QRCodeSVG } from 'qrcode.react'
import { urlMesaQr } from '@/lib/constants'

interface MesaQrModalProps {
  slug: string
  numero: number
  restauranteNombre: string
  onCerrar: () => void
}

export function MesaQrModal({ slug, numero, restauranteNombre, onCerrar }: MesaQrModalProps) {
  const qrUrl = urlMesaQr(slug, numero)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-titulo"
    >
      <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-zinc-700 shadow-xl">
        <h2 id="qr-titulo" className="text-lg font-bold text-amber-400 text-center">
          Mesa {numero}
        </h2>
        <p className="text-zinc-400 text-sm text-center mt-1">{restauranteNombre}</p>

        <div className="flex justify-center my-6 bg-white p-4 rounded-xl">
          <QRCodeSVG value={qrUrl} size={200} level="M" />
        </div>

        <p className="text-xs text-zinc-500 text-center break-all">{qrUrl}</p>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-6 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
