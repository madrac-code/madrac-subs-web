import './print.css'

export default function ImprimirMesasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white print:bg-white print:text-black">
      {children}
    </div>
  )
}
