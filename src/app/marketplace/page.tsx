"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  Loader2,
  Store,
  ChevronRight,
  Filter,
  Heart,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getExpiryStatus, getDaysRemaining } from "@/lib/utils/expiry"
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
    if (!user || !firestore) return

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
    
    toast({ title: "Order Placed", description: "Successfully reserved your rescue item." })
  }

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    return matchesSearch && matchesCategory && p.status !== 'SOLD'
  }) || []

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">Save fresh food at huge discounts while helping the planet.</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search food items..." 
              className="pl-9 h-11 border-none bg-secondary/50"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={activeCategory === cat ? "default" : "secondary"}
                className={cn(
                  "h-9 px-4 rounded-full text-xs font-bold",
                  activeCategory === cat ? "" : "bg-secondary"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
             <p className="text-xs font-medium text-muted-foreground">Fetching deals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const daysLeft = getDaysRemaining(p.expiryDate)
              const discount = p.initialPrice ? Math.round(((p.initialPrice - p.currentPrice) / p.initialPrice) * 100) : 0
              const placeholder = getPlaceholderByCategory(p.category);
              
              return (
                <Card key={p.id} className="overflow-hidden border-none shadow-sm card-hover flex flex-col">
                  <div className="relative aspect-video bg-secondary/20">
                    <img src={p.imageUrl || placeholder.imageUrl} alt={p.name} className="object-cover w-full h-full" />
                    {discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-white border-none font-bold">-{discount}%</Badge>
                    )}
                    <Badge variant="secondary" className="absolute bottom-2 right-2 glass text-[10px] font-bold">
                      {daysLeft <= 0 ? "Expires Today" : `${daysLeft}d left`}
                    </Badge>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-primary uppercase font-bold tracking-widest">{p.category || 'Surplus'}</p>
                      <h3 className="font-bold text-base line-clamp-1">{p.name}</h3>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-primary">₹{p.currentPrice?.toFixed(0)}</span>
                        {discount > 0 && <span className="text-xs text-muted-foreground line-through opacity-50">₹{p.initialPrice?.toFixed(0)}</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-rose-500"><Heart className="h-4 w-4" /></Button>
                        <Button 
                          size="sm"
                          className="h-9 px-4 rounded-lg font-bold"
                          onClick={() => handleReserve(p)}
                        >
                          Buy
                        </Button>
                      </div>
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