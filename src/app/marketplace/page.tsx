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
      <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
        <div className="relative overflow-hidden rounded-[4rem] bg-gradient-to-br from-zinc-900 to-zinc-800 px-10 py-24 text-white shadow-2xl border-b-8 border-primary/20">
          <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-8">
            <Badge className="bg-primary text-white border-none px-6 py-2 font-black uppercase tracking-[0.3em] text-[10px] shadow-xl">
              <Sparkles className="mr-3 h-4 w-4 text-amber-400 fill-amber-400" />
              Live Marketplace
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tighter">
              Eat Good. <br /><span className="text-primary italic">Save More.</span>
            </h1>
            <p className="text-xl text-white/70 max-w-lg font-medium italic opacity-90 leading-relaxed">
              Premium surplus food from verified local partners. High quality, zero waste, incredible prices.
            </p>
          </div>
          <ShoppingBag className="absolute -bottom-10 -right-10 h-96 w-96 text-white/5 rotate-12" />
        </div>

        <div className="sticky top-20 z-20 bg-background/80 backdrop-blur-3xl py-8 flex flex-col md:flex-row gap-8 items-center border-b border-secondary/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input 
              placeholder="What are you craving today?" 
              className="pl-16 h-16 rounded-[2rem] bg-white border-none shadow-2xl text-xl font-medium focus:ring-4 focus:ring-primary/10 transition-all"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto px-2">
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                className={cn(
                  "h-14 px-8 rounded-2xl border-none shadow-lg font-black uppercase text-[10px] tracking-widest transition-all",
                  activeCategory === cat ? "bg-primary text-white shadow-primary/20 scale-105" : "bg-white text-foreground hover:bg-primary/5"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
             {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[450px] rounded-[3rem] bg-secondary/30 animate-pulse shadow-inner" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredProducts.map((p, i) => {
              const daysLeft = getDaysRemaining(p.expiryDate)
              const discount = p.initialPrice ? Math.round(((p.initialPrice - p.currentPrice) / p.initialPrice) * 100) : 0
              const placeholder = getPlaceholderByCategory(p.category);
              return (
                <Card key={p.id} className={cn(
                  "overflow-hidden border-none card-3d rounded-[3rem] bg-white flex flex-col group",
                  `animate-in fade-in slide-in-from-bottom-8 delay-[${i * 50}ms]`
                )}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-secondary/20">
                    <img 
                      src={p.imageUrl || placeholder.imageUrl} alt={p.name}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      data-ai-hint={placeholder.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {discount > 0 && (
                      <div className="absolute top-6 left-6">
                        <Badge className="bg-rose-500 text-white border-none font-black text-xs px-5 py-2 rounded-2xl shadow-2xl shadow-rose-500/30">-{discount}% OFF</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-6 right-6">
                      <Badge variant="secondary" className="bg-white/95 text-foreground flex items-center gap-2 shadow-2xl border-none py-2 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {daysLeft <= 0 ? "EXPIRES TODAY" : `${daysLeft}D LEFT`}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-8 pb-4 flex-1">
                    <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">
                      <Store className="h-4 w-4" />
                      {p.category || 'Surplus Batch'}
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter line-clamp-1 group-hover:text-primary transition-colors">{p.name}</CardTitle>
                    <p className="text-muted-foreground text-sm font-medium italic line-clamp-2 opacity-80 mt-2">"{p.description || 'Verified fresh item ready for rescue.'}"</p>
                  </CardHeader>
                  <CardContent className="px-8 pb-0 flex items-end gap-3 mb-6">
                    <span className="text-4xl font-black text-primary tracking-tighter leading-none">₹{p.currentPrice?.toFixed(0)}</span>
                    {discount > 0 && <span className="text-lg text-muted-foreground line-through font-bold opacity-40">₹{p.initialPrice?.toFixed(0)}</span>}
                  </CardContent>
                  <CardFooter className="p-8 pt-0 mt-auto">
                    <Button 
                      className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-2xl shadow-primary/20 font-black text-lg uppercase tracking-widest transition-all hover:translate-x-1"
                      onClick={() => handleReserve(p)}
                    >
                      Rescue Deal <ChevronRight className="ml-2 h-6 w-6" />
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