"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  TrendingUp, 
  Leaf, 
  Zap, 
  ShieldCheck, 
  ShoppingBag, 
  Package, 
  Heart, 
  Award,
  Globe,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { getPlaceholderById } from "@/lib/placeholder-images"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const firestore = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: profile } = useDoc(userDocRef)
  const role = profile?.role || 'customer'

  const isTargetDev = user?.uid === "0EvPdWQHFzMCyKcfaEWul1JKXkf2"

  const handleSelfPromotion = () => {
    if (!firestore || !user) return
    const userRef = doc(firestore, "users", user.uid)
    const adminMarkerRef = doc(firestore, "roles_admin", user.uid)
    
    setDocumentNonBlocking(userRef, { role: 'admin', updatedAt: serverTimestamp() }, { merge: true })
    setDocumentNonBlocking(adminMarkerRef, { id: user.uid }, { merge: true })
    
    toast({
      title: "Identity Elevated",
      description: "You have been granted Global Administrator authority.",
    })
  }

  const stats = {
    admin: [
      { label: "Global Savings", value: "2.4T", icon: Globe, color: "bg-blue-600", trend: "+12%" },
      { label: "System Uptime", value: "99.9%", icon: ShieldCheck, color: "bg-emerald-600", trend: "Stable" },
      { label: "Network nodes", value: "1,240", icon: Zap, color: "bg-amber-500", trend: "+45" },
      { label: "Revenue Share", value: "₹45.2k", icon: TrendingUp, color: "bg-zinc-900", trend: "+8%" },
    ],
    store_owner: [
      { label: "Food Rescued", value: "142kg", icon: Leaf, color: "bg-emerald-600", trend: "+5.2kg" },
      { label: "Eco Points", value: profile?.points || "0", icon: Award, color: "bg-amber-500", trend: "Level 4" },
      { label: "Daily Revenue", value: "₹12.4k", icon: TrendingUp, color: "bg-blue-600", trend: "+12%" },
      { label: "Store Rating", value: "4.9/5", icon: Heart, color: "bg-rose-500", trend: "Top 1%" },
    ],
    customer: [
      { label: "Total Savings", value: "₹2,140", icon: TrendingUp, color: "bg-emerald-600", trend: "₹450 saved today" },
      { label: "Carbon Saved", value: `${profile?.impactScore || 0}kg`, icon: Leaf, color: "bg-emerald-500", trend: "Equivalent to 2 trees" },
      { label: "Rescuer Level", value: "Silver", icon: Award, color: "bg-amber-500", trend: "200xp to Gold" },
      { label: "Bites Claimed", value: "24", icon: ShoppingBag, color: "bg-blue-600", trend: "Active now" },
    ],
    ngo: [
      { label: "Meals Served", value: "840", icon: Heart, color: "bg-rose-500", trend: "+120 this week" },
      { label: "CO2 Mitigated", value: "120kg", icon: Leaf, color: "bg-emerald-600", trend: "High Impact" },
      { label: "Active Fleet", value: "4", icon: Zap, color: "bg-blue-600", trend: "All online" },
      { label: "Partner Shops", value: "12", icon: Package, color: "bg-amber-500", trend: "+2 new" },
    ]
  }[role] || []

  const heroImage = getPlaceholderById('hero-bg')

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-32 animate-in fade-in duration-1000">
        {/* Advanced Hero Section */}
        <div className="relative overflow-hidden rounded-[3rem] bg-zinc-950 px-8 py-16 sm:px-16 sm:py-24 text-white shadow-3xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-30 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-[10000ms]" 
            alt="Hero"
            data-ai-hint={heroImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-emerald-950/20" />
          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-primary text-white border-none px-6 py-2 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                {role.replace('_', ' ')} Portal
              </Badge>
              {profile?.points > 0 && (
                <Badge className="bg-amber-500 text-white border-none px-6 py-2 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-500/20">
                  {profile.points} Points Earned
                </Badge>
              )}
            </div>
            <h1 className="text-4xl sm:text-7xl font-black tracking-tighter leading-[0.9] sm:leading-[0.85]">
              Real-time <span className="text-primary italic">Surplus</span> <br className="hidden sm:block" /> Intelligence.
            </h1>
            <p className="text-zinc-400 font-medium italic text-lg sm:text-2xl max-w-2xl opacity-90 leading-relaxed">
              {role === 'customer' 
                ? "Your dashboard for high-impact food rescue and sustainability tracking." 
                : "Optimizing the zero-waste ecosystem through smart inventory and redistribution."}
            </p>
          </div>
        </div>

        {isTargetDev && role !== 'admin' && (
          <Card className="border-none shadow-3xl rounded-[2.5rem] bg-amber-50 border border-amber-200 overflow-hidden animate-bounce">
             <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                   <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-amber-900">
                      <ShieldAlert className="text-amber-600 h-8 w-8" /> Developer Admin Detected
                   </h3>
                   <p className="text-sm text-amber-800 font-bold italic opacity-70">Elevate this account to system-wide administrator status instantly.</p>
                </div>
                <Button 
                  onClick={handleSelfPromotion}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-[11px] h-14 px-10 rounded-2xl shadow-2xl shadow-amber-200 transition-all active:scale-95"
                >
                  Claim Admin Authority
                </Button>
             </CardContent>
          </Card>
        )}

        {/* High-Impact Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <Card key={stat.label} className="border-none shadow-2xl card-3d overflow-hidden rounded-[2.5rem] bg-white group">
              <CardContent className="p-8">
                <div className={cn("h-16 w-16 rounded-2xl mb-6 flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-12", stat.color)}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl sm:text-4xl font-black tracking-tighter leading-none">{stat.value}</p>
                  <p className="text-[9px] font-bold text-success mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" /> {stat.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carbon Impact Visualizer */}
          <Card className="lg:col-span-2 border-none shadow-3xl rounded-[3rem] overflow-hidden bg-emerald-950 text-white relative">
            <div className="absolute top-0 right-0 h-96 w-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-3xl sm:text-4xl font-black tracking-tighter flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <Leaf className="text-primary h-8 w-8" />
                </div>
                Ecological Footprint
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest opacity-70">
                  <span>Progress to 'Eco-Warrior' Badge</span>
                  <span className="text-primary">75% Achieved</span>
                </div>
                <Progress value={75} className="h-5 bg-white/10" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { l: "CO2 Mitigation", v: "14.2kg", color: "text-primary" },
                  { l: "Water Conserved", v: "2.4k L", color: "text-blue-400" },
                  { l: "Energy Saved", v: "84 kWh", color: "text-amber-400" }
                ].map(m => (
                  <div key={m.l} className="bg-white/5 p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-colors">
                    <p className={cn("text-3xl font-black tracking-tighter", m.color)}>{m.v}</p>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-1">{m.l}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Hub */}
          <Card className="border-none shadow-3xl rounded-[3rem] bg-white overflow-hidden flex flex-col">
            <CardHeader className="p-10">
              <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <Zap className="text-amber-500 fill-amber-500 h-6 w-6" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-4 flex-1">
              {role === 'customer' && (
                <>
                  <Link href="/marketplace">
                    <Button className="w-full h-20 rounded-[1.75rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95">
                      Rescue Food Now <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                  </Link>
                  <div className="p-6 bg-secondary/30 rounded-3xl border border-secondary text-center space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Share the Mission</p>
                    <p className="text-sm font-bold italic text-zinc-600">Refer a friend and both get ₹100 credit.</p>
                  </div>
                </>
              )}
              {role === 'store_owner' && (
                <Link href="/inventory">
                  <Button className="w-full h-20 rounded-[1.75rem] bg-zinc-900 text-white font-black text-xl shadow-2xl hover:scale-[1.02]">
                    Audit Stock <Package className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
              )}
              {role === 'ngo' && (
                <Link href="/donations">
                  <Button className="w-full h-20 rounded-[1.75rem] bg-rose-600 text-white font-black text-xl shadow-2xl hover:scale-[1.02]">
                    Rescue Surplus <Heart className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
              )}
              {(role === 'admin' || isTargetDev) && (
                <Link href="/admin">
                  <Button className="w-full h-20 rounded-[1.75rem] bg-zinc-950 text-white font-black text-xl shadow-2xl hover:scale-[1.02]">
                    System Command <ShieldCheck className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
              )}
            </CardContent>
            <div className="p-10 pt-0 mt-auto">
               <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">SaveBite OS v2.4</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}