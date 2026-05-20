export type RolPerfil = 'admin' | 'cocinero' | 'mozo'

export interface Restaurante {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
  color_primario: string
  owner_id: string | null
  created_at: string
}

export interface Perfil {
  id: string
  user_id: string
  restaurante_id: string
  rol: RolPerfil
  created_at: string
}

export type EstadoMesa = 'libre' | 'ocupada' | 'esperando'

export type EstadoPedido = 'pendiente' | 'en_cocina' | 'listo' | 'entregado'

export interface Mesa {
  id: string
  numero: number
  estado: EstadoMesa
  restaurante_id: string
  created_at: string
}

export interface MenuItem {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: string
  disponible: boolean
  restaurante_id: string
  created_at: string
}

/** Datos para crear o actualizar un ítem del menú */
export interface MenuItemInput {
  id?: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: string
  disponible: boolean
}

export interface Pedido {
  id: string
  mesa_id: string
  restaurante_id: string
  estado: EstadoPedido
  created_at: string
}

export interface PedidoItem {
  id: string
  pedido_id: string
  menu_item_id: string
  cantidad: number
  nota: string | null
}

/** Item en el carrito local antes de enviar el pedido */
export interface CarritoItem {
  menuItem: MenuItem
  cantidad: number
  nota?: string
}

/** Ítem de pedido con nombre del plato (join menu_items) */
export interface PedidoItemConMenu {
  id: string
  cantidad: number
  nota: string | null
  menu_items: { nombre: string } | null
}

/** Pedido activo para cocina con mesa e ítems */
export interface PedidoActivo {
  id: string
  mesa_id: string
  estado: EstadoPedido
  created_at: string
  mesas: { numero: number } | null
  pedido_items: PedidoItemConMenu[]
}

export const ESTADOS_COCINA = ['pendiente', 'en_cocina', 'listo'] as const
export type EstadoCocina = (typeof ESTADOS_COCINA)[number]

/** Métricas del panel de administración */
export interface ResumenAdmin {
  ventasDelDia: number
  pedidosHoy: number
  mesasOcupadas: number
  platoMasPedido: string | null
}

/** Pedido resumido para la tabla del admin */
export interface PedidoResumen {
  id: string
  estado: EstadoPedido
  created_at: string
  mesaNumero: number | null
  items: { nombre: string; cantidad: number }[]
  total: number
}
