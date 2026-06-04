import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MADRAC-SUBS | Transcripción y Traducción con IA',
  description:
    'Transcripción y traducción profesional de video con inteligencia artificial. Descarga la app para Windows o Linux.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full bg-[#0a0a0a] text-zinc-100">
        {children}
      </body>
    </html>
  )
}
