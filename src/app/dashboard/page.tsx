
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
  AlertTriangle,
  Award,
  Globe,
  Loader2,
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
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

  // Emergency Admin Promotion for the requested user
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
      { label: "Global Impact", value: "2.4 Tons CO2", icon: Globe, color: "bg-emerald-600" },
      { label: "Network Health", value: "99.9%", icon: ShieldCheck, color: "bg-blue-600" },
      { label: "Active Nodes", value: "1,240", icon: Zap, color: "bg-amber-600" },
      { label: "Revenue Share", value: "₹45.2k", icon: TrendingUp, color: "bg-zinc-950" },
    ],
    store_owner: [
      { label: "Food Rescued", value: "142 kg", icon: Leaf, color: "bg-emerald-600" },
      { label: "Eco Points", value: profile?.points || "0", icon: Award, color: "bg-amber-500" },
      { label: "Revenue", value: "₹12.4k", icon: TrendingUp, color: "bg-blue-600" },
      { label: "Social Reach", value: "9.8/10", icon: Heart, color: "bg-rose-600" },
    ],
    customer: [
      { label: "Savings", value: "₹2,140", icon: TrendingUp, color: "bg-emerald-600" },
      { label: "Your Impact", value: `${profile?.impactScore || 0} kg CO2`, icon: Leaf, color: "bg-emerald-500" },
      { label: "Rescue Level", value: "Silver", icon: Award, color: "bg-amber-500" },
      { label: "Cart Status", value: "Ready", icon: ShoppingBag, color: "bg-blue-600" },
    ],
    ngo: [
      { label: "Meals Served", value: "840", icon: Heart, color: "bg-rose-600" },
      { label: "CO2 Mitigated", value: "120 kg", icon: Leaf, color: "bg-emerald-600" },
      { label: "Pickup Fleet", value: "Active", icon: Zap, color: "bg-blue-600" },
      { label: "Partner Shops", value: "12", icon: Package, color: "bg-amber-600" },
    ]
  }[role] || []

  const heroImage = getPlaceholderById('hero-bg')

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700">
        {/* Advanced Hero Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 px-6 py-10 sm:px-12 sm:py-16 text-white shadow-2xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-40 mix-blend-overlay" 
            alt="Hero"
            data-ai-hint={heroImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-transparent" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
                {role.replace('_', ' ')} Command
              </Badge>
              {profile?.points > 0 && (
                <Badge className="bg-amber-500/20 text-amber-500 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
                  {profile.points} XP Earned
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-6xl font-black tracking-tighter leading-tight">
              Impact <span className="text-primary italic">Intelligence.</span>
            </h1>
            <p className="text-zinc-300 font-medium italic text-base sm:text-xl max-w-xl opacity-80">
              {role === 'customer' ? "Rescuing surplus food, one bite at a time." : "Optimizing global surplus for zero waste."}
            </p>
          </div>
        </div>

        {/* Development Promotion Hub */}
        {isTargetDev && role !== 'admin' && (
          <Card className="border-none shadow-2xl rounded-[2rem] bg-amber-50 border border-amber-200 overflow-hidden">
             <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center md:text-left">
                   <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
                      <ShieldAlert className="text-amber-600" /> Administrative Access Detected
                   </h3>
                   <p className="text-sm text-amber-800 font-medium italic">Elevate this account to system-wide administrator status.</p>
                </div>
                <Button 
                  onClick={handleSelfPromotion}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl shadow-lg shadow-amber-200"
                >
                  Claim Admin Authority
                </Button>
             </CardContent>
          </Card>
        )}

        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <Card key={stat.label} className="border-none shadow-xl card-3d overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-white">
              <CardContent className="p-4 sm:p-8">
                <div className={cn("h-10 w-10 sm:h-14 sm:w-14 rounded-xl mb-4 flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl sm:text-4xl font-black tracking-tighter">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Carbon Impact Tracker (Visual) */}
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-emerald-950 text-white relative">
            <div className="absolute top-6 right-6 h-20 w-20 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl sm:text-3xl font-black tracking-tighter flex items-center gap-3">
                <Leaf className="text-primary h-8 w-8" />
                Carbon Offset Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-70">
                  <span>Current Milestone</span>
                  <span>75% to Next Badge</span>
                </div>
                <Progress value={75} className="h-4 bg-white/10" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { l: "CO2 Saved", v: "14.2kg" },
                  { l: "Water Saved", v: "2.4k L" },
                  { l: "Trees Eq.", v: "1.2" }
                ].map(m => (
                  <div key={m.l} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                    <p className="text-2xl font-black tracking-tighter text-primary">{m.v}</p>
                    <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">{m.l}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Gamification Hub */}
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-xl sm:text-2xl font-black tracking-tighter flex items-center gap-3">
                <Zap className="text-amber-500 fill-amber-500 h-6 w-6" />
                Impact Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {role === 'customer' && (
                <>
                  <Link href="/marketplace">
                    <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20">
                      Rescue Now <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-secondary text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Referral Reward</p>
                    <p className="text-sm font-bold italic">Invite a friend, get ₹50 credit</p>
                  </div>
                </>
              )}
              {role === 'store_owner' && (
                <Link href="/inventory">
                  <Button className="w-full h-16 rounded-2xl bg-zinc-900 text-white font-black text-lg">
                    Manage Stock <Package className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              {role === 'ngo' && (
                <Link href="/donations">
                  <Button className="w-full h-16 rounded-2xl bg-rose-600 text-white font-black text-lg">
                    Claim Surplus <Heart className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              {(role === 'admin' || isTargetDev) && (
                <Link href="/admin">
                  <Button className="w-full h-16 rounded-2xl bg-zinc-950 text-white font-black text-lg">
                    System Control <ShieldCheck className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
