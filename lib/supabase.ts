import type { SupabaseClient } from '@supabase/supabase-js'
import { RESTAURANTE_DEMO_SLUG, TZ_NEGOCIO, TZ_OFFSET } from '@/lib/constants'
import { resolverRestauranteDelUsuario } from '@/lib/restaurante-usuario'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import type {
  CarritoItem,
  EstadoPedido,
  MedioPago,
  MenuItem,
  MenuItemInput,
  Mesa,
  MesaParaCobro,
  PagoConDetalle,
  PedidoActivo,
  PedidoResumen,
  ResumenAdmin,
  ResumenCaja,
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

  const { data: mesaActual } = await supabase
    .from('mesas')
    .select('estado')
    .eq('id', mesaId)
    .single()

  const mesaUpdate: { estado: string; ocupado_at?: string; cerrado_at?: null } = {
    estado: 'ocupada',
  }
  if (mesaActual?.estado === 'libre') {
    mesaUpdate.ocupado_at = new Date().toISOString()
    mesaUpdate.cerrado_at = null
  }

  await supabase.from('mesas').update(mesaUpdate).eq('id', mesaId)

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

/** Fecha calendario de hoy en Argentina (YYYY-MM-DD) */
export function fechaHoyNegocio(): string {
  const { y, m, d } = fechaEnTz(new Date())
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m)}-${pad(d)}`
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

  const mesasCerradasHoyQuery = database
    .from('mesas')
    .select('ocupado_at, cerrado_at')
    .eq('restaurante_id', restauranteId)
    .not('cerrado_at', 'is', null)
    .gte('cerrado_at', inicio)
    .lte('cerrado_at', fin)

  const [
    { data: pedidosEntregados },
    { count: pedidosHoy },
    { count: mesasOcupadas },
    { data: pedidosHoyLista },
    { data: mesasCerradasHoy },
  ] = await Promise.all([
    pedidosEntregadosQuery,
    pedidosHoyQuery,
    mesasOcupadasQuery,
    pedidosHoyListaQuery,
    mesasCerradasHoyQuery,
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

  let tiempoPromedioMesa: number | null = null
  const duraciones: number[] = []
  for (const mesa of mesasCerradasHoy ?? []) {
    if (!mesa.ocupado_at || !mesa.cerrado_at) continue
    const inicioMs = new Date(mesa.ocupado_at).getTime()
    const finMs = new Date(mesa.cerrado_at).getTime()
    if (finMs > inicioMs) {
      duraciones.push((finMs - inicioMs) / 60_000)
    }
  }
  if (duraciones.length > 0) {
    tiempoPromedioMesa = Math.round(
      duraciones.reduce((a, b) => a + b, 0) / duraciones.length
    )
  }

  return {
    ventasDelDia,
    pedidosHoy: pedidosHoy ?? 0,
    mesasOcupadas: mesasOcupadas ?? 0,
    platoMasPedido: platoMasFrecuente(conteoPlatos),
    tiempoPromedioMesa,
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

const PEDIDO_ESTADO_SELECT = `
  id,
  mesa_id,
  estado,
  created_at
`

/** Pedido por id (seguimiento cliente) */
export async function getPedidoPorId(pedidoId: string): Promise<{
  id: string
  estado: EstadoPedido
  created_at: string
} | null> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(PEDIDO_ESTADO_SELECT)
    .eq('id', pedidoId)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id,
    estado: data.estado as EstadoPedido,
    created_at: data.created_at,
  }
}

type PedidoSesionRaw = {
  id: string
  estado: string
  pedido_items: PedidoItemConPrecioRaw[]
}

/** Total de pedidos de la sesión actual de una mesa ocupada */
async function totalSesionMesa(
  mesaId: string,
  restauranteId: string,
  ocupadoAt: string | null
): Promise<{ total: number; pedidoId: string | null; todosEntregados: boolean }> {
  let query = db()
    .from('pedidos')
    .select('id, estado, pedido_items ( cantidad, menu_items ( nombre, precio ) )')
    .eq('mesa_id', mesaId)
    .eq('restaurante_id', restauranteId)
    .order('created_at', { ascending: true })

  if (ocupadoAt) {
    query = query.gte('created_at', ocupadoAt)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return { total: 0, pedidoId: null, todosEntregados: false }
  }

  const pedidos = data as PedidoSesionRaw[]
  let total = 0
  let todosEntregados = true

  for (const pedido of pedidos) {
    if (pedido.estado !== 'entregado') todosEntregados = false
    total += calcularTotalItems(pedido.pedido_items ?? [])
  }

  return {
    total,
    pedidoId: pedidos[pedidos.length - 1]?.id ?? null,
    todosEntregados,
  }
}

/** Mesas ocupadas con todos los pedidos entregados (pendientes de cobro) */
export async function getMesasPendientesCobro(
  restauranteId: string
): Promise<MesaParaCobro[]> {
  const { data: mesas, error } = await supabase
    .from('mesas')
    .select('id, numero, ocupado_at')
    .eq('restaurante_id', restauranteId)
    .eq('estado', 'ocupada')

  if (error || !mesas) return []

  const resultados: MesaParaCobro[] = []

  for (const mesa of mesas) {
    const { total, pedidoId, todosEntregados } = await totalSesionMesa(
      mesa.id,
      restauranteId,
      mesa.ocupado_at
    )
    if (todosEntregados && pedidoId && total > 0) {
      resultados.push({
        mesaId: mesa.id,
        numeroMesa: mesa.numero,
        pedidoId,
        total,
      })
    }
  }

  return resultados
}

export type CerrarMesaResult =
  | { ok: true; mesa: Mesa }
  | { ok: false; error: string }

/** Cierra mesa si todos los pedidos de la sesión están entregados */
export async function cerrarMesa(
  mesaId: string,
  restauranteId: string
): Promise<CerrarMesaResult> {
  const { data: mesa, error: mesaError } = await supabase
    .from('mesas')
    .select('*')
    .eq('id', mesaId)
    .eq('restaurante_id', restauranteId)
    .single()

  if (mesaError || !mesa) {
    return { ok: false, error: 'Mesa no encontrada' }
  }

  if (mesa.estado !== 'ocupada') {
    return { ok: false, error: 'La mesa no está ocupada' }
  }

  const { todosEntregados } = await totalSesionMesa(
    mesaId,
    restauranteId,
    mesa.ocupado_at
  )

  if (!todosEntregados) {
    return { ok: false, error: 'Hay pedidos sin entregar' }
  }

  const ahora = new Date().toISOString()
  const { data: actualizada, error: updateError } = await supabase
    .from('mesas')
    .update({ estado: 'libre', cerrado_at: ahora })
    .eq('id', mesaId)
    .select()
    .single()

  if (updateError || !actualizada) {
    return { ok: false, error: updateError?.message ?? 'No se pudo cerrar la mesa' }
  }

  return { ok: true, mesa: actualizada as Mesa }
}

export type RegistrarPagoResult =
  | { ok: true; pagoId: string }
  | { ok: false; error: string }

/** Registra un pago y cierra la mesa */
export async function registrarPago(
  pedidoId: string,
  mesaId: string,
  restauranteId: string,
  monto: number,
  medio: MedioPago
): Promise<RegistrarPagoResult> {
  if (monto <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a cero' }
  }

  const { data: pago, error: pagoError } = await supabase
    .from('pagos')
    .insert({
      pedido_id: pedidoId,
      mesa_id: mesaId,
      restaurante_id: restauranteId,
      monto,
      medio,
    })
    .select('id')
    .single()

  if (pagoError || !pago) {
    return { ok: false, error: pagoError?.message ?? 'No se pudo registrar el pago' }
  }

  const cierre = await cerrarMesa(mesaId, restauranteId)
  if (!cierre.ok) {
    return { ok: false, error: cierre.error }
  }

  return { ok: true, pagoId: pago.id }
}

type PagoDelDiaRaw = {
  id: string
  pedido_id: string
  mesa_id: string
  restaurante_id: string
  monto: number
  medio: string
  created_at: string
  mesas: { numero: number } | { numero: number }[] | null
  pedidos: {
    pedido_items: {
      cantidad: number
      menu_items: { nombre: string } | { nombre: string }[] | null
    }[]
  } | {
    pedido_items: {
      cantidad: number
      menu_items: { nombre: string } | { nombre: string }[] | null
    }[]
  }[] | null
}

function normalizarPagoDelDia(raw: PagoDelDiaRaw): PagoConDetalle {
  const pedido = unwrapRelation(raw.pedidos)
  const items = pedido?.pedido_items ?? []
  const itemsResumen = items
    .map((item) => {
      const menu = unwrapRelation(item.menu_items)
      return `${item.cantidad}× ${menu?.nombre ?? 'Ítem'}`
    })
    .join(', ')

  return {
    id: raw.id,
    pedido_id: raw.pedido_id,
    mesa_id: raw.mesa_id,
    restaurante_id: raw.restaurante_id,
    monto: raw.monto,
    medio: raw.medio as MedioPago,
    created_at: raw.created_at,
    mesaNumero: unwrapRelation(raw.mesas)?.numero ?? 0,
    itemsResumen: itemsResumen || '—',
  }
}

const PAGO_DEL_DIA_SELECT = `
  id,
  pedido_id,
  mesa_id,
  restaurante_id,
  monto,
  medio,
  created_at,
  mesas ( numero ),
  pedidos (
    pedido_items (
      cantidad,
      menu_items ( nombre )
    )
  )
`

/** Resumen de caja del día */
export async function getResumenCaja(
  restauranteId: string,
  client?: SupabaseClient
): Promise<ResumenCaja> {
  const { inicio, fin } = rangoHoy()
  const database = db(client)
  const fecha = fechaHoyNegocio()

  const pagosQuery = database
    .from('pagos')
    .select(PAGO_DEL_DIA_SELECT)
    .eq('restaurante_id', restauranteId)
    .gte('created_at', inicio)
    .lte('created_at', fin)
    .order('created_at', { ascending: false })

  const cierreQuery = database
    .from('cierres_caja')
    .select('id')
    .eq('restaurante_id', restauranteId)
    .eq('fecha', fecha)
    .maybeSingle()

  const [{ data: pagosRaw }, { data: cierre }] = await Promise.all([
    pagosQuery,
    cierreQuery,
  ])

  const pagos = ((pagosRaw ?? []) as PagoDelDiaRaw[]).map(normalizarPagoDelDia)
  const porMedio: Record<MedioPago, number> = {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    qr_pago: 0,
  }

  let totalVendido = 0
  for (const pago of pagos) {
    totalVendido += pago.monto
    porMedio[pago.medio] += pago.monto
  }

  return {
    totalVendido,
    porMedio,
    pagos,
    cajaCerradaHoy: cierre !== null,
  }
}

export type CerrarCajaResult =
  | { ok: true; cierreId: string }
  | { ok: false; error: string }

/** Genera cierre de caja del día */
export async function cerrarCaja(
  restauranteId: string,
  client?: SupabaseClient
): Promise<CerrarCajaResult> {
  const resumen = await getResumenCaja(restauranteId, client)
  const fecha = fechaHoyNegocio()

  if (resumen.cajaCerradaHoy) {
    return { ok: false, error: 'La caja de hoy ya fue cerrada' }
  }

  const detalle_json = {
    total: resumen.totalVendido,
    porMedio: resumen.porMedio,
    cantidadPagos: resumen.pagos.length,
  }

  const { data, error } = await db(client)
    .from('cierres_caja')
    .insert({
      restaurante_id: restauranteId,
      fecha,
      total: resumen.totalVendido,
      detalle_json,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo cerrar la caja' }
  }

  return { ok: true, cierreId: data.id }
}
