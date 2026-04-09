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
  TrendingDown,
  Filter,
  AlertTriangle,
  Info,
  Heart,
  Zap,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getExpiryStatus, getDaysRemaining } from "@/lib/utils/expiry"
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { getPlaceholderByCategory, getPlaceholderById } from "@/lib/placeholder-images"

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
      toast({ variant: "destructive", title: "Access Denied", description: "Identity verification required." })
      return
    }

    const orderData = {
      customerId: user.uid,
      orderDate: new Date().toISOString(),
      totalAmount: product.currentPrice || product.initialPrice,
      status: 'Pending',
      createdAt: serverTimestamp(),
      productName: product.name,
      productId: product.id,
      shopId: product.ownerId
    }

    addDocumentNonBlocking(collection(firestore, "users", user.uid, "orders"), orderData)
    
    const newQty = (product.quantity || 1) - 1
    const updateData = { 
      quantity: newQty, 
      status: newQty <= 0 ? 'SOLD' : 'AVAILABLE_FOR_SALE', 
      updatedAt: serverTimestamp() 
    }
    
    updateDocumentNonBlocking(doc(firestore, "products_marketplace", product.id), updateData)
    updateDocumentNonBlocking(doc(firestore, "users", product.ownerId, "products", product.id), updateData)
    
    toast({ title: "Rescue Mission INITIATED", description: "Item secured. Check Rescue Journal for pickup details." })
  }

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    return matchesSearch && matchesCategory && p.status !== 'SOLD'
  }) || []

  const heroImage = getPlaceholderById('landing-customer')

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-32 animate-in fade-in duration-1000">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-[3rem] bg-emerald-900 px-10 py-20 sm:px-16 sm:py-28 text-white shadow-3xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-50 mix-blend-overlay scale-110" 
            alt="Market"
            data-ai-hint={heroImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/40 to-transparent" />
          <div className="relative z-10 space-y-8 max-w-2xl">
            <Badge className="bg-emerald-500/30 text-emerald-100 border-none px-6 py-2 font-black uppercase tracking-widest text-[10px] backdrop-blur-xl">
              <Zap className="mr-2 h-4 w-4 text-amber-400 fill-amber-400" /> Active Rescue Feed
            </Badge>
            <h1 className="text-5xl sm:text-8xl font-black leading-[0.85] tracking-tighter">
              Eat Good. <br /><span className="text-primary italic">Save the Planet.</span>
            </h1>
            <p className="text-lg sm:text-2xl text-emerald-50/90 font-medium italic opacity-90 max-w-md leading-relaxed">
              Premium surplus food rescued from local verified partners. High quality, zero waste.
            </p>
          </div>
        </div>

        {/* Search & Filter Dock */}
        <div className="sticky top-20 z-30 space-y-4">
          <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col gap-6">
            <div className="relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input 
                placeholder="Search by product, category or shop..." 
                className="pl-16 h-16 sm:h-20 rounded-[1.5rem] bg-zinc-50 border-none shadow-inner text-xl font-bold placeholder:text-muted-foreground/40"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full">
              {categories.map(cat => (
                <Button 
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className={cn(
                    "h-14 px-8 rounded-2xl border-none shadow-md font-black uppercase text-[10px] tracking-widest shrink-0 transition-all",
                    activeCategory === cat ? "bg-primary text-white scale-105 shadow-xl shadow-primary/20" : "bg-white text-foreground hover:bg-emerald-50"
                  )}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-6">
             <Loader2 className="h-20 w-20 animate-spin text-primary opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Accessing Global Surplus Feed...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((p, i) => {
              const daysLeft = getDaysRemaining(p.expiryDate)
              const status = getExpiryStatus(p.expiryDate)
              const discount = p.initialPrice ? Math.round(((p.initialPrice - p.currentPrice) / p.initialPrice) * 100) : 0
              const placeholder = getPlaceholderByCategory(p.category);
              
              return (
                <Card key={p.id} className="overflow-hidden border-none shadow-2xl card-3d rounded-[3rem] bg-white flex flex-col group animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="relative aspect-[4/5] bg-secondary/10 overflow-hidden">
                    <img 
                      src={p.imageUrl || placeholder.imageUrl} alt={p.name}
                      className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                    />
                    {discount > 0 && (
                      <div className="absolute top-6 left-6">
                        <Badge className="bg-rose-500 text-white border-none font-black text-[11px] px-5 py-2.5 rounded-2xl shadow-2xl shadow-rose-500/30">-{discount}% OFF</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-6 right-6">
                      <Badge variant="secondary" className="bg-white/95 backdrop-blur flex items-center gap-2 shadow-2xl border-none py-2.5 px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-900">
                        <Clock className={cn("h-5 w-5", daysLeft <= 1 ? "text-danger animate-pulse" : "text-primary")} />
                        {daysLeft <= 0 ? "EXPIRES TODAY" : `${daysLeft}D REMAINING`}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8 flex-1 flex flex-col gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                        <Store className="h-4 w-4" /> {p.category || 'Surplus'} • Verified Store
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tighter line-clamp-2 leading-[1.1] group-hover:text-primary transition-colors">{p.name}</h3>
                    </div>

                    {status === 'near-expiry' && (
                       <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <p className="text-[10px] font-black uppercase text-amber-800 tracking-tight leading-none">Immediate Consumption Advised</p>
                       </div>
                    )}

                    <div className="mt-auto flex items-baseline gap-4">
                      <span className="text-4xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</span>
                      {discount > 0 && <span className="text-lg text-muted-foreground line-through font-bold opacity-30 tracking-tight">₹{p.initialPrice?.toFixed(0)}</span>}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 h-16 bg-primary hover:bg-primary/90 rounded-2xl shadow-2xl shadow-primary/20 font-black text-[12px] uppercase tracking-[0.1em] active:scale-95 transition-all"
                        onClick={() => handleReserve(p)}
                      >
                        RESCUE NOW <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-zinc-100 hover:bg-rose-50 transition-colors">
                        <Heart className="h-7 w-7 text-rose-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}