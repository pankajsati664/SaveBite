
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

    const newQty = (product.quantity || 1) - 1
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
      description: `Successfully claimed ${product.name}.`,
    })
  }

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    return matchesSearch && matchesCategory && p.status !== 'SOLD'
  }) || []

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="relative overflow-hidden rounded-2xl md:rounded-[3rem] bg-gradient-to-br from-primary via-primary to-accent px-6 py-12 md:px-10 md:py-20 text-white shadow-xl group">
          <div className="absolute inset-0 bg-grid-white/[0.1] pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4 md:space-y-6">
            <Badge className="bg-white/20 text-white border-none backdrop-blur-xl px-4 py-1.5 md:px-5 md:py-2 font-black uppercase tracking-widest text-[9px] md:text-xs">
              <Sparkles className="mr-2 h-3 w-3 md:h-4 md:w-4 text-yellow-300" />
              Live Marketplace
            </Badge>
            <h1 className="text-4xl md:text-7xl font-headline font-black mb-2 leading-tight tracking-tighter">
              Eat Good. <br /><span className="text-accent underline decoration-white/20 underline-offset-8">Pay Less.</span>
            </h1>
            <p className="text-base md:text-xl text-primary-foreground/90 max-w-xl font-medium leading-relaxed italic opacity-90">
              Discover premium surplus food from your favorite local stores.
            </p>
          </div>
          <ShoppingBag className="absolute -bottom-10 -right-10 md:-bottom-16 md:-right-16 h-40 w-40 md:h-80 md:w-80 text-white/10 rotate-12" />
        </div>

        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-xl py-4 -mx-4 px-4 md:py-6 lg:-mx-8 lg:px-8 border-y border-secondary flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
              <Input 
                placeholder="Search deals..." 
                className="pl-12 h-14 rounded-xl md:rounded-[1.5rem] border-secondary bg-secondary/30 shadow-sm focus:ring-4 focus:ring-primary/10 transition-all text-sm md:text-lg font-medium"
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
                    "h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl border-secondary whitespace-nowrap font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all",
                    activeCategory === cat ? "shadow-lg shadow-primary/30" : "hover:bg-primary/5"
                  )}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-2xl md:rounded-3xl bg-secondary/30 animate-pulse border border-secondary" />
             ))
          ) : filteredProducts.map((product, idx) => {
            const daysLeft = getDaysRemaining(product.expiryDate)
            const discount = product.initialPrice ? Math.round(((product.initialPrice - product.currentPrice) / product.initialPrice) * 100) : 0
            const placeholder = getPlaceholderByCategory(product.category);
            
            return (
              <Card key={product.id} className={cn(
                "overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-500 flex flex-col rounded-2xl md:rounded-[2.5rem] bg-card",
                `animate-in fade-in slide-in-from-bottom-4 delay-[${idx * 50}ms]`
              )}>
                <div className="relative aspect-[4/3] md:aspect-[5/4] overflow-hidden bg-secondary/30">
                  <img 
                    src={product.imageUrl || placeholder.imageUrl} 
                    alt={product.name} 
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    data-ai-hint={placeholder.imageHint}
                  />
                  {discount > 0 && (
                    <div className="absolute top-3 left-3 md:top-4 md:left-4">
                      <Badge className="bg-danger text-white border-none font-black text-[10px] md:text-xs px-3 py-1 md:px-4 md:py-2 shadow-xl rounded-xl">
                        -{discount}%
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4">
                    <Badge variant="secondary" className="bg-white/95 text-foreground flex items-center gap-1.5 shadow-md border-none py-1.5 px-3 rounded-xl font-black text-[9px] uppercase tracking-widest">
                      <Clock className="h-3 w-3 text-primary" />
                      {daysLeft <= 0 ? "TODAY" : `${daysLeft}D`}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-5 md:p-7 flex-1 space-y-2">
                  <CardTitle className="text-xl md:text-2xl font-headline font-black line-clamp-1 leading-tight">{product.name}</CardTitle>
                  <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest">
                    <Store className="h-3.5 w-3.5" />
                    {product.category || 'General'}
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic font-medium leading-relaxed opacity-80">
                      "{product.description}"
                    </p>
                  )}
                </CardHeader>

                <CardContent className="px-5 md:px-7 pt-0">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">₹{(product.currentPrice || product.initialPrice).toFixed(0)}</span>
                    {discount > 0 && (
                      <span className="text-sm md:text-base text-muted-foreground line-through font-bold opacity-60">₹{product.initialPrice.toFixed(0)}</span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-5 md:p-7 mt-auto border-t border-secondary bg-secondary/5">
                  <Button 
                    className="w-full h-12 md:h-14 bg-primary hover:bg-primary/90 text-white rounded-xl md:rounded-2xl shadow-lg shadow-primary/10 font-black text-[11px] uppercase tracking-widest transition-all"
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
          <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center bg-secondary/10 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-primary/20">
             <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50 mb-6" />
            <h3 className="text-2xl font-black mb-2 text-foreground">No matches found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm md:text-lg font-medium italic">
              Try a different category or broaden your search!
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
