
"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Package, 
  AlertTriangle, 
  History, 
  Heart, 
  TrendingUp, 
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CalendarDays,
  ShoppingBag,
  ClipboardList,
  Users,
  Sprout
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, limit, orderBy, doc } from "firebase/firestore"
import { getExpiryStatus } from "@/lib/utils/expiry"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: userProfile } = useDoc(userDocRef)
  const userRole = userProfile?.role || 'customer'

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRole !== 'store_owner') return null
    return query(
      collection(firestore, "users", user.uid, "products"),
      orderBy("updatedAt", "desc")
    )
  }, [firestore, user, userRole])

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRole !== 'customer') return null
    return query(
      collection(firestore, "users", user.uid, "orders"),
      orderBy("createdAt", "desc")
    )
  }, [firestore, user, userRole])

  const claimedDonationsQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRole !== 'ngo') return null
    return query(
      collection(firestore, "users", user.uid, "claimed_donations"),
      orderBy("updatedAt", "desc")
    )
  }, [firestore, user, userRole])

  const { data: allProducts, isLoading: isProductsLoading } = useCollection(productsQuery)
  const { data: allOrders, isLoading: isOrdersLoading } = useCollection(ordersQuery)
  const { data: allClaimed, isLoading: isClaimedLoading } = useCollection(claimedDonationsQuery)

  const isLoading = isProductsLoading || isOrdersLoading || isClaimedLoading

  const getStats = () => {
    if (userRole === 'store_owner') {
      return [
        { label: "Inventory Items", value: allProducts?.length.toString() || "0", icon: Package, color: "bg-blue-500", trend: "+2%" },
        { label: "Near Expiry", value: allProducts?.filter(p => getExpiryStatus(p.expiryDate) === 'near-expiry').length.toString() || "0", icon: AlertTriangle, color: "bg-warning", trend: "Alert" },
        { label: "Expired", value: allProducts?.filter(p => getExpiryStatus(p.expiryDate) === 'expired').length.toString() || "0", icon: History, color: "bg-danger", trend: "-5%" },
        { label: "Impact Score", value: "94", icon: Heart, color: "bg-primary", trend: "+15%" },
      ]
    } else if (userRole === 'customer') {
      return [
        { label: "Items Rescued", value: allOrders?.length.toString() || "0", icon: ShoppingBag, color: "bg-primary", trend: "+8%" },
        { label: "Total Savings", value: `₹${allOrders?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString('en-IN') || "0"}`, icon: TrendingUp, color: "bg-success", trend: "Great" },
        { label: "Active Orders", value: allOrders?.filter(o => o.status === 'Pending').length.toString() || "0", icon: Clock, color: "bg-blue-500", trend: "Active" },
        { label: "Food Points", value: "120", icon: Sprout, color: "bg-accent", trend: "+10" },
      ]
    } else { // NGO
      return [
        { label: "Total Rescues", value: allClaimed?.length.toString() || "0", icon: Heart, color: "bg-primary", trend: "+12%" },
        { label: "Pending Pickups", value: allClaimed?.filter(d => d.status === 'Claimed').length.toString() || "0", icon: Clock, color: "bg-warning", trend: "Urgent" },
        { label: "Meals Provided", value: ((allClaimed?.length || 0) * 5).toString(), icon: Users, color: "bg-blue-500", trend: "+20%" },
        { label: "Partner Stores", value: "8", icon: Package, color: "bg-accent", trend: "Stable" },
      ]
    }
  }

  const nearExpiryCount = allProducts?.filter(p => getExpiryStatus(p.expiryDate) === 'near-expiry').length || 0
  const progressValue = allProducts?.length ? Math.min(100, (nearExpiryCount / allProducts.length) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-foreground flex items-center gap-3">
              Hello, {userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0]}!
              <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium italic">"Every bite saved is a win for the planet."</p>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="px-5 py-2.5 bg-primary/5 border-primary/20 text-primary font-bold rounded-2xl shadow-sm">
              <CalendarDays className="mr-2 h-4 w-4" />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStats().map((stat, idx) => (
            <Card key={stat.label} className={cn(
              "border-none shadow-md overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-3xl animate-in fade-in slide-in-from-bottom-4",
              `delay-[${idx * 100}ms]`
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn("p-4 rounded-2xl text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter",
                    stat.trend.startsWith('+') ? "text-success bg-success/10" : 
                    stat.trend === "Alert" || stat.trend === "Urgent" ? "text-warning bg-warning/10" : "text-danger bg-danger/10"
                  )}>
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                     (stat.trend === "Alert" || stat.trend === "Urgent") ? <AlertTriangle className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-4xl font-black tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Placeholder */}
          <Card className="lg:col-span-2 border-none shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-card to-secondary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-black">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Impact Performance
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    {userRole === 'store_owner' ? 'Food saved from landfill (kg)' : 
                     userRole === 'customer' ? 'Money saved through surplus deals (₹)' : 'Donations rescued (units)'} over the last 7 days
                  </CardDescription>
                </div>
                <div className="hidden sm:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl">
                  {['W', 'M', 'Y'].map(t => (
                    <Button key={t} variant={t === 'W' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 rounded-lg font-bold text-xs p-0">{t}</Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full bg-secondary/10 rounded-[2.5rem] flex items-end justify-between p-10 gap-4 border border-primary/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] pointer-events-none" />
                {[45, 65, 35, 75, 85, 100, 80].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group/bar relative z-10">
                    <div 
                      className="w-full max-w-[50px] bg-primary/40 group-hover/bar:bg-primary transition-all duration-500 rounded-2xl relative shadow-lg shadow-primary/10" 
                      style={{ height: `${val}%` }} 
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-90 group-hover/bar:scale-100 bg-foreground text-background px-3 py-1.5 rounded-xl text-xs font-black shadow-xl">
                        {val}{userRole === 'customer' ? '₹' : 'kg'}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-4 font-black uppercase tracking-widest opacity-70">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contextual Action Panel */}
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-gradient-to-tr from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                {userRole === 'store_owner' ? <Clock className="h-6 w-6 text-warning" /> : <Sprout className="h-6 w-6 text-primary" />}
                {userRole === 'store_owner' ? 'Critical Alerts' : 'Impact Growth'}
              </CardTitle>
              <CardDescription className="text-base font-medium">
                {userRole === 'store_owner' ? 'Immediate attention needed' : 'Your sustainability metrics'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {userRole === 'store_owner' && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-black uppercase tracking-wider">
                    <span className="text-muted-foreground">Inventory at Risk</span>
                    <span className="text-warning">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress value={progressValue} className="h-4 bg-secondary rounded-full shadow-inner" />
                  <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">
                    <span className="text-warning font-black not-italic">{nearExpiryCount} items</span> are expiring within 72 hours. AI recommends a <span className="text-primary font-black">50% markdown</span> for immediate rescue.
                  </p>
                </div>
              )}

              {userRole !== 'store_owner' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 shadow-sm relative overflow-hidden group">
                    <Sprout className="absolute -right-4 -bottom-4 h-24 w-24 text-primary/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                    <p className="text-xs font-black text-primary mb-2 uppercase tracking-widest">Sustainability Milestone</p>
                    <p className="text-sm font-bold leading-relaxed text-foreground/80">
                      You've prevented <span className="text-primary font-black">12.5kg of CO2</span> emissions this month! That's equivalent to planting <span className="text-primary font-black">2 trees</span>.
                    </p>
                  </div>
                </div>
              )}

              <Separator className="bg-primary/10" />

              <div className="space-y-5">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70">
                  {userRole === 'store_owner' ? 'Recommended Actions' : 'Discovery Hub'}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {userRole === 'store_owner' ? (
                    <>
                      <Link href="/inventory">
                        <Button className="w-full justify-start h-14 rounded-2xl border-none bg-warning/10 text-warning-foreground hover:bg-warning/20 shadow-none font-black text-sm">
                          <AlertTriangle className="mr-4 h-6 w-6" />
                          Optimize Near-Expiry Pricing
                        </Button>
                      </Link>
                      <Link href="/donations">
                        <Button className="w-full justify-start h-14 rounded-2xl border-none bg-primary/10 text-primary hover:bg-primary/20 shadow-none font-black text-sm">
                          <Heart className="mr-4 h-6 w-6" />
                          Quick Donate Surplus
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/marketplace">
                        <Button className="w-full justify-start h-14 rounded-2xl border-none bg-primary/10 text-primary hover:bg-primary/20 shadow-none font-black text-sm">
                          <ShoppingBag className="mr-4 h-6 w-6" />
                          Explore Live Deals
                        </Button>
                      </Link>
                      <Link href="/orders">
                        <Button className="w-full justify-start h-14 rounded-2xl border-none bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-none font-black text-sm">
                          <ClipboardList className="mr-4 h-6 w-6" />
                          My Rescue Journal
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity List */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-card transition-all duration-500 hover:shadow-2xl">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 border-b border-secondary">
            <div>
              <CardTitle className="text-3xl font-headline font-black">Community Activity</CardTitle>
              <CardDescription className="text-lg font-medium">Your most recent contributions to zero waste</CardDescription>
            </div>
            <Link href={userRole === 'store_owner' ? "/inventory" : (userRole === 'customer' ? "/orders" : "/donations")}>
              <Button variant="ghost" className="mt-4 sm:mt-0 text-primary hover:text-primary/80 hover:bg-primary/5 font-black uppercase tracking-widest text-xs px-6 py-6 rounded-2xl border border-primary/10 transition-all">
                View All Missions <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Syncing impact data...</p>
                </div>
              ) : (userRole === 'store_owner' ? allProducts : (userRole === 'customer' ? allOrders : allClaimed))?.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground italic font-medium text-lg">
                  The journey starts with a single step. No activity yet.
                </div>
              ) : (
                (userRole === 'store_owner' ? allProducts?.slice(0, 5) : (userRole === 'customer' ? allOrders?.slice(0, 5) : allClaimed?.slice(0, 5)))?.map((item, idx) => {
                  return (
                    <div key={item.id} className={cn(
                      "flex flex-col sm:flex-row items-start sm:items-center justify-between group p-6 hover:bg-secondary/20 rounded-[2rem] transition-all duration-500 cursor-pointer border border-transparent hover:border-primary/5 animate-in fade-in slide-in-from-right-4",
                      `delay-[${idx * 100}ms]`
                    )}>
                      <div className="flex items-center gap-6 mb-4 sm:mb-0">
                        <div className={cn(
                          "h-16 w-16 rounded-2xl flex items-center justify-center shadow-md bg-white text-primary transform group-hover:rotate-6 transition-all duration-500 border border-secondary"
                        )}>
                          {userRole === 'store_owner' ? <Package className="h-8 w-8" /> : 
                           userRole === 'customer' ? <ShoppingBag className="h-8 w-8" /> : <Heart className="h-8 w-8 text-danger" />}
                        </div>
                        <div>
                          <p className="font-black text-xl group-hover:text-primary transition-colors leading-tight mb-1">
                            {userRole === 'store_owner' ? item.name : (userRole === 'customer' ? item.productName : item.name)}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {userRole === 'store_owner' ? (
                               <>
                                 <Clock className="h-3 w-3" />
                                 Expires {new Date(item.expiryDate).toLocaleDateString()}
                               </>
                            ) : (
                              <>
                                <History className="h-3 w-3" />
                                Updated {new Date(item.updatedAt?.seconds * 1000 || item.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <Badge variant="outline" className="font-black text-sm px-5 py-2 rounded-xl border-primary/20 bg-primary/5 text-primary shadow-sm">
                          {userRole === 'store_owner' ? `${item.quantity} Units` : (userRole === 'customer' ? `₹${item.totalAmount?.toLocaleString('en-IN')}` : 'Mission Active')}
                        </Badge>
                        <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-[0.2em] opacity-60">
                          {userRole === 'store_owner' ? 'Inventory Level' : 'Deal Status'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
