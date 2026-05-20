import { redirect } from 'next/navigation'
import { RESTAURANTE_DEMO_SLUG } from '@/lib/constants'

export default function Home() {
  redirect(`/${RESTAURANTE_DEMO_SLUG}/mesa/1`)
}
