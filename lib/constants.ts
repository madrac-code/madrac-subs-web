/** Slug del restaurante de demo para /mesa/[numero] sin auth */
export const RESTAURANTE_DEMO_SLUG = 'mi-restaurante'

/** Zona horaria del negocio (Argentina, sin DST) */
export const TZ_NEGOCIO = 'America/Argentina/Buenos_Aires'
export const TZ_OFFSET = '-03:00'

/** URL pública de la app (QR de mesas) */
export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://resto-app-silk.vercel.app'

/** URL del menú QR para una mesa */
export function urlMesaQr(slug: string, numero: number): string {
  return `${APP_BASE_URL}/${slug}/mesa/${numero}`
}
