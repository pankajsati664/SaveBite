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
import { getPlaceholderById } from "@/lib/placeholder-images"
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

  const heroImage = getPlaceholderById('hero-bg')

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10 pb-24 animate-in fade-in duration-1000">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none">
              Hello, <span className="text-primary">{userProfile?.name?.split(' ')[0] || 'Member'}</span>!
            </h1>
            <p className="text-muted-foreground font-medium italic text-base sm:text-lg opacity-80">Track your zero-waste impact.</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 rounded-xl bg-white border-none shadow-lg flex items-center gap-2 w-fit">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </Badge>
        </div>

        {/* Responsive Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {getStats().map((stat, idx) => (
            <Card key={stat.label} className={cn(
              "border-none shadow-xl card-3d overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]",
              `animate-in fade-in slide-in-from-bottom-4 delay-[${idx * 100}ms]`
            )}>
              <CardContent className="p-4 sm:p-8">
                <div className={cn("h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl sm:text-4xl font-black tracking-tighter">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Visual Panel */}
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-zinc-900 text-white relative h-fit lg:h-auto">
            <img 
              src={heroImage.imageUrl} 
              className="absolute inset-0 object-cover w-full h-full opacity-30 mix-blend-luminosity" 
              alt="Performance Overview"
              data-ai-hint={heroImage.imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent pointer-events-none" />
            <CardHeader className="p-6 sm:p-10 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge className="bg-primary text-white border-none px-3 py-1 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Weekly Impact</Badge>
                  <CardTitle className="text-2xl sm:text-4xl font-black tracking-tighter">Performance</CardTitle>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-10 sm:w-10 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-10 pt-0 relative z-10">
              <div className="h-[150px] sm:h-[250px] flex items-end justify-between gap-2 sm:gap-6">
                {[30, 45, 35, 60, 80, 50, 95].map((val, i) => (
                  <div key={i} className="flex-1 group relative">
                    <div 
                      className="w-full bg-primary/20 group-hover:bg-primary transition-all duration-700 rounded-lg sm:rounded-2xl relative border border-white/5" 
                      style={{ height: `${val}%` }} 
                    />
                    <p className="text-center mt-3 sm:mt-6 font-black text-[8px] sm:text-[10px] text-white/50 uppercase">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Hub */}
          <Card className="border-none shadow-2xl rounded-[2.5rem] sm:rounded-[3rem] bg-white overflow-hidden flex flex-col">
            <CardHeader className="p-6 sm:p-10">
              <CardTitle className="text-xl sm:text-3xl font-black tracking-tighter flex items-center gap-2 sm:gap-3">
                <Zap className="h-5 w-5 sm:h-7 sm:w-7 text-amber-500 fill-amber-500" />
                Action Hub
              </CardTitle>
              <CardDescription className="font-medium italic text-sm sm:text-lg">Rescue surplus instantly.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-10 pt-0 space-y-6 sm:space-y-8 flex-1">
              {userRole === 'store_owner' ? (
                <div className="space-y-6">
                  <div className="bg-secondary/40 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-secondary shadow-inner">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Discount</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-black px-2 py-0.5 rounded-lg">{quickDiscount}%</Badge>
                    </div>
                    <Slider 
                      value={[quickDiscount]} 
                      onValueChange={(vals) => setQuickDiscount(vals[0])} 
                      max={90} min={10} step={5}
                      className="mb-6 sm:mb-8"
                    />
                    <Button 
                      onClick={handleQuickDiscount} 
                      disabled={isApplying || nearExpiryCount === 0}
                      className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-base sm:text-lg shadow-xl shadow-primary/20"
                    >
                      {isApplying ? <Loader2 className="animate-spin h-5 w-5" /> : `Rescue ${nearExpiryCount} Items`}
                    </Button>
                  </div>
                  <Link href="/inventory" className="block">
                    <Button variant="outline" className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl border-secondary font-black uppercase tracking-widest text-[9px] sm:text-[11px] hover:bg-secondary">
                      Inventory Management <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <Link href="/marketplace" className="block">
                    <Button className="w-full h-16 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-primary text-white font-black text-lg sm:text-xl shadow-2xl shadow-primary/30">
                      Browse Deals <ShoppingBag className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </Link>
                  <Link href="/orders" className="block">
                    <Button variant="ghost" className="w-full h-16 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-blue-500/10 text-blue-600 font-black text-lg sm:text-xl">
                      Rescue Journal <ClipboardList className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </Link>
                  <div className="bg-emerald-50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-emerald-100 mt-2 sm:mt-4">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Eco Tip</p>
                    <p className="text-emerald-900 font-medium italic text-xs sm:text-sm">Rescuing dairy today saves 5kg of CO2 emissions per item!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Panel */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="p-6 sm:p-10 border-b border-secondary/50">
            <CardTitle className="text-xl sm:text-3xl font-black tracking-tighter">Impact Journal</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-10">
            <div className="space-y-3 sm:space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-black uppercase tracking-widest text-[8px] sm:text-[10px] text-muted-foreground">Syncing...</p>
                </div>
              ) : (userRole === 'store_owner' ? allProducts : (userRole === 'customer' ? allOrders : allClaimed))?.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground font-medium italic">No recent activity detected.</p>
              ) : (
                (userRole === 'store_owner' ? allProducts?.slice(0, 5) : (userRole === 'customer' ? allOrders?.slice(0, 5) : allClaimed?.slice(0, 5)))?.map((item: any, i) => (
                  <div key={item.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-secondary/30 rounded-2xl sm:rounded-3xl transition-all border border-transparent hover:border-secondary">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-lg sm:rounded-2xl bg-secondary/50 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform">
                        {userRole === 'store_owner' ? <Package className="h-5 w-5 sm:h-8 sm:w-8" /> : <ShoppingBag className="h-5 w-5 sm:h-8 sm:w-8" />}
                      </div>
                      <div>
                        <p className="font-black text-sm sm:text-xl tracking-tight leading-tight line-clamp-1">{userRole === 'store_owner' ? item.name : item.productName || 'Surplus Rescue'}</p>
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest">{new Date(item.updatedAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 sm:px-6 sm:py-2 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-sm border-primary/20 text-primary bg-primary/5">
                      {userRole === 'store_owner' ? `${item.quantity}U` : `₹${item.totalAmount}`}
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
