import { redirect } from 'next/navigation'

/** Compatibilidad: /[slug]/admin → panel del dueño */
export default function SlugAdminRedirect() {
  redirect('/dashboard')
}
