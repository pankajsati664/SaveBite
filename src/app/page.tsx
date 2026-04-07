
"use client"

import { useRouter } from "next/navigation"
import { Leaf, ArrowRight, ShieldCheck, Heart, Zap, ShoppingCart, Users, Recycle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPlaceholderById } from "@/lib/placeholder-images"

export default function LandingPage() {
  const router = useRouter()

  const heroImage = getPlaceholderById('hero-bg')
  const storeImage = getPlaceholderById('landing-store')
  const customerImage = getPlaceholderById('landing-customer')
  const ngoImage = getPlaceholderById('landing-ngo')

  const features = [
    {
      title: "Store Owners",
      description: "Manage inventory and list surplus effortlessly.",
      icon: Zap,
      color: "bg-blue-500",
      image: storeImage.imageUrl,
      hint: storeImage.imageHint
    },
    {
      title: "Consumers",
      description: "Find amazing deals on quality local food.",
      icon: ShoppingCart,
      color: "bg-primary",
      image: customerImage.imageUrl,
      hint: customerImage.imageHint
    },
    {
      title: "NGOs",
      description: "Access verified food donations in real-time.",
      icon: Heart,
      color: "bg-danger",
      image: ngoImage.imageUrl,
      hint: ngoImage.imageHint
    }
  ]

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 font-body text-foreground">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/5">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-primary p-2 md:p-2.5 rounded-lg md:rounded-2xl shadow-xl shadow-primary/20">
            <Leaf className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-headline font-black tracking-tighter text-primary">SaveBite</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" onClick={() => router.push("/login")} className="text-xs md:text-sm font-bold hover:text-primary h-9 md:h-12 px-3 md:px-5">Login</Button>
          <Button onClick={() => router.push("/login")} className="bg-primary hover:bg-primary/90 text-white rounded-lg md:rounded-2xl px-4 md:px-8 h-9 md:h-12 text-xs md:text-sm font-bold shadow-lg transition-all">Start Now</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24 lg:py-40 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className="space-y-6 md:space-y-10 text-center lg:text-left animate-in fade-in slide-in-from-left-12 duration-1000">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-primary/10 text-primary px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-sm font-black uppercase tracking-widest border border-primary/20">
            <Recycle className="h-3 w-3 md:h-4 md:w-4" />
            Zero Waste Ecosystem
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black leading-[1] md:leading-[0.9] tracking-tighter">
            Save Food. <br />
            <span className="text-primary italic">Feed People.</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            Bridging the gap between surplus food and those who need it through AI-powered tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-5 justify-center lg:justify-start">
            <Button onClick={() => router.push("/login")} size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 text-lg md:text-xl font-black rounded-2xl md:rounded-3xl bg-primary shadow-xl shadow-primary/20">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 text-lg md:text-xl font-bold rounded-2xl md:rounded-3xl border-2 border-primary/20 transition-all">
              Learn More
            </Button>
          </div>
        </div>

        <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
          <div className="absolute -inset-4 md:-inset-8 bg-primary/20 rounded-[2rem] md:rounded-[3rem] blur-[60px] md:blur-[100px] opacity-40" />
          <div className="relative rounded-[2rem] md:rounded-[3rem] p-2 md:p-4 bg-white/50 backdrop-blur-sm border border-primary/5 shadow-2xl overflow-hidden group">
            <img 
              src={heroImage.imageUrl} 
              alt={heroImage.description} 
              className="rounded-[1.5rem] md:rounded-[2.5rem] shadow-inner object-cover aspect-[4/3] w-full"
              data-ai-hint={heroImage.imageHint}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary/30 py-12 md:py-24 border-y border-primary/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
          {[
            { label: "Food Saved", val: "1.2M+" },
            { label: "Active Users", val: "50k+" },
            { label: "NGO Partners", val: "850+" },
            { label: "Impact", val: "Eco+" }
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl md:text-5xl font-black text-primary mb-1 md:mb-2 tracking-tighter">{stat.val}</p>
              <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-24 space-y-4 md:space-y-6">
            <h2 className="text-3xl md:text-6xl font-headline font-black tracking-tight">One Platform. <br /><span className="text-primary">Triple Impact.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            {features.map((f, i) => (
              <div key={i} className="group relative bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-primary/5 shadow-lg hover:shadow-xl transition-all">
                <div className={`h-12 w-12 md:h-16 md:w-16 ${f.color}/20 rounded-xl md:rounded-2xl flex items-center justify-center text-foreground mb-6 md:mb-8`}>
                  <f.icon className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-2 md:mb-4 tracking-tight">{f.title}</h3>
                <p className="text-muted-foreground text-sm md:text-lg leading-relaxed mb-6 md:mb-8 font-medium">{f.description}</p>
                <div className="aspect-video rounded-xl md:rounded-2xl overflow-hidden mb-6">
                  <img src={f.image} alt={f.title} className="object-cover h-full w-full" data-ai-hint={f.hint} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12 md:py-20 border-t border-primary/5 text-center">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-headline font-black text-primary">SaveBite</span>
          </div>
          <p className="text-xs md:text-sm font-medium text-muted-foreground italic">© 2024 SaveBite. Built for a better planet.</p>
        </div>
      </footer>
    </div>
  )
}
