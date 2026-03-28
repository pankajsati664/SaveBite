
"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Store,
  Sparkles,
  ChevronRight
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
      toast({ variant: "destructive", title: "Login Required", description: "Please sign in to reserve deals." })
      return
    }

    const orderId = doc(collection(firestore, "temp")).id
    const orderData = {
      id: orderId,
      customerId: user.uid,
      orderDate: new Date().toISOString(),
      totalAmount: product.currentPrice || product.initialPrice,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      productName: product.name,
      productId: product.id
    }

    const ordersRef = collection(firestore, "users", user.uid, "orders")
    addDocumentNonBlocking(ordersRef, orderData)

    const newQty = product.quantity - 1
    const marketplaceRef = doc(firestore, "products_marketplace", product.id)
    const ownerProductRef = doc(firestore, "users", product.ownerId, "products", product.id)

    const updateData = {
      quantity: newQty,
      status: newQty <= 0 ? 'SOLD' : 'AVAILABLE_FOR_SALE',
      updatedAt: serverTimestamp()
    }

    updateDocumentNonBlocking(marketplaceRef, updateData)
    updateDocumentNonBlocking(ownerProductRef, updateData)

    toast({
      title: "Order Reserved!",
      description: `Successfully claimed ${product.name}. Head to the store for pickup.`,
    })
  }

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    return matchesSearch && matchesCategory && p.status !== 'SOLD'
  }) || []

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-primary to-accent px-10 py-20 text-white shadow-2xl border-4 border-white/10 group">
          <div className="absolute inset-0 bg-grid-white/[0.1] [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-6">
            <Badge className="bg-white/20 text-white border-none backdrop-blur-xl px-5 py-2 font-black uppercase tracking-widest text-xs">
              <Sparkles className="mr-2 h-4 w-4 animate-pulse text-yellow-300" />
              Live Marketplace
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-black mb-4 leading-tight tracking-tighter">
              Eat Good. <br /><span className="text-accent underline decoration-white/20 underline-offset-8">Pay Less.</span>
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-xl font-medium leading-relaxed italic opacity-90">
              Discover premium surplus food from your favorite local stores at up to 90% off. Fresh items, incredible impact.
            </p>
          </div>
          <ShoppingBag className="absolute -bottom-16 -right-16 h-80 w-80 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
        </div>

        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-xl py-6 -mx-4 px-4 lg:-mx-8 lg:px-8 border-y border-secondary flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search for fresh deals near you..." 
                className="pl-14 h-16 rounded-[1.5rem] border-secondary bg-secondary/30 shadow-sm focus:ring-4 focus:ring-primary/10 transition-all text-lg font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full md:w-auto">
              {categories.map(cat => (
                <Button 
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className={cn(
                    "h-14 px-8 rounded-2xl border-secondary whitespace-nowrap font-black uppercase tracking-widest text-[11px] transition-all duration-300",
                    activeCategory === cat ? "shadow-xl shadow-primary/30" : "hover:bg-primary/5 hover:border-primary/20"
                  )}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
             Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[450px] rounded-3xl bg-secondary/30 animate-pulse border border-secondary" />
             ))
          ) : filteredProducts.map((product, idx) => {
            const daysLeft = getDaysRemaining(product.expiryDate)
            const discount = product.initialPrice ? Math.round(((product.initialPrice - product.currentPrice) / product.initialPrice) * 100) : 0
            
            return (
              <Card key={product.id} className={cn(
                "overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-700 group flex flex-col rounded-[2.5rem] bg-card animate-in fade-in slide-in-from-bottom-4",
                `delay-[${idx * 50}ms]`
              )}>
                <div className="relative aspect-[5/4] overflow-hidden bg-secondary/30">
                  <img 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/500/400`} 
                    alt={product.name} 
                    className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                    data-ai-hint="fresh groceries"
                  />
                  
                  {discount > 0 && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-danger text-white border-none font-black text-xs px-4 py-2 shadow-2xl rounded-2xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                        SAVE {discount}%
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <Badge variant="secondary" className="bg-white/95 backdrop-blur-xl text-foreground flex items-center gap-2 shadow-xl border-none py-2 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                      <Clock className="h-4 w-4 text-primary" />
                      {daysLeft <= 0 ? "EXPIRES TODAY" : `${daysLeft}D REMAINING`}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-7 flex-1 space-y-3">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-headline font-black line-clamp-1 group-hover:text-primary transition-colors leading-tight">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                      <Store className="h-4 w-4" />
                      Local Partner • {product.category}
                    </div>
                  </div>
                  {product.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 italic font-medium leading-relaxed border-l-4 border-primary/20 pl-4 py-1">
                      "{product.description}"
                    </p>
                  ) : (
                    <div className="h-[44px]" />
                  )}
                </CardHeader>

                <CardContent className="px-7 pt-0">
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-4xl font-black text-primary tracking-tighter">₹{(product.currentPrice || product.initialPrice).toFixed(0)}</span>
                    {discount > 0 && (
                      <span className="text-base text-muted-foreground line-through font-bold opacity-60">₹{product.initialPrice.toFixed(0)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] opacity-70">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Verified SaveBite Deal • {product.quantity} In Stock
                  </div>
                </CardContent>

                <CardFooter className="p-7 mt-auto border-t border-secondary bg-secondary/5">
                  <Button 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/10 font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleReserve(product)}
                  >
                    Reserve Now <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-secondary/10 rounded-[3rem] border-2 border-dashed border-primary/20 animate-in zoom-in duration-500">
             <AlertCircle className="h-16 w-16 text-muted-foreground opacity-50 mb-8" />
            <h3 className="text-3xl font-black mb-3 text-foreground">No matching deals found</h3>
            <p className="text-muted-foreground max-w-md mx-auto font-medium text-lg leading-relaxed">
              New surplus items are added throughout the day. Try broadening your search or check back in a few hours!
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
