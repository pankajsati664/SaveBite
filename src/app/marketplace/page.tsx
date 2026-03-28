"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2,
  AlertCircle
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export default function MarketplacePage() {
  const [search, setSearch] = useState("")
  const { toast } = useToast()
  const firestore = useFirestore()

  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "products_marketplace")
  }, [firestore])

  const { data: products, isLoading } = useCollection(marketplaceQuery)

  const handleBuy = (productName: string) => {
    toast({
      title: "Order Placed!",
      description: `You've successfully reserved ${productName}. Visit store for pickup.`,
    })
  }

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-headline font-bold mb-2">Save Food, Save Money</h1>
            <p className="text-lg text-muted-foreground italic">
              "Every item purchased is an item saved from the landfill."
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-4 py-2 border-primary/20 text-primary bg-primary/5 rounded-full font-bold">
              Real-time Marketplace
            </Badge>
          </div>
        </div>

        <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 lg:-mx-8 lg:px-8 border-y flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="What are you craving today?" 
              className="pl-10 h-12 rounded-full border-primary/20 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-full border-primary/20 hover:bg-primary/5">
            <Filter className="mr-2 h-4 w-4" />
            Categories
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-xl bg-secondary/20 animate-pulse" />
             ))
          ) : filteredProducts.map((product) => {
            const daysLeft = getDaysRemaining(product.expiryDate)
            const discount = product.initialPrice ? Math.round(((product.initialPrice - product.currentPrice) / product.initialPrice) * 100) : 0
            
            return (
              <Card key={product.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
                  <img 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} 
                    alt={product.name} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  {discount > 0 && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-danger text-white border-none font-bold text-sm px-3 py-1 shadow-lg">
                        {discount}% OFF
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground flex items-center gap-1 shadow-sm">
                      <Clock className="h-3 w-3" />
                      {daysLeft <= 0 ? "Ends Today" : `Expires in ${daysLeft}d`}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</CardTitle>
                      <CardDescription className="text-xs font-medium flex items-center mt-1">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        Available for Sale
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 py-0">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">${product.currentPrice?.toFixed(2) || product.initialPrice?.toFixed(2)}</span>
                    {discount > 0 && (
                      <span className="text-sm text-muted-foreground line-through">${product.initialPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    Verified Listing
                  </div>
                </CardContent>

                <CardFooter className="p-4 mt-auto">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
                    onClick={() => handleBuy(product.name)}
                  >
                    Reserve Deal
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-secondary/20 rounded-3xl border-2 border-dashed border-primary/20">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold">No deals found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
