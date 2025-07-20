import { HomepageHeader } from '@/components/ui/homepage-header'
import { Footer } from '@/components/ui/footer'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import Link from 'next/link'
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
      <HomepageHeader />
      <main className="min-h-screen pt-16 bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }} />
          
          <Container className="relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-primary/10 border border-primary/20 text-primary font-medium text-sm mb-8">
                <Sparkles className="h-4 w-4" />
                Track every purchase, never miss a delivery
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold font-display text-gradient leading-tight mb-8">
                Never lose track of
                <br />
                <span className="text-gradient">what you bought</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-2xl mx-auto">
                WhatDidiShop automatically tracks all your online purchases and deliveries in one beautiful dashboard. 
                Connect your email, and we&apos;ll handle the rest with AI-powered order recognition.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="gradient" size="lg" asChild className="text-lg px-8 py-4">
                  <Link href="/sign-up">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="text-lg px-8 py-4">
                  <Link href="/sign-in">
                    <Smartphone className="mr-2 h-5 w-5" />
                    Try Demo
                  </Link>
                </Button>
              </div>
              
              <div className="mt-16 text-sm text-muted-foreground">
                ✨ Free forever • 🔒 Privacy first • 📱 Works everywhere
              </div>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-20 relative">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-display text-gradient mb-6">
                Everything you need
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to make order tracking effortless and insightful
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title}>
                    <GlassCard className="p-6 h-full hover:shadow-glow-lg transition-all duration-300 group">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-xl font-semibold font-display mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </GlassCard>
                  </div>
                )
              })}
            </div>
          </Container>
        </section>

        {/* Retailers Section */}
        <section className="py-20">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
                Works with all your favorite stores
              </h2>
              <p className="text-lg text-muted-foreground">
                Automatically recognizes orders from hundreds of retailers
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {retailers.map((retailer) => (
                <div
                  key={retailer.name}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-background/50 border border-border/50"
                >
                  <span className="text-2xl">{retailer.logo}</span>
                  <span className="font-medium text-foreground">{retailer.name}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
          <Container className="relative">
            <div className="text-center">
              <GlassCard className="p-12 max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold font-display text-gradient mb-6">
                  Ready to get organized?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of users who never miss a delivery or lose track of their purchases
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button variant="premium" size="xl" asChild>
                    <Link href="/sign-up">
                      Start Tracking Now
                      <CheckCircle className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="xl" asChild>
                    <Link href="/sign-in">
                      View Demo
                    </Link>
                  </Button>
                </div>
              </GlassCard>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  )
}