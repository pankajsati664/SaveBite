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
  Users
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

  // Queries based on role
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

  // Dynamic stats based on role
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
        { label: "Food Points", value: "120", icon: Heart, color: "bg-accent", trend: "+10" },
      ]
    } else { // NGO
      return [
        { label: "Total Rescues", value: allClaimed?.length.toString() || "0", icon: Heart, color: "bg-primary", trend: "+12%" },
        { label: "Pending Pickups", value: allClaimed?.filter(d => d.status === 'Claimed').length.toString() || "0", icon: Clock, color: "bg-warning", trend: "Urgent" },
        { label: "Meals Provided", value: (allClaimed?.length || 0 * 5).toString(), icon: Users, color: "bg-blue-500", trend: "+20%" },
        { label: "Partner Stores", value: "8", icon: Package, color: "bg-accent", trend: "Stable" },
      ]
    }
  }

  const nearExpiryCount = allProducts?.filter(p => getExpiryStatus(p.expiryDate) === 'near-expiry').length || 0
  const progressValue = allProducts?.length ? Math.min(100, (nearExpiryCount / allProducts.length) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-headline font-black text-foreground">
              Hello, {userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-muted-foreground text-lg">Your impact dashboard for today.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-4 py-2 bg-primary/5 border-primary/20 text-primary font-bold rounded-xl">
              <CalendarDays className="mr-2 h-4 w-4" />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStats().map((stat) => (
            <Card key={stat.label} className="border-none shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl text-white shadow-lg", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                    stat.trend.startsWith('+') ? "text-success bg-success/10" : 
                    stat.trend === "Alert" || stat.trend === "Urgent" ? "text-warning bg-warning/10" : "text-danger bg-danger/10"
                  )}>
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                     (stat.trend === "Alert" || stat.trend === "Urgent") ? <AlertTriangle className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                  <p className="text-4xl font-black mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Placeholder */}
          <Card className="lg:col-span-2 border-none shadow-md rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
                Impact Performance
              </CardTitle>
              <CardDescription>
                {userRole === 'store_owner' ? 'Estimated food weight saved from landfill (kg)' : 
                 userRole === 'customer' ? 'Money saved through surplus deals (₹)' : 'Donations rescued (units)'} this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full bg-secondary/10 rounded-2xl flex items-end justify-between p-8 gap-3 border border-primary/5">
                {[45, 60, 40, 70, 85, 95, 80].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div 
                      className="w-full max-w-[50px] bg-primary/60 group-hover:bg-primary transition-all rounded-t-xl relative shadow-lg shadow-primary/10" 
                      style={{ height: `${val}%` }} 
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-2 py-1 rounded text-[10px] font-bold">
                        {val}{userRole === 'customer' ? '₹' : 'kg'}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-3 font-bold uppercase tracking-tighter">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Urgent Alerts or Quick Actions */}
          <Card className="border-none shadow-md rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                {userRole === 'store_owner' ? <Clock className="h-5 w-5 text-warning" /> : <ShoppingBag className="h-5 w-5 text-primary" />}
                {userRole === 'store_owner' ? 'Urgent Actions' : 'Quick Access'}
              </CardTitle>
              <CardDescription>
                {userRole === 'store_owner' ? 'Critical inventory items status' : 'Ready to save more?'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {userRole === 'store_owner' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground">Expiry Risk Level</span>
                    <span className="text-warning">{Math.round(progressValue)}% of stock</span>
                  </div>
                  <Progress value={progressValue} className="h-3 bg-secondary rounded-full" />
                  <p className="text-xs text-muted-foreground italic">
                    {nearExpiryCount} units are expiring within 3 days. Action recommended.
                  </p>
                </div>
              )}

              {userRole !== 'store_owner' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <p className="text-sm font-bold text-primary mb-1">Impact Spotlight</p>
                    <p className="text-xs text-muted-foreground">You've saved roughly 15kg of CO2 this month by rescuing surplus food!</p>
                  </div>
                </div>
              )}

              <Separator className="bg-primary/10" />

              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-primary">
                  {userRole === 'store_owner' ? 'Quick Rescue Actions' : 'Recommended'}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {userRole === 'store_owner' ? (
                    <>
                      <Link href="/inventory" className="w-full">
                        <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-primary/20 hover:bg-primary/5">
                          <AlertTriangle className="mr-3 h-5 w-5 text-warning" />
                          Apply AI Discounts
                        </Button>
                      </Link>
                      <Link href="/donations" className="w-full">
                        <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold">
                          <Heart className="mr-3 h-5 w-5" />
                          Batch Donate Surplus
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/marketplace" className="w-full">
                        <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-primary/20 hover:bg-primary/5">
                          <ShoppingBag className="mr-3 h-5 w-5 text-primary" />
                          Browse Marketplace
                        </Button>
                      </Link>
                      <Link href="/orders" className="w-full">
                        <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-primary/20 hover:bg-primary/5">
                          <ClipboardList className="mr-3 h-5 w-5 text-muted-foreground" />
                          Track My Rescues
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
        <Card className="border-none shadow-md rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-2xl font-headline">Recent Activity</CardTitle>
              <CardDescription>Real-time updates from your journey</CardDescription>
            </div>
            <Link href={userRole === 'store_owner' ? "/inventory" : (userRole === 'customer' ? "/orders" : "/donations")}>
              <Button variant="ghost" className="text-primary hover:text-primary/80 font-bold">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (userRole === 'store_owner' ? allProducts : (userRole === 'customer' ? allOrders : allClaimed))?.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground italic">
                  No recent activity recorded yet.
                </div>
              ) : (
                (userRole === 'store_owner' ? allProducts?.slice(0, 5) : (userRole === 'customer' ? allOrders?.slice(0, 5) : allClaimed?.slice(0, 5)))?.map((item) => {
                  return (
                    <div key={item.id} className="flex items-center justify-between group p-4 hover:bg-secondary/10 rounded-2xl transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm bg-primary/20 text-primary"
                        )}>
                          {userRole === 'store_owner' ? <Package className="h-6 w-6" /> : 
                           userRole === 'customer' ? <ShoppingBag className="h-6 w-6" /> : <Heart className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-lg group-hover:text-primary transition-colors leading-tight">
                            {userRole === 'store_owner' ? item.name : (userRole === 'customer' ? item.productName : item.name)}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                            {userRole === 'store_owner' ? `Expires ${new Date(item.expiryDate).toLocaleDateString()}` : 
                             `Updated ${new Date(item.updatedAt?.seconds * 1000 || item.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-black text-sm px-3 py-1 rounded-full border-primary/20">
                          {userRole === 'store_owner' ? `${item.quantity} units` : (userRole === 'customer' ? `₹${item.totalAmount?.toLocaleString('en-IN')}` : 'Claimed')}
                        </Badge>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">
                          {userRole === 'store_owner' ? 'Stock Level' : 'Status'}
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
