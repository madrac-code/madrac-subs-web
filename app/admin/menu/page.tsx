import { redirect } from 'next/navigation'

/** Legacy: redirige al menú del dashboard */
export default function AdminMenuLegacyPage() {
  redirect('/dashboard/menu')
}
