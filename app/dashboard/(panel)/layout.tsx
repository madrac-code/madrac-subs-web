import { StaffNav } from '@/components/StaffNav'

export default function DashboardPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StaffNav />
      {children}
    </>
  )
}
