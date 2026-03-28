"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Store,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Card, 
  CardContent, 
  CardDescription, 
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

    // Update product quantity or status (in this MVP we mark it as SOLD if quantity is 1)
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
      title: "Order Placed!",
      description: `You've successfully reserved ${product.name}. Visit store for pickup.`,
    })
  }

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    return matchesSearch && matchesCategory && p.status !== 'SOLD'
  }) || []

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 font-bold">
              <Tag className="mr-2 h-3.5 w-3.5" />
              Surplus Savings
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-black mb-4 leading-tight">
              Save Food, <span className="text-accent">Save Money.</span>
            </h1>
            <p className="text-lg text-primary-foreground/90 max-w-xl italic">
              "Every item purchased is an item saved from the landfill. Shop local surplus deals and make an impact today."
            </p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          <ShoppingBag className="absolute -bottom-10 -right-10 h-64 w-64 text-white/10 rotate-12" />
        </div>

        <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 lg:-mx-8 lg:px-8 border-y flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="What are you craving today?" 
                className="pl-10 h-12 rounded-xl border-primary/20 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <Button 
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className={cn(
                    "h-12 px-6 rounded-xl border-primary/20 whitespace-nowrap",
                    activeCategory === cat && "shadow-lg shadow-primary/20"
                  )}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-2xl bg-secondary/20 animate-pulse border border-primary/10" />
             ))
          ) : filteredProducts.map((product) => {
            const daysLeft = getDaysRemaining(product.expiryDate)
            const discount = product.initialPrice ? Math.round(((product.initialPrice - product.currentPrice) / product.initialPrice) * 100) : 0
            
            return (
              <Card key={product.id} className="overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 group flex flex-col rounded-2xl">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
                  <img 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} 
                    alt={product.name} 
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  {discount > 0 && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-danger text-white border-none font-bold text-sm px-3 py-1 shadow-lg rounded-full">
                        -{discount}%
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-foreground flex items-center gap-1.5 shadow-sm border-none py-1.5 px-3 rounded-full font-bold">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {daysLeft <= 0 ? "Last chance" : `${daysLeft}d left`}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors font-headline">{product.name}</CardTitle>
                      <CardDescription className="text-sm font-medium flex items-center mt-1 text-muted-foreground">
                        <Store className="h-3.5 w-3.5 mr-1 text-primary" />
                        Local Store • {product.category}
                      </CardDescription>
                    </div>
                  </div>
                  {product.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2 italic border-l-2 border-primary/20 pl-3">
                      {product.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="px-5 py-0">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-primary">₹{(product.currentPrice || product.initialPrice).toFixed(2)}</span>
                    {discount > 0 && (
                      <span className="text-sm text-muted-foreground line-through">₹{product.initialPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    Verified Listing • {product.quantity} Left
                  </div>
                </CardContent>

                <CardFooter className="p-5 mt-auto">
                  <Button 
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl shadow-primary/20 font-bold transition-all hover:-translate-y-0.5"
                    onClick={() => handleReserve(product)}
                  >
                    Reserve Deal Now
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-secondary/10 rounded-3xl border-2 border-dashed border-primary/20">
            <div className="bg-background p-6 rounded-full shadow-lg mb-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No deals found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">Try adjusting your search or filters. New deals are added daily by local stores!</p>
            <Button variant="outline" className="mt-6 rounded-xl" onClick={() => { setSearch(""); setActiveCategory("All"); }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
