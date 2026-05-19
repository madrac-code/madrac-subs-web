'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MenuItemForm, type MenuItemFormValues } from '@/components/MenuItemForm'
import {
  eliminarMenuItem,
  getMenuItems,
  toggleDisponibilidad,
  upsertMenuItem,
} from '@/lib/supabase'
import type { MenuItem } from '@/types'

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [accionId, setAccionId] = useState<string | null>(null)
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const categorias = useMemo(
    () => [...new Set(items.map((i) => i.categoria))],
    [items]
  )

  const cargarItems = useCallback(async () => {
    const data = await getMenuItems()
    setItems(data)
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarItems()
  }, [cargarItems])

  function mostrarFeedback(tipo: 'ok' | 'error', texto: string) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3000)
  }

  function actualizarItemEnLista(item: MenuItem) {
    setItems((prev) => {
      const existe = prev.some((i) => i.id === item.id)
      if (existe) return prev.map((i) => (i.id === item.id ? item : i))
      return [...prev, item].sort((a, b) =>
        a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)
      )
    })
  }

  async function handleToggle(item: MenuItem) {
    setAccionId(item.id)
    const resultado = await toggleDisponibilidad(item.id, !item.disponible)
    setAccionId(null)

    if (resultado.ok) {
      actualizarItemEnLista(resultado.item)
      mostrarFeedback('ok', `${resultado.item.nombre} ${resultado.item.disponible ? 'activado' : 'desactivado'}`)
    } else {
      mostrarFeedback('error', resultado.error)
    }
  }

  async function handleGuardar(item: MenuItem, values: MenuItemFormValues) {
    setAccionId(item.id)
    const resultado = await upsertMenuItem({ id: item.id, ...values })
    setAccionId(null)

    if (resultado.ok) {
      actualizarItemEnLista(resultado.item)
      setEditandoId(null)
      mostrarFeedback('ok', 'Cambios guardados')
    } else {
      mostrarFeedback('error', resultado.error)
    }
  }

  async function handleCrear(values: MenuItemFormValues) {
    setGuardandoNuevo(true)
    const resultado = await upsertMenuItem(values)
    setGuardandoNuevo(false)

    if (resultado.ok) {
      actualizarItemEnLista(resultado.item)
      setMostrarNuevo(false)
      mostrarFeedback('ok', 'Ítem agregado')
    } else {
      mostrarFeedback('error', resultado.error)
    }
  }

  async function handleEliminar(item: MenuItem) {
    if (!window.confirm(`¿Eliminar "${item.nombre}"?`)) return

    setAccionId(item.id)
    const resultado = await eliminarMenuItem(item.id)
    setAccionId(null)

    if (resultado.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      if (editandoId === item.id) setEditandoId(null)
      mostrarFeedback('ok', 'Ítem eliminado')
    } else {
      mostrarFeedback('error', resultado.error)
    }
  }

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link href="/admin" className="text-sm text-zinc-400 hover:text-amber-400">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-amber-400 mt-2">
          Gestión del menú
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
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

      {!mostrarNuevo ? (
        <button
          type="button"
          onClick={() => setMostrarNuevo(true)}
          className="w-full mb-6 py-3 rounded-xl border-2 border-dashed border-amber-400/50 text-amber-400 font-semibold hover:bg-amber-400/10"
        >
          + Agregar ítem
        </button>
      ) : (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-2">Nuevo ítem</h2>
          <MenuItemForm
            onSubmit={handleCrear}
            onCancel={() => setMostrarNuevo(false)}
            guardando={guardandoNuevo}
            submitLabel="Crear ítem"
          />
        </div>
      )}

      {cargando ? (
        <p className="text-center text-zinc-500">Cargando menú…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-zinc-500 py-8">No hay ítems en el menú</p>
      ) : (
        <div className="space-y-8">
          {categorias.map((cat) => (
            <section key={cat}>
              <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2 mb-3">
                {cat}
              </h2>
              <div className="space-y-3">
                {items
                  .filter((i) => i.categoria === cat)
                  .map((item) => {
                    const procesando = accionId === item.id
                    const editando = editandoId === item.id

                    if (editando) {
                      return (
                        <div key={item.id}>
                          <MenuItemForm
                            initial={item}
                            onSubmit={(values) => handleGuardar(item, values)}
                            onCancel={() => setEditandoId(null)}
                            guardando={procesando}
                          />
                        </div>
                      )
                    }

                    return (
                      <article
                        key={item.id}
                        className={`bg-zinc-900 rounded-xl p-4 border ${
                          item.disponible ? 'border-zinc-800' : 'border-zinc-700 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{item.nombre}</p>
                            {item.descripcion && (
                              <p className="text-zinc-400 text-sm mt-0.5">
                                {item.descripcion}
                              </p>
                            )}
                            <p className="text-amber-400 font-bold mt-1">
                              ${item.precio.toLocaleString('es-AR')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggle(item)}
                            disabled={procesando}
                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold disabled:opacity-50 ${
                              item.disponible
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {procesando
                              ? '…'
                              : item.disponible
                                ? 'Activo'
                                : 'Inactivo'}
                          </button>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => setEditandoId(item.id)}
                            disabled={procesando}
                            className="flex-1 py-2 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700 disabled:opacity-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(item)}
                            disabled={procesando}
                            className="px-4 py-2 rounded-lg bg-red-950 text-red-400 text-sm hover:bg-red-900 disabled:opacity-50"
                          >
                            {procesando ? '…' : 'Eliminar'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
