
"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2,
  Sparkles,
  Barcode,
  Upload,
  Leaf,
  ChevronRight,
  ImageIcon
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
    return collection(firestore, "users", user.uid, "products")
  }, [firestore, user])

  const stockImagesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "stock_images")
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
        title: "AI Analysis: SUCCESS",
        description: `Recommendation: ${suggestion.suggestedDiscountPercentage}% discount. ${suggestion.reasoning}`,
        action: (
          <Button onClick={() => applyDiscount(product, suggestion.suggestedDiscountPercentage)}>Apply</Button>
        )
      })
    } finally {
      setIsAiLoading(null)
    }
  }

  const applyDiscount = (product: any, discount: number) => {
    if (!firestore || !user) return
    const newPrice = (product.initialPrice * (100 - discount)) / 100
    const productRef = doc(firestore, "users", user.uid, "products", product.id)
    const marketplaceRef = doc(firestore, "products_marketplace", product.id)
    
    const updateData = {
      currentPrice: newPrice,
      status: discount >= 100 ? 'AVAILABLE_FOR_DONATION' : 'AVAILABLE_FOR_SALE',
      updatedAt: serverTimestamp()
    }
    
    updateDocumentNonBlocking(productRef, updateData)
    updateDocumentNonBlocking(marketplaceRef, updateData)
    toast({ title: "Pricing Applied", description: `Product is now listed at ₹${newPrice.toFixed(0)}` })
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
          // Use setDocumentNonBlocking for the first marketplace sync to avoid "Update missing document" error
          setDocumentNonBlocking(doc(firestore, "products_marketplace", docRef.id), { ...productData, id: docRef.id }, { merge: true })
        }
      })

    setIsAddOpen(false)
    setFormData({ name: "", price: "", quantity: "", expiryDate: "", category: "General" })
    setSelectedStockImage(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10 pb-24 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">Inventory Vault</h1>
            <p className="text-muted-foreground font-medium italic opacity-80">Oversee your local nodes and optimize yields.</p>
          </div>
          <div className="flex gap-3">
             <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 sm:h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg">
                  <Plus className="mr-2 h-5 w-5" /> Ingress Node
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter">Inventory Ingress</DialogTitle>
                  <DialogDescription className="italic">Manual data entry or catalog asset selection.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-6">
                  <Input placeholder="Product Identity" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                    <Input type="number" placeholder="Volume" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                  </div>
                  <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Library</p>
                    <div className="grid grid-cols-4 gap-3 overflow-x-auto pb-2">
                      {stockImages?.map((img) => (
                        <div 
                          key={img.id}
                          onClick={() => setSelectedStockImage(img.url)}
                          className={cn(
                            "aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all",
                            selectedStockImage === img.url ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img src={img.url} className="object-cover w-full h-full" alt="Stock" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20">Commit to Vault</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[2.5rem] shadow-xl flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Filter nodes..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-11 h-14 rounded-2xl bg-secondary/20 border-none font-medium" 
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => {
              const status = getExpiryStatus(p.expiryDate)
              const days = getDaysRemaining(p.expiryDate)
              const placeholder = getPlaceholderByCategory(p.category)
              return (
                <Card key={p.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white card-3d flex flex-col">
                  <div className="aspect-[4/5] relative bg-secondary/10 overflow-hidden">
                    <img src={p.imageUrl || placeholder.imageUrl} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" alt={p.name} />
                    <Badge className={cn("absolute top-6 left-6 border-none font-black uppercase text-[8px] px-3 py-1.5 rounded-xl shadow-lg", getExpiryColorClass(status))}>
                      {status === 'expired' ? 'EXPIRED' : `${days} Days Left`}
                    </Badge>
                  </div>
                  <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-black tracking-tighter leading-tight">{p.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p.category} • {p.quantity} Units</p>
                      </div>
                      <p className="text-3xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</p>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100">
                       <Leaf className="text-primary h-5 w-5" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">CO2 Impact: {((p.quantity || 1) * 0.4).toFixed(1)}kg Saved</p>
                    </div>

                    <div className="mt-auto pt-4 flex gap-2">
                       <Button onClick={() => handleAiAnalysis(p)} className="flex-1 h-14 rounded-2xl bg-zinc-900 text-white font-black uppercase text-[10px] gap-2 shadow-lg">
                          {isAiLoading === p.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 text-amber-400" />}
                          AI Insight
                       </Button>
                       <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl text-danger bg-danger/5" onClick={() => {
                          deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))
                          deleteDocumentNonBlocking(doc(firestore!, "products_marketplace", p.id))
                       }}>
                          <Trash2 className="h-6 w-6" />
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
