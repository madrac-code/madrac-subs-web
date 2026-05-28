'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { MesaQrModal } from '@/components/MesaQrModal'
import { urlMesaQr } from '@/lib/constants'
import {
  actualizarMesa,
  crearMesa,
  eliminarMesa,
  getMesasDelRestaurante,
  getRestauranteActual,
} from '@/lib/supabase'
import type { EstadoMesa, Mesa, Restaurante } from '@/types'

const ETIQUETA_ESTADO: Record<EstadoMesa, string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  esperando: 'Esperando',
}

const COLOR_ESTADO: Record<EstadoMesa, string> = {
  libre: 'bg-green-500/20 text-green-400',
  ocupada: 'bg-amber-400/20 text-amber-400',
  esperando: 'bg-red-500/20 text-red-400',
}

export default function MesasDashboardPage() {
  const router = useRouter()
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null)
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [cargando, setCargando] = useState(true)
  const [accionId, setAccionId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [numeroEdit, setNumeroEdit] = useState('')
  const [qrMesa, setQrMesa] = useState<Mesa | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [creando, setCreando] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    const rest = await getRestauranteActual()
    if (!rest) {
      console.warn('[mesas] Sin restaurante para el usuario logueado')
      router.replace('/login')
      return
    }

    console.log('[mesas] restaurante_id:', rest.id)
    console.log('[mesas] restaurante:', rest.nombre, `(${rest.slug})`)

    setRestaurante(rest)
    const lista = await getMesasDelRestaurante(rest.id)
    console.log('[mesas] mesas cargadas:', lista.length, lista.map((m) => m.numero))
    setMesas(lista)
    setCargando(false)
  }, [router])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void cargarDatos()
    }, 0)
    return () => window.clearTimeout(id)
  }, [cargarDatos])

  function mostrarFeedback(tipo: 'ok' | 'error', texto: string) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3000)
  }

  function siguienteNumeroPreview(): number | null {
    if (mesas.length === 0) return null
    return Math.max(...mesas.map((m) => m.numero)) + 1
  }

  async function handleAgregarMesa() {
    if (!restaurante) return
    console.log('[mesas] crearMesa → restaurante_id:', restaurante.id)
    setCreando(true)
    const resultado = await crearMesa(restaurante.id)
    setCreando(false)

    if (resultado.ok) {
      setMesas((prev) =>
        [...prev, resultado.mesa].sort((a, b) => a.numero - b.numero)
      )
      mostrarFeedback('ok', `Mesa ${resultado.mesa.numero} creada`)
    } else {
      mostrarFeedback('error', resultado.error)
    }
  }

  async function handleGuardarNumero(mesa: Mesa) {
    const numero = Number.parseInt(numeroEdit, 10)
    if (Number.isNaN(numero) || numero < 1) {
      mostrarFeedback('error', 'Número de mesa inválido')
      return
    }

    setAccionId(mesa.id)
    const resultado = await actualizarMesa(mesa.id, numero)
    setAccionId(null)

    if (resultado.ok) {
      setMesas((prev) =>
        prev
          .map((m) => (m.id === mesa.id ? resultado.mesa : m))
          .sort((a, b) => a.numero - b.numero)
      )
      setEditandoId(null)
      mostrarFeedback('ok', 'Número actualizado')
    } else {
      mostrarFeedback('error', resultado.error)
    }
  }

  async function handleEliminar(mesa: Mesa) {
    if (!window.confirm(`¿Eliminar mesa ${mesa.numero}?`)) return

    setAccionId(mesa.id)
    const resultado = await eliminarMesa(mesa.id)
    setAccionId(null)

    if (resultado.ok) {
      setMesas((prev) => prev.filter((m) => m.id !== mesa.id))
      mostrarFeedback('ok', 'Mesa eliminada')
    } else {
      mostrarFeedback('error', resultado.error)
    }
  }

  if (cargando) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <p className="text-center text-zinc-500">Cargando mesas…</p>
      </main>
    )
  }

  if (!restaurante) return null

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-amber-400"
        >
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-bold text-amber-400 mt-2">Mesas y QR</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {restaurante.nombre} · {mesas.length}{' '}
          {mesas.length === 1 ? 'mesa' : 'mesas'}
        </p>
      </header>

      {mensaje && (
        <p
          className={`mb-4 p-3 rounded-lg text-sm text-center ${
            mensaje.tipo === 'ok'
              ? 'bg-green-950 text-green-400'
              : 'bg-red-950 text-red-300'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <button
          type="button"
          onClick={handleAgregarMesa}
          disabled={creando}
          className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-bold disabled:opacity-60"
        >
          {creando
            ? 'Creando…'
            : siguienteNumeroPreview() !== null
              ? `+ Agregar mesa (${siguienteNumeroPreview()})`
              : '+ Agregar mesa'}
        </button>
        <Link
          href="/dashboard/mesas/imprimir"
          className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-center text-sm"
        >
          Imprimir todos los QR
        </Link>
      </div>

      {mesas.length === 0 ? (
        <p className="text-center text-zinc-500 py-12 border border-dashed border-zinc-800 rounded-xl">
          No hay mesas. Agregá la primera con el botón de arriba.
        </p>
      ) : (
        <ul className="space-y-3">
          {mesas.map((mesa) => {
            const procesando = accionId === mesa.id
            const editando = editandoId === mesa.id
            const qrUrl = urlMesaQr(restaurante.slug, mesa.numero)

            return (
              <li
                key={mesa.id}
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  {editando ? (
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm text-zinc-400">Nº</label>
                      <input
                        type="number"
                        min={1}
                        value={numeroEdit}
                        onChange={(e) => setNumeroEdit(e.target.value)}
                        className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleGuardarNumero(mesa)}
                        disabled={procesando}
                        className="text-sm text-amber-400 font-semibold disabled:opacity-50"
                      >
                        {procesando ? '…' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoId(null)}
                        className="text-sm text-zinc-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-bold">Mesa {mesa.numero}</p>
                      <span
                        className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${COLOR_ESTADO[mesa.estado]}`}
                      >
                        {ETIQUETA_ESTADO[mesa.estado]}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-500 break-all font-mono">{qrUrl}</p>

                {!editando && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(mesa.id)
                        setNumeroEdit(String(mesa.numero))
                      }}
                      disabled={procesando}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700 disabled:opacity-50"
                    >
                      Editar número
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMesa(mesa)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700"
                    >
                      Ver QR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(mesa)}
                      disabled={procesando || mesa.estado !== 'libre'}
                      title={
                        mesa.estado !== 'libre'
                          ? 'Solo mesas libres'
                          : undefined
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-950 text-red-400 text-sm hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {procesando ? '…' : 'Eliminar'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {qrMesa && (
        <MesaQrModal
          slug={restaurante.slug}
          numero={qrMesa.numero}
          restauranteNombre={restaurante.nombre}
          onCerrar={() => setQrMesa(null)}
        />
      )}
    </main>
  )
}
