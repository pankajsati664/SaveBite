"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2,
  Sparkles,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getExpiryStatus, getExpiryColorClass, getDaysRemaining } from "@/lib/utils/expiry"
import { generateDiscountSuggestion } from "@/ai/flows/generate-discount-suggestion-flow"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase"
import { collection, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { getPlaceholderByCategory } from "@/lib/placeholder-images"

export default function InventoryPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedStockImage, setSelectedStockImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    expiryDate: "",
    category: "General"
  })

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "users", user.uid, "products"), orderBy("createdAt", "desc"))
  }, [firestore, user])

  const stockImagesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "stock_images"), orderBy("createdAt", "desc"))
  }, [firestore])

  const { data: products, isLoading } = useCollection(productsQuery)
  const { data: stockImages } = useCollection(stockImagesQuery)

  const handleAiAnalysis = async (product: any) => {
    setIsAiLoading(product.id)
    try {
      const suggestion = await generateDiscountSuggestion({
        productName: product.name,
        originalPrice: product.currentPrice || product.initialPrice,
        expiryDate: product.expiryDate
      })
      toast({
        title: "AI Recommendation",
        description: `Suggested ${suggestion.suggestedDiscountPercentage}% off. ${suggestion.reasoning}`,
        action: (
          <Button size="sm" onClick={() => applyDiscount(product, suggestion.suggestedDiscountPercentage)}>Apply</Button>
        )
      })
    } finally {
      setIsAiLoading(null)
    }
  }

  const applyDiscount = (product: any, discount: number) => {
    if (!firestore || !user) return
    const newPrice = (product.initialPrice * (100 - discount)) / 100
    const updateData = {
      currentPrice: newPrice,
      status: discount >= 100 ? 'AVAILABLE_FOR_DONATION' : 'AVAILABLE_FOR_SALE',
      updatedAt: serverTimestamp()
    }
    updateDocumentNonBlocking(doc(firestore, "users", user.uid, "products", product.id), updateData)
    setDocumentNonBlocking(doc(firestore, "products_marketplace", product.id), updateData, { merge: true })
    toast({ title: "Price Updated", description: `${product.name} is now ₹${newPrice.toFixed(0)}` })
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firestore || !user) return
    
    const productData = {
      ...formData,
      initialPrice: parseFloat(formData.price),
      currentPrice: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      ownerId: user.uid,
      imageUrl: selectedStockImage || "",
      status: 'AVAILABLE_FOR_SALE',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    addDocumentNonBlocking(collection(firestore, "users", user.uid, "products"), productData)
      .then(docRef => {
        if (docRef) {
          setDocumentNonBlocking(doc(firestore, "products_marketplace", docRef.id), { ...productData, id: docRef.id }, { merge: true })
        }
      })

    setIsAddOpen(false)
    setFormData({ name: "", price: "", quantity: "", expiryDate: "", category: "General" })
    setSelectedStockImage(null)
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">Manage your stock and track expiry dates.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
                <DialogDescription>Enter product details to add to your inventory.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  <Input type="number" placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground ml-1">Expiry Date</p>
                  <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground ml-1">Select Image</p>
                  <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto p-2 bg-secondary/50 rounded-lg">
                    {stockImages?.map((img) => (
                      <div 
                        key={img.id}
                        onClick={() => setSelectedStockImage(img.url)}
                        className={cn(
                          "aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all",
                          selectedStockImage === img.url ? "border-primary" : "border-transparent opacity-60"
                        )}
                      >
                        <img src={img.url} className="object-cover w-full h-full" alt="Stock" />
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 font-bold">Save Product</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11 border-none bg-transparent" 
            />
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11"><Filter className="h-4 w-4" /></Button>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-xs font-medium text-muted-foreground">Loading inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).map((p) => {
              const status = getExpiryStatus(p.expiryDate)
              const days = getDaysRemaining(p.expiryDate)
              const placeholder = getPlaceholderByCategory(p.category)
              return (
                <Card key={p.id} className="border-none shadow-sm card-hover overflow-hidden flex flex-col">
                  <div className="aspect-[16/10] relative bg-secondary/20">
                    <img src={p.imageUrl || placeholder.imageUrl} className="object-cover w-full h-full" alt={p.name} />
                    <Badge className={cn("absolute top-3 right-3 border-none", getExpiryColorClass(status))}>
                      {days < 0 ? 'Expired' : `${days}d left`}
                    </Badge>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold truncate">{p.name}</h3>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{p.category} • {p.quantity} Units</p>
                      </div>
                      <p className="text-xl font-bold text-primary">₹{p.currentPrice?.toFixed(0)}</p>
                    </div>

                    <div className="mt-auto flex gap-2">
                       <Button onClick={() => handleAiAnalysis(p)} variant="secondary" className="flex-1 h-10 text-xs font-bold gap-2">
                          {isAiLoading === p.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                          AI Discount
                       </Button>
                       <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10" onClick={() => {
                          deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))
                          deleteDocumentNonBlocking(doc(firestore!, "products_marketplace", p.id))
                       }}>
                          <Trash2 className="h-4 w-4" />
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