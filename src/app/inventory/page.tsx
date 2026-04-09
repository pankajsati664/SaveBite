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
  ImageIcon,
  LayoutGrid,
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
import { getPlaceholderByCategory, getPlaceholderById } from "@/lib/placeholder-images"

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
        title: "AI Analysis: SUCCESS",
        description: `Recommendation: ${suggestion.suggestedDiscountPercentage}% discount. ${suggestion.reasoning}`,
        action: (
          <Button size="sm" className="rounded-xl font-black text-[10px]" onClick={() => applyDiscount(product, suggestion.suggestedDiscountPercentage)}>Apply</Button>
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
    setDocumentNonBlocking(marketplaceRef, updateData, { merge: true })
    toast({ title: "Surplus Pricing Applied", description: `Product is now listed at ₹${newPrice.toFixed(0)}` })
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

  const heroImage = getPlaceholderById('landing-store')

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-32 animate-in fade-in duration-1000">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-[3rem] bg-zinc-950 px-10 py-16 sm:px-16 sm:py-20 text-white shadow-3xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-40 mix-blend-overlay" 
            alt="Vault"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <Badge className="bg-primary/20 text-primary border-none px-6 py-2 font-black uppercase tracking-widest text-[10px]">Stock Management</Badge>
              <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none">The <span className="text-primary italic">Vault.</span></h1>
              <p className="text-zinc-400 font-medium italic text-lg sm:text-xl max-w-xl opacity-90">Audit your inventory, track expiry, and optimize surplus redistribution.</p>
            </div>
            <div className="flex gap-4">
               <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="h-20 px-12 rounded-[1.75rem] bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    <Plus className="mr-3 h-6 w-6" /> Add Node (नया जोड़ें)
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[3rem] p-10 max-w-2xl bg-white border-none shadow-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-4xl font-black tracking-tighter">Inventory Ingress</DialogTitle>
                    <DialogDescription className="italic text-lg">Register fresh stock into the SaveBite network.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-8 mt-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Product Identity</p>
                      <Input placeholder="Organic Milk, Artisan Bread..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-16 rounded-2xl bg-secondary/30 border-none px-6 font-bold" required />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Base Price (₹)</p>
                        <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-16 rounded-2xl bg-secondary/30 border-none px-6 font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Initial Volume</p>
                        <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="h-16 rounded-2xl bg-secondary/30 border-none px-6 font-bold" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Expiry Deadline</p>
                      <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="h-16 rounded-2xl bg-secondary/30 border-none px-6 font-bold" required />
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Stock Assets (स्टॉक इमेज)</p>
                      <div className="grid grid-cols-5 gap-3 max-h-[180px] overflow-y-auto p-3 bg-secondary/20 rounded-3xl border border-secondary/50">
                        {stockImages?.map((img) => (
                          <div 
                            key={img.id}
                            onClick={() => setSelectedStockImage(img.url)}
                            className={cn(
                              "aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all relative group",
                              selectedStockImage === img.url ? "border-primary scale-95 shadow-xl shadow-primary/20" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <img src={img.url} className="object-cover w-full h-full" alt="Stock" />
                            {selectedStockImage === img.url && (
                               <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                 <Plus className="text-white h-8 w-8 animate-in zoom-in" />
                               </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-20 rounded-[1.75rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 active:scale-95 transition-all">Commit to Vault</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-zinc-50">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input 
              placeholder="Search vault (इन्वेंट्री खोजें)..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-16 h-16 rounded-2xl bg-secondary/30 border-none font-bold text-lg placeholder:text-muted-foreground/50" 
            />
          </div>
          <Button variant="outline" className="h-16 w-16 rounded-2xl border-secondary bg-secondary/10">
            <Filter className="h-6 w-6" />
          </Button>
        </div>

        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <Loader2 className="h-20 w-20 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Synchronizing Vault Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p, idx) => {
              const status = getExpiryStatus(p.expiryDate)
              const days = getDaysRemaining(p.expiryDate)
              const placeholder = getPlaceholderByCategory(p.category)
              return (
                <Card key={p.id} className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white card-3d flex flex-col animate-in fade-in slide-in-from-bottom-6" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="aspect-[4/5] relative bg-secondary/10 overflow-hidden group">
                    <img src={p.imageUrl || placeholder.imageUrl} className="object-cover w-full h-full transition-transform duration-[2000ms] group-hover:scale-110 group-hover:rotate-1" alt={p.name} />
                    <div className="absolute top-8 left-8">
                       <Badge className={cn("border-none font-black uppercase text-[9px] px-4 py-2 rounded-xl shadow-xl", getExpiryColorClass(status))}>
                        {status === 'expired' ? 'CRITICAL: EXPIRED' : `${days} DAYS UNTIL DEADLINE`}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-10 space-y-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tighter leading-none group-hover:text-primary transition-colors">{p.name}</h3>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{p.category} • {p.quantity} Units in stock</p>
                      </div>
                      <p className="text-4xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</p>
                    </div>

                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] flex items-center justify-between border border-emerald-100 shadow-inner">
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-primary/10 rounded-xl">
                            <Leaf className="text-primary h-6 w-6" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 opacity-60">Impact Weight</p>
                            <p className="text-xl font-black text-emerald-950 tracking-tighter">Save {(p.quantity * 0.4).toFixed(1)}kg CO2</p>
                         </div>
                       </div>
                       <Badge variant="outline" className="border-emerald-200 text-[8px] bg-white text-emerald-700 font-black px-3 py-1">PREMIUM NODE</Badge>
                    </div>

                    <div className="mt-auto pt-6 flex gap-3">
                       <Button onClick={() => handleAiAnalysis(p)} className="flex-1 h-16 rounded-2xl bg-zinc-950 text-white font-black uppercase text-[10px] gap-3 shadow-2xl hover:shadow-primary/30 transition-all group/ai">
                          {isAiLoading === p.id ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5 text-amber-400 group-hover/ai:animate-pulse" />}
                          AI Insight Suggestions
                       </Button>
                       <Button variant="ghost" size="icon" className="h-16 w-16 rounded-2xl text-danger bg-danger/5 hover:bg-danger/10 hover:scale-105 transition-all" onClick={() => {
                          deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))
                          deleteDocumentNonBlocking(doc(firestore!, "products_marketplace", p.id))
                       }}>
                          <Trash2 className="h-7 w-7" />
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