"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  Loader2,
  Store,
  Sparkles,
  ChevronRight,
  TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getDaysRemaining } from "@/lib/utils/expiry"
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { getPlaceholderByCategory } from "@/lib/placeholder-images"

export default function MarketplacePage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()

  const categories = ["All", "Dairy", "Produce", "Bakery", "Meat", "Pantry"]

  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "products_marketplace")
  }, [firestore])

  const { data: products, isLoading } = useCollection(marketplaceQuery)

  const handleReserve = async (product: any) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please sign in to secure this deal." })
      return
    }
    const orderData = {
      customerId: user.uid,
      orderDate: new Date().toISOString(),
      totalAmount: product.currentPrice || product.initialPrice,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      productName: product.name,
      productId: product.id
    }
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "orders"), orderData)
    const newQty = (product.quantity || 1) - 1
    const updateData = { quantity: newQty, status: newQty <= 0 ? 'SOLD' : 'AVAILABLE_FOR_SALE', updatedAt: serverTimestamp() }
    updateDocumentNonBlocking(doc(firestore, "products_marketplace", product.id), updateData)
    updateDocumentNonBlocking(doc(firestore, "users", product.ownerId, "products", product.id), updateData)
    toast({ title: "Deal Secured!", description: "Check your rescue journal for pickup details." })
  }

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    return matchesSearch && matchesCategory && p.status !== 'SOLD'
  }) || []

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-12 pb-24 animate-in fade-in duration-1000">
        <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[4rem] bg-zinc-900 px-6 py-12 sm:px-10 sm:py-24 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white opacity-10 pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4 sm:space-y-8 text-center sm:text-left">
            <Badge className="bg-primary text-white border-none px-4 py-1.5 sm:px-6 sm:py-2 font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] mx-auto sm:mx-0 w-fit">
              <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-amber-400 fill-amber-400" />
              Live Marketplace
            </Badge>
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black leading-tight tracking-tighter">
              Eat Good. <br className="hidden sm:block" /><span className="text-primary italic">Save More.</span>
            </h1>
            <p className="text-sm sm:text-xl text-white/70 max-w-lg font-medium italic opacity-90 leading-relaxed mx-auto sm:mx-0">
              Premium surplus food from verified local partners. High quality, zero waste, incredible prices.
            </p>
          </div>
          <ShoppingBag className="absolute -bottom-10 -right-10 h-48 w-48 sm:h-96 sm:w-96 text-white/5 rotate-12" />
        </div>

        <div className="sticky top-16 sm:top-20 z-20 bg-background/95 backdrop-blur-xl py-4 sm:py-8 flex flex-col gap-4 items-center border-b border-secondary/50">
          <div className="relative w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search cravings..." 
              className="pl-14 h-12 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-white border-none shadow-xl text-lg font-medium"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full px-1">
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                className={cn(
                  "h-10 sm:h-12 px-5 sm:px-8 rounded-xl sm:rounded-2xl border-none shadow-md font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all shrink-0",
                  activeCategory === cat ? "bg-primary text-white" : "bg-white text-foreground"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
             {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-secondary/30 animate-pulse" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-10">
            {filteredProducts.map((p, i) => {
              const daysLeft = getDaysRemaining(p.expiryDate)
              const discount = p.initialPrice ? Math.round(((p.initialPrice - p.currentPrice) / p.initialPrice) * 100) : 0
              const placeholder = getPlaceholderByCategory(p.category);
              return (
                <Card key={p.id} className={cn(
                  "overflow-hidden border-none card-3d rounded-[2rem] sm:rounded-[3rem] bg-white flex flex-col group",
                  `animate-in fade-in slide-in-from-bottom-4 delay-[${i * 50}ms]`
                )}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-secondary/10">
                    <img 
                      src={p.imageUrl || placeholder.imageUrl} alt={p.name}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                      data-ai-hint={placeholder.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 sm:top-6 sm:left-6">
                        <Badge className="bg-rose-500 text-white border-none font-black text-[8px] sm:text-[10px] px-3 py-1 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg">-{discount}%</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6">
                      <Badge variant="secondary" className="bg-white/95 text-foreground flex items-center gap-1.5 shadow-lg border-none py-1 sm:py-2 px-2 sm:px-4 rounded-lg sm:rounded-xl font-black text-[7px] sm:text-[9px] uppercase tracking-widest">
                        <Clock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-primary" />
                        {daysLeft <= 0 ? "TODAY" : `${daysLeft}D LEFT`}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-4 sm:p-8 pb-2 flex-1">
                    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest mb-1 sm:mb-2">
                      <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                      {p.category || 'Surplus'}
                    </div>
                    <CardTitle className="text-lg sm:text-2xl font-black tracking-tighter line-clamp-1 leading-tight">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-8 pb-4 flex items-end gap-2">
                    <span className="text-xl sm:text-3xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</span>
                    {discount > 0 && <span className="text-[10px] sm:text-sm text-muted-foreground line-through font-bold opacity-40">₹{p.initialPrice?.toFixed(0)}</span>}
                  </CardContent>
                  <CardFooter className="p-4 sm:p-8 pt-0 mt-auto">
                    <Button 
                      className="w-full h-10 sm:h-14 bg-primary hover:bg-primary/90 text-white rounded-xl sm:rounded-2xl shadow-lg font-black text-[10px] sm:text-sm uppercase tracking-widest transition-all"
                      onClick={() => handleReserve(p)}
                    >
                      Rescue <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
