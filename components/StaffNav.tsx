import Link from 'next/link'

interface StaffNavProps {
  slug?: string
}

export function StaffNav({ slug }: StaffNavProps) {
  const links = slug
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: `/${slug}/cocina`, label: 'Cocina' },
        { href: '/admin/menu', label: 'Menú' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/cocina', label: 'Cocina' },
        { href: '/admin/menu', label: 'Menú' },
      ]

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-1">
        <span className="text-amber-400 font-bold mr-4">RestoPOS</span>
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
