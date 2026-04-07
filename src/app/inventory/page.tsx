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
import { getPlaceholderByCategory } from "@/lib/placeholder-images"

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
      <div className="space-y-6 sm:space-y-10 pb-24 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">Inventory</h1>
            <p className="text-muted-foreground font-medium italic text-sm sm:text-lg opacity-80">Manage your surplus stock.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 sm:h-16 px-8 sm:px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] sm:text-[11px] shadow-lg">
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-6 sm:p-10 max-w-xl">
              <DialogHeader className="mb-4 sm:mb-8 text-center">
                <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tighter">Add Product</DialogTitle>
                <DialogDescription className="font-medium italic">Create a new listing for the market.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Product Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/30 border-none text-base" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Price (₹)</Label>
                    <Input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/30 border-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Stock Qty</Label>
                    <Input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/30 border-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Expiry Date</Label>
                  <Input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/30 border-none" />
                </div>
                <Button type="submit" className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-lg">Publish Listing</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-secondary flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Filter stock..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-11 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/20 border-none text-base font-medium"
            />
          </div>
          <div className="flex bg-secondary/40 p-1 rounded-xl sm:rounded-2xl w-full sm:w-auto">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} className="flex-1 sm:flex-none rounded-lg sm:rounded-xl h-10 sm:h-11 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => setViewMode('table')}>Table</Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} className="flex-1 sm:flex-none rounded-lg sm:rounded-xl h-10 sm:h-11 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => setViewMode('grid')}>Cards</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Syncing Vault...</p>
          </div>
        ) : viewMode === 'table' ? (
          <Card className="border-none shadow-2xl rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/10 h-16 sm:h-20">
                  <TableRow className="border-none">
                    <TableHead className="pl-6 sm:pl-10 font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-muted-foreground">Item</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-muted-foreground">Price</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-muted-foreground">Expiry</TableHead>
                    <TableHead className="text-right pr-6 sm:pr-10 font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-muted-foreground">Tools</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const status = getExpiryStatus(p.expiryDate)
                    return (
                      <TableRow key={p.id} className="group hover:bg-secondary/10 transition-all border-b border-secondary/30">
                        <TableCell className="pl-6 sm:pl-10">
                          <p className="font-black text-base sm:text-xl tracking-tight leading-none mb-1">{p.name}</p>
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Qty: {p.quantity}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg sm:text-2xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("px-3 py-1 rounded-lg font-black uppercase text-[8px] sm:text-[9px] tracking-widest border-none", getExpiryColorClass(status))}>
                            {getDaysRemaining(p.expiryDate)}D
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 sm:pr-10">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl text-primary" onClick={() => handleAiSuggestion(p)}>
                              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl text-danger" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))}>
                              <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filteredProducts.map((p, i) => {
              const status = getExpiryStatus(p.expiryDate)
              const placeholder = getPlaceholderByCategory(p.category)
              return (
                <Card key={p.id} className={cn(
                  "border-none card-3d rounded-[2rem] sm:rounded-[3rem] bg-white overflow-hidden flex flex-col",
                  `animate-in fade-in slide-in-from-bottom-4 delay-[${i * 50}ms]`
                )}>
                  <div className="relative aspect-[3/2] overflow-hidden bg-secondary/10">
                    <img 
                      src={p.imageUrl || placeholder.imageUrl} alt={p.name}
                      className="object-cover w-full h-full opacity-80"
                      data-ai-hint={placeholder.imageHint}
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={cn("px-3 py-1 rounded-lg border-none shadow-sm font-black text-[8px] uppercase tracking-widest", getExpiryColorClass(status))}>
                        {status === 'expired' ? 'EXP' : `${getDaysRemaining(p.expiryDate)}D`}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 sm:p-8 flex flex-col flex-1">
                    <Badge variant="outline" className="w-fit mb-2 px-3 py-1 rounded-lg border-secondary bg-secondary/20 font-black text-[8px] uppercase tracking-widest">{p.category || 'Surplus'}</Badge>
                    <h3 className="text-lg sm:text-2xl font-black tracking-tighter mb-4 leading-tight line-clamp-1">{p.name}</h3>
                    <div className="grid grid-cols-2 gap-2 bg-secondary/20 p-4 rounded-2xl mb-6 mt-auto">
                      <div>
                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1">Stock</p>
                        <p className="text-base sm:text-xl font-black">{p.quantity}U</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1">Value</p>
                        <p className="text-base sm:text-xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAiSuggestion(p)} className="flex-1 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-900 text-white font-black uppercase text-[8px] sm:text-[10px] tracking-widest">
                        <Sparkles className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-amber-400" /> AI Pricing
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl text-danger bg-danger/5" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "users", user!.uid, "products", p.id))}>
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
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
