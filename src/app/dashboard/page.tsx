"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Package, 
  AlertTriangle, 
  Heart, 
  TrendingUp, 
  Clock,
  CalendarDays,
  ShoppingBag,
  ClipboardList,
  Users,
  Sprout,
  Percent,
  Loader2,
  ChevronRight,
  Zap
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { getExpiryStatus } from "@/lib/utils/expiry"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const [quickDiscount, setQuickDiscount] = useState(30)
  const [isApplying, setIsApplying] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: userProfile } = useDoc(userDocRef)
  const userRole = userProfile?.role || 'customer'

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRole !== 'store_owner') return null
    return query(collection(firestore, "users", user.uid, "products"), orderBy("updatedAt", "desc"))
  }, [firestore, user, userRole])

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRole !== 'customer') return null
    return query(collection(firestore, "users", user.uid, "orders"), orderBy("createdAt", "desc"))
  }, [firestore, user, userRole])

  const claimedDonationsQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRole !== 'ngo') return null
    return query(collection(firestore, "users", user.uid, "claimed_donations"), orderBy("updatedAt", "desc"))
  }, [firestore, user, userRole])

  const { data: allProducts, isLoading: isProductsLoading } = useCollection(productsQuery)
  const { data: allOrders, isLoading: isOrdersLoading } = useCollection(ordersQuery)
  const { data: allClaimed, isLoading: isClaimedLoading } = useCollection(claimedDonationsQuery)

  const isLoading = isProductsLoading || isOrdersLoading || isClaimedLoading

  const nearExpiryCount = allProducts?.filter(p => getExpiryStatus(p.expiryDate) === 'near-expiry').length || 0
  const progressValue = allProducts?.length ? Math.min(100, (nearExpiryCount / allProducts.length) * 100) : 0

  const handleQuickDiscount = () => {
    if (!user || !firestore || !allProducts) return
    setIsApplying(true)
    const nearExpiryItems = allProducts.filter(p => getExpiryStatus(p.expiryDate) === 'near-expiry')
    if (nearExpiryItems.length === 0) {
      toast({ title: "No items at risk", description: "You have no near-expiry items to discount right now." })
      setIsApplying(false)
      return
    }
    nearExpiryItems.forEach(product => {
      const newPrice = (product.initialPrice * (100 - quickDiscount)) / 100
      const productRef = doc(firestore, "users", user.uid, "products", product.id)
      const marketplaceRef = doc(firestore, "products_marketplace", product.id)
      const updateData = {
        currentPrice: newPrice,
        lastAIRecommendation: `Quick Discount ${quickDiscount}%`,
        recommendedActionDate: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        status: quickDiscount >= 100 ? 'AVAILABLE_FOR_DONATION' : 'AVAILABLE_FOR_SALE'
      }
      updateDocumentNonBlocking(productRef, updateData)
      updateDocumentNonBlocking(marketplaceRef, updateData)
    })
    toast({ title: "Impact Applied!", description: `Successfully applied a ${quickDiscount}% discount to ${nearExpiryItems.length} items.` })
    setIsApplying(false)
  }

  const getStats = () => {
    if (userRole === 'store_owner') {
      return [
        { label: "Inventory", value: allProducts?.length.toString() || "0", icon: Package, color: "bg-blue-500" },
        { label: "At Risk", value: nearExpiryCount.toString() || "0", icon: AlertTriangle, color: "bg-amber-500" },
        { label: "Waste Prevented", value: "142kg", icon: Sprout, color: "bg-emerald-500" },
        { label: "Social Score", value: "9.8", icon: Heart, color: "bg-rose-500" },
      ]
    } else if (userRole === 'customer') {
      const totalSavings = allOrders?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) || 0
      return [
        { label: "Rescued", value: allOrders?.length.toString() || "0", icon: ShoppingBag, color: "bg-emerald-500" },
        { label: "Saved", value: `₹${totalSavings.toLocaleString('en-IN')}`, icon: TrendingUp, color: "bg-blue-500" },
        { label: "Eco Points", value: "1,240", icon: Zap, color: "bg-amber-500" },
        { label: "Impact", value: "Global", icon: Heart, color: "bg-rose-500" },
      ]
    } else { // NGO
      return [
        { label: "Claimed", value: allClaimed?.length.toString() || "0", icon: Heart, color: "bg-rose-500" },
        { label: "Pending", value: allClaimed?.filter(d => d.status === 'Claimed').length.toString() || "0", icon: Clock, color: "bg-amber-500" },
        { label: "Meals Provided", value: ((allClaimed?.length || 0) * 8).toString(), icon: Users, color: "bg-emerald-500" },
        { label: "Network", value: "12 Stores", icon: Package, color: "bg-blue-500" },
      ]
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">
              Welcome back, <span className="text-primary">{userProfile?.name?.split(' ')[0] || 'User'}</span>!
            </h1>
            <p className="text-muted-foreground font-medium italic text-lg opacity-80">Your impact contribution is making a real difference today.</p>
          </div>
          <Badge variant="outline" className="px-6 py-3 rounded-2xl bg-white border-none shadow-xl flex items-center gap-3 w-fit">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-black text-sm uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </Badge>
        </div>

        {/* 3D Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {getStats().map((stat, idx) => (
            <Card key={stat.label} className={cn(
              "border-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] card-3d overflow-hidden",
              `animate-in fade-in slide-in-from-bottom-4 delay-[${idx * 100}ms]`
            )}>
              <CardContent className="p-8">
                <div className={cn("h-14 w-14 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visual Panel */}
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative">
            <div className="absolute inset-0 bg-grid-white pointer-events-none" />
            <CardHeader className="p-10 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Badge className="bg-primary text-white border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">Weekly Performance</Badge>
                  <CardTitle className="text-4xl font-black tracking-tighter">Impact Analytics</CardTitle>
                </div>
                <TrendingUp className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-0 relative z-10">
              <div className="h-[250px] flex items-end justify-between gap-4 sm:gap-8">
                {[30, 45, 35, 60, 80, 50, 95].map((val, i) => (
                  <div key={i} className="flex-1 group relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-zinc-900 px-3 py-1 rounded-lg font-black text-xs shadow-xl">{val}%</div>
                    <div 
                      className="w-full bg-primary/20 group-hover:bg-primary transition-all duration-700 rounded-2xl relative shadow-lg shadow-primary/20 border border-white/5" 
                      style={{ height: `${val}%` }} 
                    />
                    <p className="text-center mt-6 font-black text-[10px] text-white/50 uppercase tracking-widest">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Center */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col">
            <CardHeader className="p-10">
              <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
                <Zap className="h-7 w-7 text-amber-500 fill-amber-500" />
                Action Hub
              </CardTitle>
              <CardDescription className="font-medium italic text-lg">Instant ways to contribute.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-8 flex-1">
              {userRole === 'store_owner' ? (
                <div className="space-y-6">
                  <div className="bg-secondary/30 p-8 rounded-[2rem] border border-secondary shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Discount</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-black px-3 py-1 rounded-lg">{quickDiscount}%</Badge>
                    </div>
                    <Slider 
                      value={[quickDiscount]} 
                      onValueChange={(vals) => setQuickDiscount(vals[0])} 
                      max={90} min={10} step={5}
                      className="mb-8"
                    />
                    <Button 
                      onClick={handleQuickDiscount} 
                      disabled={isApplying || nearExpiryCount === 0}
                      className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all"
                    >
                      {isApplying ? <Loader2 className="animate-spin h-6 w-6" /> : `Rescue ${nearExpiryCount} Items`}
                    </Button>
                  </div>
                  <Link href="/inventory" className="block">
                    <Button variant="outline" className="w-full h-16 rounded-2xl border-secondary font-black uppercase tracking-widest text-[11px] hover:bg-secondary">
                      Full Inventory Management <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link href="/marketplace" className="block">
                    <Button className="w-full h-20 rounded-[2rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 hover:-translate-y-2 transition-all">
                      Browse Live Deals <ShoppingBag className="ml-3 h-6 w-6" />
                    </Button>
                  </Link>
                  <Link href="/orders" className="block">
                    <Button variant="ghost" className="w-full h-20 rounded-[2rem] bg-blue-500/10 text-blue-600 font-black text-xl hover:bg-blue-500/20">
                      Rescue Journal <ClipboardList className="ml-3 h-6 w-6" />
                    </Button>
                  </Link>
                  <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Eco Tip</p>
                    <p className="text-emerald-900 font-medium italic text-sm">Rescuing dairy today saves 5kg of CO2 emissions per item!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Table */}
        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="p-10 border-b border-secondary/50">
            <CardTitle className="text-3xl font-black tracking-tighter">Impact Journal</CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Syncing data...</p>
                </div>
              ) : (userRole === 'store_owner' ? allProducts : (userRole === 'customer' ? allOrders : allClaimed))?.length === 0 ? (
                <p className="text-center py-20 text-muted-foreground font-medium italic">No recent activity detected.</p>
              ) : (
                (userRole === 'store_owner' ? allProducts?.slice(0, 5) : (userRole === 'customer' ? allOrders?.slice(0, 5) : allClaimed?.slice(0, 5)))?.map((item: any, i) => (
                  <div key={item.id} className="flex items-center justify-between p-6 hover:bg-secondary/30 rounded-3xl transition-all group border border-transparent hover:border-secondary">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                        {userRole === 'store_owner' ? <Package className="h-8 w-8" /> : <ShoppingBag className="h-8 w-8" />}
                      </div>
                      <div>
                        <p className="font-black text-xl tracking-tight leading-tight">{userRole === 'store_owner' ? item.name : item.productName || 'Surplus Rescue'}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{new Date(item.updatedAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="px-6 py-2 rounded-xl font-black text-sm border-primary/20 text-primary bg-primary/5">
                      {userRole === 'store_owner' ? `${item.quantity} U` : `₹${item.totalAmount}`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}