import type { SupabaseClient } from '@supabase/supabase-js'
import { RESTAURANTE_DEMO_SLUG, TZ_NEGOCIO, TZ_OFFSET } from '@/lib/constants'
import { resolverRestauranteDelUsuario } from '@/lib/restaurante-usuario'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import type {
  CarritoItem,
  EstadoPedido,
  MenuItem,
  MenuItemInput,
  Mesa,
  PedidoActivo,
  PedidoResumen,
  ResumenAdmin,
  Restaurante,
} from '@/types'

export const supabase = createBrowserSupabaseClient()

function db(client?: SupabaseClient) {
  return client ?? supabase
}

/** Restaurante por slug (menú público / demo) */
export async function getRestaurantePorSlug(slug: string): Promise<Restaurante | null> {
  const { data, error } = await supabase
    .from('restaurantes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return data as Restaurante
}

/** Busca una mesa por número dentro de un restaurante */
export async function getMesaPorNumero(
  numero: number,
  restauranteId: string
): Promise<Mesa | null> {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('numero', numero)
    .eq('restaurante_id', restauranteId)
    .maybeSingle()

  if (error || !data) return null
  return data as Mesa
}

/** Mesa demo para /mesa/[numero] (restaurante mi-restaurante) */
export async function getMesaDemo(numero: number): Promise<{
  mesa: Mesa
  restaurante: Restaurante
} | null> {
  const restaurante = await getRestaurantePorSlug(RESTAURANTE_DEMO_SLUG)
  if (!restaurante) return null
  const mesa = await getMesaPorNumero(numero, restaurante.id)
  if (!mesa) return null
  return { mesa, restaurante }
}

export type MutacionMesaResult =
  | { ok: true; mesa: Mesa }
  | { ok: false; error: string }

/** Mesas de un restaurante ordenadas por número */
export async function getMesasDelRestaurante(
  restauranteId: string,
  client?: SupabaseClient
): Promise<Mesa[]> {
  const { data, error } = await db(client)
    .from('mesas')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('numero', { ascending: true })

  if (error || !data) return []
  return data as Mesa[]
}

/** Siguiente número de mesa disponible en un restaurante */
async function siguienteNumeroMesa(
  restauranteId: string,
  client?: SupabaseClient
): Promise<number> {
  const { data, error } = await db(client)
    .from('mesas')
    .select('numero')
    .eq('restaurante_id', restauranteId)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return 1
  return data.numero + 1
}

/** Crea una mesa libre en el restaurante */
export async function crearMesa(
  restauranteId: string,
  numero?: number
): Promise<MutacionMesaResult> {
  const numeroFinal =
    numero ?? (await siguienteNumeroMesa(restauranteId))

  const { data, error } = await supabase
    .from('mesas')
    .insert({
      restaurante_id: restauranteId,
      numero: numeroFinal,
      estado: 'libre',
    })
    .select()
    .single()

  if (error || !data) {
    if (error?.code === '23505') {
      return { ok: false, error: 'Ya existe una mesa con ese número' }
    }
    return { ok: false, error: error?.message ?? 'No se pudo crear la mesa' }
  }
  return { ok: true, mesa: data as Mesa }
}

/** Elimina una mesa (solo si está libre) */
export async function eliminarMesa(
  mesaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: mesa, error: fetchError } = await supabase
    .from('mesas')
    .select('estado')
    .eq('id', mesaId)
    .single()

  if (fetchError || !mesa) {
    return { ok: false, error: 'Mesa no encontrada' }
  }
  if (mesa.estado !== 'libre') {
    return { ok: false, error: 'Solo se puede eliminar una mesa libre' }
  }

  const { error } = await supabase.from('mesas').delete().eq('id', mesaId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Actualiza el número de una mesa */
export async function actualizarMesa(
  mesaId: string,
  numero: number
): Promise<MutacionMesaResult> {
  const { data, error } = await supabase
    .from('mesas')
    .update({ numero })
    .eq('id', mesaId)
    .select()
    .single()

  if (error || !data) {
    if (error?.code === '23505') {
      return { ok: false, error: 'Ya existe una mesa con ese número' }
    }
    return { ok: false, error: error?.message ?? 'No se pudo actualizar' }
  }
  return { ok: true, mesa: data as Mesa }
}

/** Restaurante del usuario logueado (client; perfil primero, luego owner) */
export async function getRestauranteActual(): Promise<Restaurante | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return resolverRestauranteDelUsuario(supabase, user.id)
}

export type MutacionMenuResult =
  | { ok: true; item: MenuItem }
  | { ok: false; error: string }

/** Todos los ítems del menú de un restaurante */
export async function getMenuItems(restauranteId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('categoria')
    .order('nombre')

  if (error || !data) return []
  return data as MenuItem[]
}

/** Menú disponible ordenado por categoría */
export async function getMenuDisponible(restauranteId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .eq('disponible', true)
    .order('categoria')

  if (error || !data) return []
  return data as MenuItem[]
}

/** Activa o desactiva un ítem del menú */
export async function toggleDisponibilidad(
  id: string,
  disponible: boolean
): Promise<MutacionMenuResult> {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ disponible })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo actualizar' }
  }
  return { ok: true, item: data as MenuItem }
}

/** Crea o actualiza un ítem según si trae id */
export async function upsertMenuItem(item: MenuItemInput): Promise<MutacionMenuResult> {
  const payload = {
    nombre: item.nombre.trim(),
    descripcion: item.descripcion?.trim() || null,
    precio: item.precio,
    categoria: item.categoria.trim(),
    disponible: item.disponible,
  }

  if (item.id) {
    const { data, error } = await supabase
      .from('menu_items')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single()

    if (error || !data) {
      return { ok: false, error: error?.message ?? 'No se pudo guardar' }
    }
    return { ok: true, item: data as MenuItem }
  }

  if (!item.restaurante_id) {
    return { ok: false, error: 'restaurante_id requerido para crear ítem' }
  }

  const { data, error } = await supabase
    .from('menu_items')
    .insert({ ...payload, restaurante_id: item.restaurante_id })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear' }
  }
  return { ok: true, item: data as MenuItem }
}

/** Elimina un ítem del menú */
export async function eliminarMenuItem(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export type CrearPedidoResult =
  | { ok: true; pedidoId: string }
  | { ok: false; error: string }

/** Crea un pedido con sus ítems y marca la mesa como ocupada */
export async function crearPedido(
  mesaId: string,
  items: CarritoItem[],
  restauranteId: string
): Promise<CrearPedidoResult> {
  if (items.length === 0) {
    return { ok: false, error: 'El carrito está vacío' }
  }

  const { data: mesa } = await supabase
    .from('mesas')
    .select('restaurante_id')
    .eq('id', mesaId)
    .eq('restaurante_id', restauranteId)
    .single()

  if (!mesa?.restaurante_id) {
    return { ok: false, error: 'Mesa no encontrada' }
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      mesa_id: mesaId,
      restaurante_id: restauranteId,
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (pedidoError || !pedido) {
    return { ok: false, error: pedidoError?.message ?? 'No se pudo crear el pedido' }
  }

  const pedidoItems = items.map((item) => ({
    pedido_id: pedido.id,
    menu_item_id: item.menuItem.id,
    cantidad: item.cantidad,
    nota: item.nota ?? null,
  }))

  const { error: itemsError } = await supabase.from('pedido_items').insert(pedidoItems)

  if (itemsError) {
    return { ok: false, error: itemsError.message }
  }

  await supabase.from('mesas').update({ estado: 'ocupada' }).eq('id', mesaId)

  return { ok: true, pedidoId: pedido.id }
}

const PEDIDO_ACTIVO_SELECT = `
  id,
  mesa_id,
  estado,
  created_at,
  mesas ( numero ),
  pedido_items (
    id,
    cantidad,
    nota,
    menu_items ( nombre )
  )
`

/** Supabase puede devolver relaciones FK como objeto o array */
type PedidoActivoRaw = {
  id: string
  mesa_id: string
  estado: string
  created_at: string
  mesas: { numero: number } | { numero: number }[] | null
  pedido_items: {
    id: string
    cantidad: number
    nota: string | null
    menu_items: { nombre: string } | { nombre: string }[] | null
  }[]
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizarPedido(raw: PedidoActivoRaw): PedidoActivo {
  return {
    id: raw.id,
    mesa_id: raw.mesa_id,
    estado: raw.estado as PedidoActivo['estado'],
    created_at: raw.created_at,
    mesas: unwrapRelation(raw.mesas),
    pedido_items: raw.pedido_items.map((item) => ({
      id: item.id,
      cantidad: item.cantidad,
      nota: item.nota,
      menu_items: unwrapRelation(item.menu_items),
    })),
  }
}

/** Pedidos no entregados con ítems y número de mesa */
export async function getPedidosActivos(restauranteId: string): Promise<PedidoActivo[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(PEDIDO_ACTIVO_SELECT)
    .eq('restaurante_id', restauranteId)
    .neq('estado', 'entregado')
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return (data as PedidoActivoRaw[]).map(normalizarPedido)
}

const SIGUIENTE_ESTADO: Record<string, EstadoPedido> = {
  pendiente: 'en_cocina',
  en_cocina: 'listo',
  listo: 'entregado',
}

/** Avanza un pedido al siguiente estado del flujo */
export async function avanzarEstadoPedido(
  pedidoId: string,
  estadoActual: EstadoPedido
): Promise<{ ok: true } | { ok: false; error: string }> {
  const nuevoEstado = SIGUIENTE_ESTADO[estadoActual]
  if (!nuevoEstado) {
    return { ok: false, error: 'Estado no válido' }
  }

  const { error } = await supabase
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', pedidoId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Partes de fecha en la zona horaria del negocio */
function fechaEnTz(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_NEGOCIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)

  return { y: get('year'), m: get('month'), d: get('day') }
}

/** Inicio y fin del día en Argentina (UTC-3), como ISO UTC para filtros Supabase */
function rangoHoy(): { inicio: string; fin: string } {
  const { y, m, d } = fechaEnTz(new Date())
  const pad = (n: number) => String(n).padStart(2, '0')
  const fecha = `${y}-${pad(m)}-${pad(d)}`

  return {
    inicio: new Date(`${fecha}T00:00:00${TZ_OFFSET}`).toISOString(),
    fin: new Date(`${fecha}T23:59:59.999${TZ_OFFSET}`).toISOString(),
  }
}

type PedidoItemConPrecioRaw = {
  cantidad: number
  menu_items: { nombre: string; precio: number } | { nombre: string; precio: number }[] | null
}

function calcularTotalItems(items: PedidoItemConPrecioRaw[]): number {
  return items.reduce((sum, item) => {
    const menu = unwrapRelation(item.menu_items)
    return sum + item.cantidad * (menu?.precio ?? 0)
  }, 0)
}

function contarPlatosHoy(items: PedidoItemConPrecioRaw[]): Map<string, number> {
  const conteo = new Map<string, number>()
  for (const item of items) {
    const menu = unwrapRelation(item.menu_items)
    const nombre = menu?.nombre ?? 'Desconocido'
    conteo.set(nombre, (conteo.get(nombre) ?? 0) + item.cantidad)
  }
  return conteo
}

function platoMasFrecuente(conteo: Map<string, number>): string | null {
  let maxNombre: string | null = null
  let maxCantidad = 0
  for (const [nombre, cantidad] of conteo) {
    if (cantidad > maxCantidad) {
      maxCantidad = cantidad
      maxNombre = nombre
    }
  }
  return maxNombre
}

/** Resumen del día para el panel del dueño */
export async function getResumenAdmin(
  restauranteId: string,
  client?: SupabaseClient
): Promise<ResumenAdmin> {
  const { inicio, fin } = rangoHoy()
  const database = db(client)

  const pedidosEntregadosQuery = database
    .from('pedidos')
    .select('pedido_items ( cantidad, menu_items ( nombre, precio ) )')
    .eq('restaurante_id', restauranteId)
    .eq('estado', 'entregado')
    .gte('created_at', inicio)
    .lte('created_at', fin)

  const pedidosHoyQuery = database
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('restaurante_id', restauranteId)
    .gte('created_at', inicio)
    .lte('created_at', fin)

  const mesasOcupadasQuery = database
    .from('mesas')
    .select('*', { count: 'exact', head: true })
    .eq('restaurante_id', restauranteId)
    .neq('estado', 'libre')

  const pedidosHoyListaQuery = database
    .from('pedidos')
    .select('id, pedido_items ( cantidad, menu_items ( nombre, precio ) )')
    .eq('restaurante_id', restauranteId)
    .gte('created_at', inicio)
    .lte('created_at', fin)

  const [
    { data: pedidosEntregados },
    { count: pedidosHoy },
    { count: mesasOcupadas },
    { data: pedidosHoyLista },
  ] = await Promise.all([
    pedidosEntregadosQuery,
    pedidosHoyQuery,
    mesasOcupadasQuery,
    pedidosHoyListaQuery,
  ])

  let ventasDelDia = 0
  const conteoPlatos = new Map<string, number>()

  for (const pedido of pedidosEntregados ?? []) {
    const items = (pedido.pedido_items ?? []) as PedidoItemConPrecioRaw[]
    ventasDelDia += calcularTotalItems(items)
  }

  for (const pedido of pedidosHoyLista ?? []) {
    const items = (pedido.pedido_items ?? []) as PedidoItemConPrecioRaw[]
    const parcial = contarPlatosHoy(items)
    for (const [nombre, cantidad] of parcial) {
      conteoPlatos.set(nombre, (conteoPlatos.get(nombre) ?? 0) + cantidad)
    }
  }

  return {
    ventasDelDia,
    pedidosHoy: pedidosHoy ?? 0,
    mesasOcupadas: mesasOcupadas ?? 0,
    platoMasPedido: platoMasFrecuente(conteoPlatos),
  }
}

type PedidoResumenRaw = {
  id: string
  estado: string
  created_at: string
  mesas: { numero: number } | { numero: number }[] | null
  pedido_items: PedidoItemConPrecioRaw[]
}

function normalizarPedidoResumen(raw: PedidoResumenRaw): PedidoResumen {
  const items = raw.pedido_items.map((item) => {
    const menu = unwrapRelation(item.menu_items)
    return {
      nombre: menu?.nombre ?? 'Ítem',
      cantidad: item.cantidad,
      precio: menu?.precio ?? 0,
    }
  })

  return {
    id: raw.id,
    estado: raw.estado as PedidoResumen['estado'],
    created_at: raw.created_at,
    mesaNumero: unwrapRelation(raw.mesas)?.numero ?? null,
    items: items.map(({ nombre, cantidad }) => ({ nombre, cantidad })),
    total: items.reduce((sum, i) => sum + i.cantidad * i.precio, 0),
  }
}

const PEDIDO_RESUMEN_SELECT = `
  id,
  estado,
  created_at,
  mesas ( numero ),
  pedido_items (
    cantidad,
    menu_items ( nombre, precio )
  )
`

/** Últimos pedidos con detalle para la tabla del admin */
export async function getUltimosPedidos(
  limit: number,
  restauranteId: string,
  client?: SupabaseClient
): Promise<PedidoResumen[]> {
  const { data, error } = await db(client)
    .from('pedidos')
    .select(PEDIDO_RESUMEN_SELECT)
    .eq('restaurante_id', restauranteId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return (data as PedidoResumenRaw[]).map(normalizarPedidoResumen)
}
