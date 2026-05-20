import { StaffNav } from '@/components/StaffNav'

interface CocinaSlugLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function CocinaSlugLayout({
  children,
  params,
}: CocinaSlugLayoutProps) {
  const { slug } = await params

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <StaffNav slug={slug} />
      {children}
    </div>
  )
}
