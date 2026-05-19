'use client'

import type { MenuItem, MenuItemInput } from '@/types'

export type MenuItemFormValues = Omit<MenuItemInput, 'id'>

interface MenuItemFormProps {
  initial?: Partial<MenuItem>
  onSubmit: (values: MenuItemFormValues) => void
  onCancel: () => void
  guardando: boolean
  submitLabel?: string
}

const inputClass =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400'

export function MenuItemForm({
  initial,
  onSubmit,
  onCancel,
  guardando,
  submitLabel = 'Guardar',
}: MenuItemFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const precio = Number(form.get('precio'))

    if (!form.get('nombre') || Number.isNaN(precio) || precio < 0) return

    onSubmit({
      nombre: String(form.get('nombre')),
      descripcion: String(form.get('descripcion') || '') || null,
      precio,
      categoria: String(form.get('categoria')),
      disponible: form.get('disponible') === 'on',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
      <div>
        <label className="text-xs text-zinc-400 block mb-1">Nombre</label>
        <input
          name="nombre"
          required
          defaultValue={initial?.nombre ?? ''}
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-xs text-zinc-400 block mb-1">Descripción</label>
        <input
          name="descripcion"
          defaultValue={initial?.descripcion ?? ''}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Precio</label>
          <input
            name="precio"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial?.precio ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Categoría</label>
          <input
            name="categoria"
            required
            defaultValue={initial?.categoria ?? ''}
            className={inputClass}
            placeholder="Ej: Entradas"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="disponible"
          type="checkbox"
          defaultChecked={initial?.disponible ?? true}
          className="rounded accent-amber-400"
        />
        Disponible en el menú
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 bg-amber-400 text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={guardando}
          className="px-4 py-2 rounded-lg bg-zinc-700 text-sm hover:bg-zinc-600 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
