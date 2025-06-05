import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import { 
  ArrowRight, 
  Database, 
  Shield, 
  Clock, 
  Cloud, 
  Zap, 
  CheckCircle,
  Github
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const features = [
    {
      icon: Database,
      title: "Complete Database Backups",
      description: "Full schema and data backups of your Supabase databases with consistent snapshots."
    },
    {
      icon: Shield,
      title: "Secure & Encrypted",
      description: "All backups are encrypted at rest and in transit, ensuring your data remains secure."
    },
    {
      icon: Clock,
      title: "Automated Scheduling",
      description: "Set up automated backup schedules with flexible retention policies."
    },
    {
      icon: Cloud,
      title: "Multiple Storage Options",
      description: "Store backups locally or in your preferred cloud storage provider."
    },
    {
      icon: Zap,
      title: "Fast Restoration",
      description: "Quick and reliable database restoration with minimal downtime."
    },
    {
      icon: CheckCircle,
      title: "Backup Verification",
      description: "Automatic backup integrity checks and detailed backup reports."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Supabase Backup</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
            <ModeToggle />
            <Button asChild>
              <Link to="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Professional
            <span className="text-primary"> Supabase Backup </span>
            Solution
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Secure, automated, and reliable backup solution for your Supabase databases. 
            Protect your data with enterprise-grade backup and restoration capabilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild>
              <Link to="/dashboard">
                Start Backing Up
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Everything you need for database backups
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive backup solution built specifically for Supabase databases 
            with enterprise features and developer-friendly tools.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to secure your data?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start protecting your Supabase databases today with automated backups 
              and enterprise-grade security.
            </p>
            <Button size="lg" asChild>
              <Link to="/dashboard">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="font-semibold">Supabase Backup</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for the Supabase community
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
