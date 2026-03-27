import { listLibrary } from '@/lib/db'
import { HomeClient } from '@/components/HomeClient'

export default async function Home() {
  const library = listLibrary()
  return <HomeClient initialLibrary={library} />
}
