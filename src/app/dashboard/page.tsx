
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
  CalendarDays,
  ShoppingBag,
  ClipboardList,
  Users,
  Sprout,
  Percent,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, limit, orderBy, doc, serverTimestamp } from "firebase/firestore"
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

    toast({
      title: "Impact Applied!",
      description: `Successfully applied a ${quickDiscount}% discount to ${nearExpiryItems.length} items.`,
    })
    setIsApplying(false)
  }

  const getStats = () => {
    if (userRole === 'store_owner') {
      return [
        { label: "Inventory", value: allProducts?.length.toString() || "0", icon: Package, color: "bg-blue-500", trend: "+2%" },
        { label: "Near Expiry", value: nearExpiryCount.toString() || "0", icon: AlertTriangle, color: "bg-warning", trend: "Alert" },
        { label: "Expired", value: allProducts?.filter(p => getExpiryStatus(p.expiryDate) === 'expired').length.toString() || "0", icon: History, color: "bg-danger", trend: "-5%" },
        { label: "Impact", value: "94", icon: Heart, color: "bg-primary", trend: "+15%" },
      ]
    } else if (userRole === 'customer') {
      const totalSavings = allOrders?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) || 0
      return [
        { label: "Rescued", value: allOrders?.length.toString() || "0", icon: ShoppingBag, color: "bg-primary", trend: "+8%" },
        { label: "Savings", value: `₹${totalSavings.toLocaleString('en-IN')}`, icon: TrendingUp, color: "bg-success", trend: "Great" },
        { label: "Active", value: allOrders?.filter(o => o.status === 'Pending').length.toString() || "0", icon: Clock, color: "bg-blue-500", trend: "Active" },
        { label: "Points", value: "120", icon: Sprout, color: "bg-accent", trend: "+10" },
      ]
    } else { // NGO
      return [
        { label: "Rescues", value: allClaimed?.length.toString() || "0", icon: Heart, color: "bg-primary", trend: "+12%" },
        { label: "Pending", value: allClaimed?.filter(d => d.status === 'Claimed').length.toString() || "0", icon: Clock, color: "bg-warning", trend: "Urgent" },
        { label: "Meals", value: ((allClaimed?.length || 0) * 5).toString(), icon: Users, color: "bg-blue-500", trend: "+20%" },
        { label: "Partners", value: "8", icon: Package, color: "bg-accent", trend: "Stable" },
      ]
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-black text-foreground flex items-center gap-2 flex-wrap">
              Hello, {userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0]}!
              <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm lg:text-lg font-medium italic">"Every bite saved is a win for the planet."</p>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border-primary/20 text-primary font-bold rounded-xl shadow-sm w-full sm:w-auto justify-center text-[10px] sm:text-xs">
              <CalendarDays className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {getStats().map((stat, idx) => (
            <Card key={stat.label} className={cn(
              "border-none shadow-md overflow-hidden group hover:shadow-xl transition-all duration-500 rounded-2xl sm:rounded-3xl",
              `animate-in fade-in slide-in-from-bottom-4 delay-[${idx * 100}ms]`
            )}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2 sm:mb-6">
                  <div className={cn("p-2 sm:p-4 rounded-xl sm:rounded-2xl text-white shadow-lg", stat.color)}>
                    <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                  <div className={cn(
                    "hidden xs:flex items-center text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                    stat.trend.startsWith('+') ? "text-success bg-success/10" : 
                    stat.trend === "Alert" || stat.trend === "Urgent" ? "text-warning bg-warning/10" : "text-danger bg-danger/10"
                  )}>
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-0.5 sm:mb-1">{stat.label}</p>
                  <p className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight truncate">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Chart Placeholder */}
          <Card className="lg:col-span-2 border-none shadow-lg rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-card to-secondary/5">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl font-black">
                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                    Impact Performance
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-base font-medium">
                    {userRole === 'store_owner' ? 'Food saved (kg)' : 
                     userRole === 'customer' ? 'Money saved (₹)' : 'Donations (units)'} - Last 7 days
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-[180px] sm:h-[320px] w-full bg-secondary/10 rounded-xl sm:rounded-[2.5rem] flex items-end justify-between p-3 sm:p-10 gap-2 sm:gap-4 border border-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] pointer-events-none" />
                {[45, 65, 35, 75, 85, 100, 80].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group/bar relative z-10">
                    <div 
                      className="w-full max-w-[32px] sm:max-w-[40px] bg-primary/40 group-hover/bar:bg-primary transition-all duration-500 rounded-md sm:rounded-2xl relative shadow-lg shadow-primary/10" 
                      style={{ height: `${val}%` }} 
                    />
                    <span className="text-[7px] sm:text-[10px] text-muted-foreground mt-2 sm:mt-4 font-black uppercase tracking-widest opacity-70">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contextual Action Panel */}
          <Card className="border-none shadow-lg rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-tr from-primary/5 to-transparent">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl font-black">
                {userRole === 'store_owner' ? <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-warning" /> : <Sprout className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />}
                {userRole === 'store_owner' ? 'Critical Alerts' : 'Impact Growth'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-6 sm:space-y-8">
              {userRole === 'store_owner' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-[9px] sm:text-sm font-black uppercase tracking-wider">
                    <span className="text-muted-foreground">Inventory at Risk</span>
                    <span className="text-warning">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2 sm:h-4 bg-secondary rounded-full shadow-inner" />
                  <p className="text-[9px] sm:text-xs text-muted-foreground italic font-medium leading-relaxed">
                    <span className="text-warning font-black not-italic">{nearExpiryCount} items</span> are expiring within 72 hours.
                  </p>
                </div>
              )}

              {userRole !== 'store_owner' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-primary/10 shadow-sm relative overflow-hidden group">
                    <p className="text-[9px] sm:text-[10px] font-black text-primary mb-1.5 sm:mb-2 uppercase tracking-widest">Sustainability Milestone</p>
                    <p className="text-[10px] sm:text-sm font-bold leading-relaxed text-foreground/80">
                      You've prevented <span className="text-primary font-black">12.5kg of CO2</span> emissions this month!
                    </p>
                  </div>
                </div>
              )}

              <Separator className="bg-primary/10" />

              <div className="space-y-4">
                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary/70">
                  {userRole === 'store_owner' ? 'Recommended Actions' : 'Discovery Hub'}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {userRole === 'store_owner' ? (
                    <>
                      <Link href="/inventory" className="w-full">
                        <Button className="w-full justify-start h-10 sm:h-14 rounded-xl sm:rounded-2xl border-none bg-warning/10 text-warning-foreground hover:bg-warning/20 shadow-none font-black text-[10px] sm:text-xs">
                          <AlertTriangle className="mr-2 sm:mr-4 h-4 w-4 sm:h-5 sm:w-5" />
                          Optimize Near-Expiry Pricing
                        </Button>
                      </Link>

                      {nearExpiryCount > 0 && (
                        <div className="mt-2 pt-4 border-t border-primary/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary/70">Quick Discount Tool</h4>
                            <Badge variant="secondary" className="bg-primary/10 text-primary font-black text-[9px] sm:text-xs">{quickDiscount}%</Badge>
                          </div>
                          <div className="px-1">
                            <Slider 
                              value={[quickDiscount]} 
                              onValueChange={(vals) => setQuickDiscount(vals[0])} 
                              max={95} 
                              min={5}
                              step={5} 
                              className="py-1"
                            />
                          </div>
                          <Button 
                            onClick={handleQuickDiscount}
                            disabled={isApplying}
                            className="w-full h-10 sm:h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                          >
                            {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Percent className="mr-2 h-4 w-4" />}
                            Apply to {nearExpiryCount} Items
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Link href="/marketplace" className="w-full">
                        <Button className="w-full justify-start h-10 sm:h-14 rounded-xl sm:rounded-2xl border-none bg-primary/10 text-primary hover:bg-primary/20 shadow-none font-black text-[10px] sm:text-xs">
                          <ShoppingBag className="mr-2 sm:mr-4 h-4 w-4 sm:h-5 sm:w-5" />
                          Explore Live Deals
                        </Button>
                      </Link>
                      <Link href="/orders" className="w-full">
                        <Button className="w-full justify-start h-10 sm:h-14 rounded-xl sm:rounded-2xl border-none bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-none font-black text-[10px] sm:text-xs">
                          <ClipboardList className="mr-2 sm:mr-4 h-4 w-4 sm:h-5 sm:w-5" />
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
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-8 border-b border-secondary">
            <div className="space-y-0.5 sm:space-y-1">
              <CardTitle className="text-lg sm:text-3xl font-headline font-black">Recent Activity</CardTitle>
              <CardDescription className="text-xs sm:text-lg font-medium">Your contributions to zero waste</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-8">
            <div className="space-y-1 sm:space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Syncing impact data...</p>
                </div>
              ) : (userRole === 'store_owner' ? allProducts : (userRole === 'customer' ? allOrders : allClaimed))?.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground italic font-medium text-xs sm:text-sm">
                  No activity yet.
                </div>
              ) : (
                (userRole === 'store_owner' ? allProducts?.slice(0, 5) : (userRole === 'customer' ? allOrders?.slice(0, 5) : allClaimed?.slice(0, 5)))?.map((item: any, idx) => {
                  return (
                    <div key={item.id} className={cn(
                      "flex items-center justify-between p-3 sm:p-6 hover:bg-secondary/20 rounded-xl sm:rounded-[2rem] transition-all duration-300 border border-transparent hover:border-primary/5",
                      `animate-in fade-in slide-in-from-right-4 delay-[${idx * 50}ms]`
                    )}>
                      <div className="flex items-center gap-2.5 sm:gap-6">
                        <div className="h-8 w-8 sm:h-16 sm:w-16 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-md bg-white text-primary border border-secondary shrink-0">
                          {userRole === 'store_owner' ? <Package className="h-4 w-4 sm:h-8 sm:w-8" /> : 
                           userRole === 'customer' ? <ShoppingBag className="h-4 w-4 sm:h-8 sm:w-8" /> : <Heart className="h-4 w-4 sm:h-8 sm:w-8" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[11px] sm:text-xl truncate leading-tight mb-0.5 max-w-[120px] sm:max-w-[250px]">
                            {userRole === 'store_owner' ? item.name : (userRole === 'customer' ? item.productName : item.name || "Surplus Rescue")}
                          </p>
                          <p className="text-[7px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">
                            {userRole === 'store_owner' ? `Exp: ${new Date(item.expiryDate).toLocaleDateString()}` : 'Mission Active'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-black text-[8px] sm:text-sm px-1.5 py-0.5 sm:px-5 sm:py-2 rounded-md sm:rounded-xl border-primary/20 bg-primary/5 text-primary whitespace-nowrap">
                          {userRole === 'store_owner' ? `${item.quantity} U` : (userRole === 'customer' ? `₹${(item.totalAmount || 0)}` : 'Active')}
                        </Badge>
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
