
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
  Heart
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
    
    toast({ title: "Rescue Mission INITIATED", description: "Item secured. Check Rescue Journal for pickup." })
  }

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    return matchesSearch && matchesCategory && p.status !== 'SOLD'
  }) || []

  const heroImage = getPlaceholderById('landing-customer')

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-12 pb-24 animate-in fade-in duration-1000">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-900 px-8 py-16 sm:py-24 text-white shadow-2xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-50 mix-blend-overlay" 
            alt="Hero"
            data-ai-hint={heroImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/40 to-transparent" />
          <div className="relative z-10 space-y-6 max-w-2xl">
            <Badge className="bg-emerald-500 text-white border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
              <Sparkles className="mr-2 h-4 w-4 text-amber-400 fill-amber-400" /> Live Feed
            </Badge>
            <h1 className="text-4xl sm:text-7xl font-black leading-tight tracking-tighter">
              Eat Good. <br /><span className="text-emerald-400 italic">Save Global.</span>
            </h1>
            <p className="text-sm sm:text-lg text-white/90 font-medium italic opacity-90 max-w-md">
              Rescue premium surplus food from verified local partners. Zero waste, maximum value.
            </p>
          </div>
        </div>

        <div className="sticky top-16 sm:top-20 z-20 bg-background/95 backdrop-blur-xl py-6 flex flex-col gap-4 items-center border-b border-secondary/50">
          <div className="relative w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by product or store..." 
              className="pl-14 h-14 sm:h-16 rounded-2xl bg-white border-none shadow-xl text-lg"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                className={cn(
                  "h-12 px-6 rounded-2xl border-none shadow-md font-black uppercase text-[10px] tracking-widest shrink-0 transition-all",
                  activeCategory === cat ? "bg-primary text-white" : "bg-white text-foreground hover:bg-emerald-50"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-10">
            {filteredProducts.map((p, i) => {
              const daysLeft = getDaysRemaining(p.expiryDate)
              const status = getExpiryStatus(p.expiryDate)
              const discount = p.initialPrice ? Math.round(((p.initialPrice - p.currentPrice) / p.initialPrice) * 100) : 0
              const placeholder = getPlaceholderByCategory(p.category);
              
              return (
                <Card key={p.id} className="overflow-hidden border-none card-3d rounded-[2.5rem] bg-white flex flex-col group animate-in fade-in slide-in-from-bottom-4">
                  <div className="relative aspect-[4/5] bg-secondary/10">
                    <img 
                      src={p.imageUrl || placeholder.imageUrl} alt={p.name}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    />
                    {discount > 0 && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-rose-500 text-white border-none font-black text-[10px] px-4 py-2 rounded-xl shadow-lg">-{discount}%</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4">
                      <Badge variant="secondary" className="bg-white/95 flex items-center gap-1.5 shadow-lg border-none py-2 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest">
                        <Clock className={cn("h-4 w-4", daysLeft <= 1 ? "text-danger animate-pulse" : "text-primary")} />
                        {daysLeft <= 0 ? "TODAY" : `${daysLeft}D LEFT`}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 sm:p-8 flex-1 flex flex-col gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <Store className="h-4 w-4" /> {p.category || 'Surplus'}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tighter line-clamp-1 leading-tight">{p.name}</h3>
                    </div>

                    {status === 'near-expiry' && (
                       <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <p className="text-[9px] font-black uppercase text-amber-700 tracking-tight">Consume within 48h</p>
                       </div>
                    )}

                    <div className="mt-auto flex items-end gap-3">
                      <span className="text-3xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</span>
                      {discount > 0 && <span className="text-sm text-muted-foreground line-through font-bold opacity-40">₹{p.initialPrice?.toFixed(0)}</span>}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl shadow-lg font-black text-[11px] uppercase tracking-widest"
                        onClick={() => handleReserve(p)}
                      >
                        RESCUE <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-secondary">
                        <Heart className="h-5 w-5 text-rose-500" />
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
