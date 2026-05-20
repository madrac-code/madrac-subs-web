/** Genera un slug URL-safe desde el nombre del restaurante */
export function slugDesdeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function esSlugValido(slug: string): boolean {
  return SLUG_REGEX.test(slug) && slug.length >= 2 && slug.length <= 50
}
