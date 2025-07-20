import Link from 'next/link'
import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { HomepageContent } from '@/components/homepage-content'
import { 
  ArrowRight, 
  Mail, 
  Package, 
  TrendingUp, 
  Shield, 
  Smartphone,
  CheckCircle,
  Sparkles
} from 'lucide-react'

const features = [
  {
    icon: Mail,
    title: 'Email Integration',
    description: 'Connect your Gmail or Outlook to automatically track orders from any retailer',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Package,
    title: 'Smart Tracking',
    description: 'Real-time delivery updates and package tracking from all major carriers',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: TrendingUp,
    title: 'Spending Analytics',
    description: 'Visualize your shopping patterns and spending trends with beautiful charts',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and never shared. Complete privacy guaranteed',
    color: 'from-orange-500 to-orange-600'
  }
]

const retailers = [
  { name: 'Bol.com', logo: '🛍️' },
  { name: 'Amazon', logo: '📦' },
  { name: 'Coolblue', logo: '💻' },
  { name: 'Zalando', logo: '👕' },
  { name: 'MediaMarkt', logo: '📱' },
  { name: 'HEMA', logo: '🏠' }
]

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 bg-gradient-to-br from-background via-background to-primary/5">
        <HomepageContent features={features} retailers={retailers} />
      </main>
      <Footer />
    </>
  )
}