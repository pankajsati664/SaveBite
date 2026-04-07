"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Trash2, 
  LayoutGrid,
  List,
  Loader2,
  TrendingDown,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  setDocumentNonBlocking
} from "@/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"

export default function InventoryPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [search, setSearch] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    expiryDate: "",
    category: "General",
    description: ""
  })

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return collection(firestore, "users", user.uid, "products")
  }, [firestore, user])

  const { data: products, isLoading } = useCollection(productsQuery)

  const handleAiSuggestion = async (product: any) => {
    setIsAiLoading(product.id)
    try {
      const suggestion = await generateDiscountSuggestion({
        productName: product.name,
        originalPrice: product.currentPrice || product.initialPrice,
        expiryDate: product.expiryDate
      })
      toast({
        title: "AI Analysis Complete",
        description: `${suggestion.suggestedDiscountPercentage}% discount recommended. ${suggestion.reasoning}`,
        action: (
          <Button 
            className="bg-primary text-white" 
            onClick={() => handleApplyDiscount(product, suggestion.suggestedDiscountPercentage)}
          >
            Apply
          </Button>
        )
      })
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to connect to the pricing engine." })
    } finally {
      setIsAiLoading(null)
    }
  }

  const handleApplyDiscount = (product: any, discount: number) => {
    if (!firestore || !user) return
    const newPrice = (product.initialPrice * (100 - discount)) / 100
    const productRef = doc(firestore, "users", user.uid, "products", product.id)
    const marketplaceRef = doc(firestore, "products_marketplace", product.id)
    const updateData = {
      currentPrice: newPrice,
      lastAIRecommendation: `Discount ${discount}%`,
      recommendedActionDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      status: discount >= 100 ? 'AVAILABLE_FOR_DONATION' : 'AVAILABLE_FOR_SALE'
    }
    setDocumentNonBlocking(productRef, updateData, { merge: true })
    if (updateData.status === 'AVAILABLE_FOR_SALE') {
      setDocumentNonBlocking(marketplaceRef, { ...product, ...updateData }, { merge: true })
    }
    toast({ title: "Price Optimized", description: `Updated to ₹${newPrice.toFixed(0)}` })
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firestore || !user) return
    const productData = {
      name: formData.name,
      initialPrice: parseFloat(formData.price),
      currentPrice: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      expiryDate: formData.expiryDate,
      category: formData.category,
      description: formData.description,
      ownerId: user.uid,
      status: 'AVAILABLE_FOR_SALE',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    const colRef = collection(firestore, "users", user.uid, "products")
    addDocumentNonBlocking(colRef, productData).then((docRef) => {
      if (docRef) {
        const marketplaceRef = doc(firestore, "products_marketplace", docRef.id)
        setDocumentNonBlocking(marketplaceRef, { ...productData, id: docRef.id }, { merge: true })
      }
    })
    toast({ title: "Product Added", description: "Inventory has been updated." })
    setIsAddOpen(false)
    setFormData({ name: "", price: "", quantity: "", expiryDate: "", category: "General", description: "" })
  }

  const filteredProducts = products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || []

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter">Inventory</h1>
            <p className="text-muted-foreground font-medium italic text-lg opacity-80">Track and manage your surplus efficiently.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all">
                <Plus className="mr-3 h-5 w-5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[3rem] p-10 max-w-xl">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-3xl font-black tracking-tighter">New Product Listing</DialogTitle>
                <DialogDescription className="text-lg font-medium italic">Enter details to push to the marketplace.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-secondary/50 border-none shadow-inner text-lg" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Price (₹)</Label>
                    <Input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-14 rounded-2xl bg-secondary/50 border-none shadow-inner text-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Stock</Label>
                    <Input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="h-14 rounded-2xl bg-secondary/50 border-none shadow-inner text-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Expiry</Label>
                  <Input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="h-14 rounded-2xl bg-secondary/50 border-none shadow-inner text-lg" />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/20">Publish to Market</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-secondary flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Filter by product name..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none text-lg font-medium"
            />
          </div>
          <div className="flex bg-secondary/50 p-1.5 rounded-2xl">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => setViewMode('table')}>Table</Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => setViewMode('grid')}>Cards</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground">Initializing Vault...</p>
          </div>
        ) : viewMode === 'table' ? (
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/20 h-20">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Product</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Price</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Expires In</TableHead>
                    <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const status = getExpiryStatus(p.expiryDate)
                    return (
                      <TableRow key={p.id} className="group hover:bg-secondary/20 transition-all border-b border-secondary/50">
                        <TableCell className="pl-10">
                          <p className="font-black text-xl tracking-tight leading-none mb-1">{p.name}</p>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Qty: {p.quantity}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-2xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("px-4 py-1.5 rounded-xl font-black uppercase text-[9px] tracking-widest border-none shadow-sm", getExpiryColorClass(status))}>
                            {getDaysRemaining(p.expiryDate)} Days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl text-primary hover:bg-primary/10" onClick={() => handleAiSuggestion(p)}>
                              <TrendingDown className="h-6 w-6" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl text-danger hover:bg-danger/10" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))}>
                              <Trash2 className="h-6 w-6" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((p, i) => {
              const status = getExpiryStatus(p.expiryDate)
              return (
                <Card key={p.id} className={cn(
                  "border-none card-3d rounded-[3rem] p-10 bg-white relative overflow-hidden",
                  `animate-in fade-in slide-in-from-bottom-4 delay-[${i * 50}ms]`
                )}>
                  <div className={cn("absolute top-0 right-0 w-3 h-full opacity-50", getExpiryColorClass(status).split(' ')[1])} />
                  <div className="flex justify-between items-start mb-10">
                    <Badge variant="outline" className="px-4 py-1.5 rounded-xl border-secondary bg-secondary/20 font-black text-[9px] uppercase tracking-[0.2em]">{p.category || 'Surplus'}</Badge>
                    <Badge className={cn("px-4 py-1.5 rounded-xl border-none shadow-sm font-black text-[9px] uppercase tracking-widest", getExpiryColorClass(status))}>
                      {status === 'expired' ? 'EXPIRED' : `${getDaysRemaining(p.expiryDate)}D LEFT`}
                    </Badge>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter mb-4 leading-tight">{p.name}</h3>
                  <div className="grid grid-cols-2 gap-4 bg-secondary/20 p-6 rounded-3xl mb-8">
                    <div>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Stock</p>
                      <p className="text-2xl font-black">{p.quantity} U</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Value</p>
                      <p className="text-2xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => handleAiSuggestion(p)} className="flex-1 h-14 rounded-2xl bg-zinc-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:-translate-y-1 transition-all">
                      <Sparkles className="mr-2 h-4 w-4 text-amber-400" /> AI Pricing
                    </Button>
                    <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl text-danger bg-danger/5 hover:bg-danger/10" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}