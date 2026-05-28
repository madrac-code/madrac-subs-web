import { redirect } from 'next/navigation'

/** Legacy: redirige al dashboard */
export default function AdminLegacyPage() {
  redirect('/dashboard')
}
