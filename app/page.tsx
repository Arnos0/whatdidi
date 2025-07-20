import { HomepageHeader } from '@/components/ui/homepage-header'
import { Footer } from '@/components/ui/footer'
import { HomepageContent } from '@/components/homepage-content'

export default function Home() {
  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen pt-16 bg-gradient-to-br from-background via-background to-primary/5">
        <HomepageContent />
      </main>
      <Footer />
    </>
  )
}