import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/** Rutas reservadas que no son slug de restaurante */
const RUTAS_RESERVADAS = new Set([
  'login',
  'onboarding',
  'dashboard',
  'auth',
  'admin',
  'cocina',
  'mesa',
  'api',
  '_next',
])

/** /[slug]/mesa/[numero] es público (sin auth) */
function esMesaPublica(pathname: string): boolean {
  const segmentos = pathname.split('/').filter(Boolean)
  return (
    segmentos.length === 3 &&
    !RUTAS_RESERVADAS.has(segmentos[0]) &&
    segmentos[1] === 'mesa'
  )
}

/** Rutas que requieren sesión activa */
function requiereAuth(pathname: string): boolean {
  if (esMesaPublica(pathname)) return false
  if (pathname.startsWith('/dashboard')) return true
  if (pathname.startsWith('/onboarding')) return true
  // /[slug]/cocina o /[slug]/admin (no confundir con /admin legacy en raíz)
  const segmentos = pathname.split('/').filter(Boolean)
  if (segmentos.length >= 2 && !RUTAS_RESERVADAS.has(segmentos[0])) {
    const sub = segmentos[1]
    if (sub === 'cocina' || sub === 'admin') return true
  }
  return false
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (requiereAuth(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === '/login' && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
