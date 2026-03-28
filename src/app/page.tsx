"use client"

import { useRouter } from "next/navigation"
import { Leaf, ArrowRight, ShieldCheck, Heart, Zap, ShoppingCart, Users, Recycle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      title: "Store Owners",
      description: "Manage inventory, set smart AI-driven discounts, and easily list surplus for donation.",
      icon: Zap,
      color: "bg-blue-500",
      image: "https://picsum.photos/seed/store1/400/300"
    },
    {
      title: "Consumers",
      description: "Find amazing deals on high-quality food nearing its expiry date. Save up to 80% on groceries.",
      icon: ShoppingCart,
      color: "bg-primary",
      image: "https://picsum.photos/seed/customer1/400/300"
    },
    {
      title: "NGOs",
      description: "Access a verified stream of surplus food donations. Claim and manage pickups in real-time.",
      icon: Heart,
      color: "bg-danger",
      image: "https://picsum.photos/seed/ngo1/400/300"
    }
  ]

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 font-body text-foreground">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-headline font-black tracking-tighter text-primary">FoodSaver AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={() => router.push("/login")} className="hidden sm:flex font-bold hover:text-primary">Login</Button>
          <Button onClick={() => router.push("/login")} className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105">Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 lg:py-40 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10 animate-in fade-in slide-in-from-left-12 duration-1000">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest border border-primary/20">
            <Recycle className="h-4 w-4" />
            Empowering Zero Waste
          </div>
          <h1 className="text-6xl lg:text-8xl font-headline font-black leading-[0.9] tracking-tighter">
            Save Food. <br />
            <span className="text-primary italic">Feed People.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg leading-relaxed font-medium">
            FoodSaver AI uses intelligent expiry tracking and AI-driven marketplace connectivity to bridge the gap between surplus food and those who need it.
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
            <Button onClick={() => router.push("/login")} size="lg" className="h-16 px-10 text-xl font-black rounded-3xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
              Start Saving Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-3xl border-2 border-primary/20 hover:bg-primary/5 transition-all">
              How it Works
            </Button>
          </div>
          
          <div className="flex items-center gap-8 pt-6 border-t border-primary/10">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 w-12 rounded-full border-4 border-background bg-secondary flex items-center justify-center">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="rounded-full h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              <span className="text-primary font-black">500+</span> Stores & NGOs Joined
            </p>
          </div>
        </div>

        <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
          <div className="absolute -inset-8 bg-primary/20 rounded-[3rem] blur-[100px] opacity-50" />
          <div className="relative rounded-[3rem] p-4 bg-white/50 backdrop-blur-sm border-2 border-primary/5 shadow-2xl shadow-primary/10 overflow-hidden group">
            <img 
              src="https://picsum.photos/seed/foodhero/1200/900" 
              alt="Fresh Groceries" 
              className="rounded-[2.5rem] shadow-inner object-cover aspect-[4/3] w-full transition-transform duration-1000 group-hover:scale-105"
              data-ai-hint="fresh groceries"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* Floating Impact Card */}
          <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-[280px] border-4 border-primary/5 animate-bounce-slow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-success/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-success" />
              </div>
              <span className="font-black text-xl tracking-tight">Real-time Safety</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">Automated AI alerts ensure no food goes to waste while maintaining high safety standards.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary/30 py-24 border-y border-primary/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Food Saved (kg)", val: "1.2M+" },
            { label: "Active Users", val: "50k+" },
            { label: "NGO Partners", val: "850+" },
            { label: "Co2 Offset (t)", val: "2.4k+" }
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-5xl font-black text-primary mb-2 tracking-tighter">{stat.val}</p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 space-y-6">
            <h2 className="text-5xl lg:text-6xl font-headline font-black tracking-tight">One Platform. <br /><span className="text-primary">Three Ways to Impact.</span></h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium italic">"Connecting the surplus with the underserved, powered by artificial intelligence."</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <div key={i} className="group relative bg-white p-10 rounded-[3rem] border-2 border-primary/5 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden">
                <div className={`absolute top-0 right-0 h-32 w-32 ${f.color}/10 rounded-bl-[10rem] group-hover:scale-110 transition-transform`} />
                <div className={`h-16 w-16 ${f.color}/20 rounded-2xl flex items-center justify-center text-foreground mb-8 group-hover:rotate-12 transition-transform`}>
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">{f.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8 font-medium">{f.description}</p>
                <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                  <img src={f.image} alt={f.title} className="object-cover h-full w-full" />
                </div>
                <Button variant="ghost" className="p-0 font-black text-primary hover:bg-transparent group-hover:translate-x-2 transition-transform">
                  Explore {f.title} Tools <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-primary py-32 text-white text-center relative overflow-hidden">
        <Recycle className="absolute -top-20 -left-20 h-80 w-80 text-white/5 -rotate-12" />
        <Heart className="absolute -bottom-20 -right-20 h-80 w-80 text-white/5 rotate-12" />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-5xl md:text-7xl font-headline font-black mb-8 tracking-tighter">Ready to join the food revolution?</h2>
          <p className="text-xl text-primary-foreground/90 mb-12 font-medium leading-relaxed">
            Whether you're a local store looking to optimize or a citizen wanting to save, FoodSaver AI is your gateway to a sustainable future.
          </p>
          <Button onClick={() => router.push("/login")} size="lg" className="h-16 px-12 text-2xl font-black rounded-3xl bg-white text-primary hover:bg-white/90 shadow-2xl transition-all">
            Join the Ecosystem
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-20 border-t border-primary/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-headline font-black text-primary">FoodSaver AI</span>
          </div>
          
          <div className="flex gap-12 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Resources</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Impact Report</a>
          </div>

          <p className="text-sm font-medium text-muted-foreground italic">© 2024 FoodSaver AI. Built for a better planet.</p>
        </div>
      </footer>
    </div>
  )
}
