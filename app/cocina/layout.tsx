import { StaffNav } from '@/components/StaffNav'

export default function CocinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <StaffNav />
      {children}
    </div>
  )
}
