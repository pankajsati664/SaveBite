
"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  TrendingUp, 
  Leaf, 
  ShoppingBag, 
  Package, 
  Heart, 
  Award,
  Globe,
  ChevronRight,
  Zap,
  Users,
  Clock,
  ArrowUpRight,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, limit } from "firebase/firestore"
import Link from "next/link"

const ADMIN_UID = "7zPezqeNFEPbYVsCM8NxO4fknhn1"

export default function DashboardPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: profile } = useDoc(userDocRef)
  
  // Force admin role for special UID
  const role = user?.uid === ADMIN_UID ? 'admin' : (profile?.role || 'customer')

  // Data fetching for activity feed
  const activityQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    const collName = role === 'ngo' ? "donations_public" : (role === 'store_owner' ? `users/${user.uid}/orders` : `users/${user.uid}/orders`)
    return query(collection(firestore, collName), orderBy("createdAt", "desc"), limit(5))
  }, [firestore, user, role])

  const { data: recentActivity, isLoading: isActivityLoading } = useCollection(activityQuery)

  const stats = {
    admin: [
      { label: "Global Savings", value: "2.4T", icon: Globe, color: "text-blue-600", desc: "Total CO2 mitigated" },
      { label: "Total Partners", value: "1,240", icon: Users, color: "text-emerald-600", desc: "Active NGOs & Shops" },
      { label: "Active Rescues", value: "342", icon: Zap, color: "text-amber-500", desc: "Currently in transit" },
      { label: "Revenue Share", value: "₹45.2k", icon: TrendingUp, color: "text-zinc-900", desc: "Platform processing" },
    ],
    store_owner: [
      { label: "Food Rescued", value: "142kg", icon: Leaf, color: "text-emerald-600", desc: "Total waste avoided" },
      { label: "Impact Points", value: profile?.points || "1,240", icon: Award, color: "text-amber-500", desc: "Sustainability score" },
      { label: "Daily Sales", value: "₹12.4k", icon: TrendingUp, color: "text-blue-600", desc: "Today's revenue" },
      { label: "Rating", value: "4.9/5", icon: Heart, color: "text-rose-500", desc: "Customer satisfaction" },
    ],
    customer: [
      { label: "Total Saved", value: "₹4,250", icon: TrendingUp, color: "text-emerald-600", desc: "Money saved on deals" },
      { label: "CO2 Saved", value: `${profile?.impactScore || 12}kg`, icon: Leaf, color: "text-emerald-500", desc: "Your carbon offset" },
      { label: "Impact Level", value: "Silver", icon: Award, color: "text-amber-500", desc: "Progress to Gold" },
      { label: "Rescues", value: "24", icon: ShoppingBag, color: "text-blue-600", desc: "Items saved from waste" },
    ],
    ngo: [
      { label: "Meals Served", value: "840", icon: Heart, color: "text-rose-500", desc: "Total meal distribution" },
      { label: "CO2 Mitigated", value: "120kg", icon: Leaf, color: "text-emerald-600", desc: "Environmental impact" },
      { label: "Active Fleet", value: "4", icon: Zap, color: "text-blue-600", desc: "Pickup vehicles" },
      { label: "Partners", value: "12", icon: Package, color: "text-amber-500", desc: "Store collaborations" },
    ]
  }[role] || []

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">
              Hello, <span className="text-primary">{profile?.name || (user?.uid === ADMIN_UID ? 'Admin' : 'Hero')}</span>
            </h1>
            <p className="text-muted-foreground font-medium italic">
              "Every small rescue makes a massive global impact."
            </p>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-2xl border border-secondary">
             <Clock className="h-4 w-4 text-muted-foreground" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Sync: Just Now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl bg-secondary", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-none bg-secondary/50 text-[10px] font-black uppercase tracking-widest px-3">Active</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground italic opacity-60 leading-tight pt-1">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Activity & Impact */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Impact Visualizer */}
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  Environmental Contributions
                </CardTitle>
                <CardDescription className="italic font-medium">Your progress toward the next sustainability milestone.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rescue Efficiency</span>
                    <span className="text-2xl font-black text-primary">75%</span>
                  </div>
                  <Progress value={75} className="h-3 rounded-full bg-secondary" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "CO2 Mitigated", value: "14.2kg", icon: Globe },
                    { label: "Water Saved", value: "2.4k L", icon: Zap },
                    { label: "Waste Avoided", value: "84kg", icon: Package }
                  ].map(m => (
                    <div key={m.label} className="p-6 rounded-[2rem] bg-secondary/30 text-center space-y-2 border border-secondary/50">
                      <m.icon className="h-5 w-5 mx-auto text-primary opacity-40" />
                      <p className="text-xl font-black tracking-tighter">{m.value}</p>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{m.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black">Recent Activity</CardTitle>
                  <CardDescription className="italic">Your latest platform interactions.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest">View All</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-secondary">
                  {isActivityLoading ? (
                    <div className="p-12 text-center text-muted-foreground text-xs font-black uppercase tracking-widest">Fetching logs...</div>
                  ) : recentActivity?.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic font-medium">No recent activities to show.</div>
                  ) : (
                    recentActivity?.map((act) => (
                      <div key={act.id} className="p-6 hover:bg-secondary/20 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            {role === 'ngo' ? <Heart className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
                          </div>
                          <div>
                            <p className="font-black text-sm">{act.productName || 'Rescue Session'}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                              {act.status || 'Completed'} • {new Date(act.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Actions & Notifications */}
          <div className="space-y-8">
            
            {/* Quick Actions Card */}
            <Card className="border-none shadow-lg rounded-[2.5rem] bg-zinc-950 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16" />
              <CardHeader>
                <CardTitle className="text-xl font-black">Quick Actions</CardTitle>
                <CardDescription className="text-zinc-400">Jump back into your mission.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(role === 'customer' || role === 'admin') && (
                  <Link href="/marketplace">
                    <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl bg-primary hover:bg-primary/90">
                      Browse Deals <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {(role === 'store_owner' || role === 'admin') && (
                  <Link href="/inventory">
                    <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl bg-white text-zinc-950 hover:bg-zinc-100">
                      Update Vault <Package className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {(role === 'ngo' || role === 'admin') && (
                  <Link href="/donations">
                    <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl bg-rose-600 hover:bg-rose-700">
                      Claim Surplus <Heart className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {role === 'admin' && (
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <Link href="/admin">
                      <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700">
                        Admin Command <Users className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Insights / Stock Alerts */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
               <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Priority Alerts
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 pt-2">
                  <div className="space-y-4">
                     <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                        <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest mb-1">Stock Critical</p>
                        <p className="text-sm font-bold leading-tight">3 items in your region are expiring in less than 24 hours.</p>
                     </div>
                     <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest mb-1">Impact Goal</p>
                        <p className="text-sm font-bold leading-tight">You are 5kg away from reaching your monthly CO2 goal!</p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Achievement Badge Card */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center space-y-4">
               <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                  <Award className="h-10 w-10 text-primary" />
               </div>
               <div className="space-y-1">
                  <h4 className="text-xl font-black tracking-tight">Silver Rescuer</h4>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Achievement Unlocked</p>
               </div>
               <p className="text-xs text-muted-foreground italic font-medium px-4">"Awarded for rescuing over 20 items in a single month."</p>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
