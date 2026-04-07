
"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2,
  TrendingDown,
  Sparkles,
  Barcode,
  Upload,
  Leaf,
  Info,
  ChevronRight
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
  updateDocumentNonBlocking
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

  const { data: products, isLoading } = useCollection(productsQuery)

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
      status: 'AVAILABLE_FOR_SALE',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    addDocumentNonBlocking(collection(firestore, "users", user.uid, "products"), productData)
      .then(docRef => {
        if (docRef) {
          updateDocumentNonBlocking(doc(firestore, "products_marketplace", docRef.id), { ...productData, id: docRef.id })
        }
      })

    setIsAddOpen(false)
    setFormData({ name: "", price: "", quantity: "", expiryDate: "", category: "General" })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10 pb-24 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">Vault Management</h1>
            <p className="text-muted-foreground font-medium italic opacity-80">Track, analyze, and optimize your inventory.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-14 rounded-2xl border-secondary font-black uppercase text-[10px] hidden sm:flex">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
             </Button>
             <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 sm:h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg">
                  <Plus className="mr-2 h-5 w-5" /> New Product
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter">Inventory Ingress</DialogTitle>
                  <DialogDescription className="italic">Manual data entry or scan barcode.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <Input placeholder="Product Identity" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                    <Input type="number" placeholder="Volume" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                  </div>
                  <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none" />
                  <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg">Commit to Inventory</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[2.5rem] shadow-xl flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name or category..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-11 h-14 rounded-2xl bg-secondary/20 border-none font-medium" 
            />
          </div>
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-secondary">
             <Barcode className="h-6 w-6" />
          </Button>
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
                  <div className="aspect-[4/3] relative bg-secondary/10 overflow-hidden">
                    <img src={p.imageUrl || placeholder.imageUrl} className="object-cover w-full h-full opacity-80" alt={p.name} />
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

                    <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3">
                       <Leaf className="text-primary h-5 w-5" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">CO2 Impact: {((p.quantity || 1) * 0.4).toFixed(1)}kg Saved</p>
                    </div>

                    <div className="mt-auto pt-4 flex gap-2">
                       <Button onClick={() => handleAiAnalysis(p)} className="flex-1 h-12 rounded-xl bg-zinc-900 text-white font-black uppercase text-[10px] gap-2">
                          {isAiLoading === p.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 text-amber-400" />}
                          AI Predict
                       </Button>
                       <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-danger bg-danger/5" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))}>
                          <Trash2 className="h-5 w-5" />
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
