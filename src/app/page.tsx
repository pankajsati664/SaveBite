"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Leaf, ArrowRight, ShieldCheck, Heart, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F1F4F0] selection:bg-primary/30">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between sticky top-0 z-50 bg-[#F1F4F0]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-primary">FoodSaver AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/login")} className="hidden sm:flex">Login</Button>
          <Button onClick={() => router.push("/login")} className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
            <Zap className="h-4 w-4" />
            Empowering Zero Waste
          </div>
          <h1 className="text-5xl lg:text-7xl font-headline font-black leading-tight text-foreground">
            Save Food. <br />
            <span className="text-primary">Feed People.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
            FoodSaver AI uses intelligent expiry tracking and real-time connectivity to bridge the gap between surplus food and those who need it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => router.push("/login")} size="lg" className="h-14 px-8 text-lg rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
              Start Saving Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-2xl border-primary/20 hover:bg-white">
              Learn How it Works
            </Button>
          </div>
        </div>

        <div className="relative animate-in fade-in zoom-in duration-1000 delay-200">
          <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-3xl" />
          <img 
            src="https://picsum.photos/seed/foodhero/800/600" 
            alt="Fresh Groceries" 
            className="relative rounded-[2.5rem] shadow-2xl border-4 border-white object-cover aspect-[4/3] w-full"
            data-ai-hint="fresh groceries"
          />
          
          {/* Floating Feature Card */}
          <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl max-w-[200px] border hidden md:block">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 bg-success/20 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <span className="font-bold">Safe Tracking</span>
            </div>
            <p className="text-xs text-muted-foreground">Automated expiry alerts keep your food inventory safe and efficient.</p>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-headline font-bold">How FoodSaver Works for You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Different tools tailored for every part of the food ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-background border hover:border-primary/50 transition-colors space-y-4 group">
              <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Store Owners</h3>
              <p className="text-muted-foreground text-sm">Track inventory in real-time. Use AI to suggest discounts or donations for products nearing expiry.</p>
            </div>

            <div className="p-8 rounded-3xl bg-background border hover:border-primary/50 transition-colors space-y-4 group">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Customers</h3>
              <p className="text-muted-foreground text-sm">Find amazing deals on high-quality groceries near you. Save up to 80% on perfectly good food.</p>
            </div>

            <div className="p-8 rounded-3xl bg-background border hover:border-primary/50 transition-colors space-y-4 group">
              <div className="h-14 w-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">NGOs</h3>
              <p className="text-muted-foreground text-sm">Access a stream of donated surplus food. Easily claim and manage pickups for your organization.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold">FoodSaver AI</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 FoodSaver AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}