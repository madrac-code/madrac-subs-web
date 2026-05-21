import { StaffNav } from '@/components/StaffNav'
import { requireRestaurante } from '@/lib/auth-server'

export default async function DashboardPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { restaurante } = await requireRestaurante()
  return (
    <>
      <StaffNav slug={restaurante.slug} />
      {children}
    </>
  )
}
