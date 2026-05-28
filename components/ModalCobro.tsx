'use client'

import { useState } from 'react'
import { ETIQUETA_MEDIO_PAGO, MEDIOS_PAGO, type MedioPago } from '@/types'

interface ModalCobroProps {
  numeroMesa: number
  total: number
  procesando: boolean
  onConfirmar: (monto: number, medio: MedioPago) => void
  onCancelar: () => void
}

export function ModalCobro({
  numeroMesa,
  total,
  procesando,
  onConfirmar,
  onCancelar,
}: ModalCobroProps) {
  const [medio, setMedio] = useState<MedioPago>('efectivo')
  const [monto, setMonto] = useState(String(total))

  function handleConfirmar() {
    const montoNum = Number.parseInt(monto, 10)
    if (Number.isNaN(montoNum) || montoNum <= 0) return
    onConfirmar(montoNum, medio)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70">
      <div
        role="dialog"
        aria-labelledby="modal-cobro-titulo"
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-5"
      >
        <header>
          <h2 id="modal-cobro-titulo" className="text-xl font-bold text-amber-400">
            Cobrar mesa {numeroMesa}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Todos los pedidos fueron entregados
          </p>
        </header>

        <div>
          <p className="text-zinc-400 text-sm mb-2">Medio de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {MEDIOS_PAGO.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMedio(m)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${
                  medio === m
                    ? 'bg-amber-400 text-zinc-950 border-amber-400'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {ETIQUETA_MEDIO_PAGO[m]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="monto-cobro" className="text-zinc-400 text-sm block mb-2">
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <input
              id="monto-cobro"
              type="number"
              min={1}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-8 pr-4 text-lg font-bold text-amber-400 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={procesando}
            className="flex-1 py-3 rounded-xl bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold disabled:opacity-50"
          >
            {procesando ? 'Procesando…' : 'Confirmar y cerrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
