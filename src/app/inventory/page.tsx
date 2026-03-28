"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Sparkles, 
  Barcode,
  LayoutGrid,
  List,
  Loader2,
  FileText,
  Package,
  Calendar,
  IndianRupee,
  Layers,
  ChevronRight,
  TrendingDown
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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getExpiryStatus, getExpiryColorClass, getDaysRemaining } from "@/lib/utils/expiry"
import { generateDiscountSuggestion } from "@/ai/flows/generate-discount-suggestion-flow"
import { generateMarketplaceBlurb } from "@/ai/flows/generate-marketplace-blurb-flow"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  setDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"

export default function InventoryPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null)
  const [isBlurbLoading, setIsBlurbLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
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
        title: `AI Strategy for ${product.name}`,
        description: `Suggested ${suggestion.suggestedDiscountPercentage}% discount. Reasoning: ${suggestion.reasoning}`,
        action: (
          <Button 
            variant="default" 
            size="sm" 
            className="bg-primary text-white hover:bg-primary/90 rounded-lg"
            onClick={() => handleApplyDiscount(product, suggestion.suggestedDiscountPercentage)}
          >
            Apply Now
          </Button>
        )
      })
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to connect to the pricing engine." })
    } finally {
      setIsAiLoading(null)
    }
  }

  const handleGenerateBlurb = async (product: any) => {
    setIsBlurbLoading(product.id)
    try {
      const discount = product.initialPrice ? Math.round(((product.initialPrice - (product.currentPrice || product.initialPrice)) / product.initialPrice) * 100) : 0
      const result = await generateMarketplaceBlurb({
        productName: product.name,
        originalPrice: product.initialPrice,
        discountPercentage: discount,
        expiryDate: product.expiryDate,
        productDescription: product.description
      })
      
      const productRef = doc(firestore!, "users", user!.uid, "products", product.id)
      updateDocumentNonBlocking(productRef, {
        description: result.blurb,
        updatedAt: serverTimestamp()
      })

      toast({ title: "Smart Blurb Created", description: "AI has updated the product marketing blurb for the marketplace." })
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate marketing content." })
    } finally {
      setIsBlurbLoading(null)
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

    toast({ title: "Optimized Price Applied", description: `Updated ${product.name} to ₹${newPrice.toFixed(0)}` })
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

    toast({ title: "Inventory Updated", description: "Product is now live on the marketplace." })
    setIsAddOpen(false)
    setFormData({ name: "", price: "", quantity: "", expiryDate: "", category: "General", description: "" })
  }

  const handleDelete = (productId: string) => {
    if (!firestore || !user) return
    const productRef = doc(firestore, "users", user.uid, "products", productId)
    const marketplaceRef = doc(firestore, "products_marketplace", productId)
    deleteDocumentNonBlocking(productRef)
    deleteDocumentNonBlocking(marketplaceRef)
    toast({ title: "Product Removed" })
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black font-headline tracking-tighter">Product Inventory</h1>
            <p className="text-muted-foreground text-lg font-medium italic">"Intelligent tracking for a waste-free store."</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-14 px-8 rounded-2xl border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest text-[11px] hidden sm:flex">
              <Barcode className="mr-3 h-5 w-5" />
              Scan Batch
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">
                  <Plus className="mr-3 h-5 w-5" />
                  New Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-10">
                <DialogHeader className="space-y-4">
                  <DialogTitle className="text-3xl font-black tracking-tighter">Add to Inventory</DialogTitle>
                  <DialogDescription className="text-base font-medium italic leading-relaxed">
                    Set your initial price and expiry date. SafeByte AI will automatically suggest markdowns as the date approaches.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="grid gap-8 py-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Product Identity</Label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                      <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Organic Greek Yogurt" className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none shadow-inner text-lg font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="price" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Initial Price (₹)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                        <Input id="price" required type="number" step="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="150" className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none shadow-inner text-lg font-medium" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="qty" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Stock Units</Label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                        <Input id="qty" required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="24" className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none shadow-inner text-lg font-medium" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="expiry" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Expiry Deadline</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                      <Input id="expiry" required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none shadow-inner text-lg font-medium" />
                    </div>
                  </div>
                </form>
                <DialogFooter className="gap-4">
                  <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] px-8">Dismiss</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] px-10 shadow-xl shadow-primary/20" onClick={handleAddProduct}>Publish Listing</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-card p-6 rounded-[2rem] border border-secondary shadow-xl animate-in slide-in-from-right-4 duration-500">
          <div className="relative w-full sm:w-[400px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input placeholder="Filter your inventory..." className="pl-14 h-14 border-transparent bg-secondary/40 focus:bg-background rounded-2xl text-lg font-medium transition-all" />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex bg-secondary/50 p-1.5 rounded-2xl">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="icon" 
                className="rounded-xl h-10 w-10 transition-all"
                onClick={() => setViewMode('table')}
              >
                <List className="h-5 w-5" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="icon" 
                className="rounded-xl h-10 w-10 transition-all"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </div>
            <Separator orientation="vertical" className="h-10 bg-secondary" />
            <Badge variant="outline" className="px-5 py-3 font-black uppercase tracking-widest text-[10px] rounded-xl border-secondary bg-secondary/20">
              {products?.length || 0} Total Records
            </Badge>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-card rounded-[2.5rem] border border-secondary shadow-2xl overflow-hidden animate-in fade-in duration-1000">
            <Table>
              <TableHeader className="bg-secondary/20 h-20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] pl-10 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Product Identity</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Pricing Strategy</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Stock Volume</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Freshness Status</TableHead>
                  <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-muted-foreground">AI Toolbox & Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <span className="font-black uppercase tracking-widest text-xs">Syncing Ledger...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24">
                       <div className="flex flex-col items-center gap-6">
                         <div className="p-6 rounded-full bg-secondary/50">
                           <Layers className="h-10 w-10 text-muted-foreground opacity-30" />
                         </div>
                         <p className="text-xl font-bold text-muted-foreground italic">No products registered in this vault.</p>
                         <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px]">Add First Item</Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.map((product, idx) => {
                    const status = getExpiryStatus(product.expiryDate)
                    const daysLeft = getDaysRemaining(product.expiryDate)
                    const discount = product.initialPrice ? Math.round(((product.initialPrice - product.currentPrice) / product.initialPrice) * 100) : 0
                    
                    return (
                      <TableRow key={product.id} className={cn(
                        "group h-24 transition-all duration-300 hover:bg-secondary/10 border-b border-secondary/50",
                        `animate-in fade-in slide-in-from-left-4 delay-[${idx * 50}ms]`
                      )}>
                        <TableCell className="pl-10">
                          <div className="flex flex-col">
                            <span className="font-black text-lg group-hover:text-primary transition-colors leading-tight">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Batch ID: {product.id.slice(0, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xl text-primary tracking-tighter">₹{(product.currentPrice || product.initialPrice).toFixed(0)}</span>
                              {discount > 0 && (
                                <Badge variant="outline" className="border-danger/20 bg-danger/5 text-danger font-black text-[9px] px-2 py-0.5 rounded-lg">-{discount}%</Badge>
                              )}
                            </div>
                            {product.currentPrice < product.initialPrice && (
                              <span className="text-xs text-muted-foreground line-through font-bold opacity-60">₹{product.initialPrice.toFixed(0)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-lg">{product.quantity}</span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Units</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("flex w-fit items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm", getExpiryColorClass(status))}>
                            <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                            {status === 'expired' ? 'Expired' : 
                             status === 'near-expiry' ? `Expiring in ${daysLeft}d` : `Fresh • ${daysLeft}d`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex items-center bg-secondary/30 p-1.5 rounded-2xl gap-1 border border-secondary">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-primary hover:text-white hover:bg-primary rounded-xl transition-all shadow-none"
                                onClick={() => handleAiSuggestion(product)}
                                disabled={isAiLoading === product.id}
                                title="AI Pricing Optimizer"
                              >
                                {isAiLoading === product.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <TrendingDown className="h-5 w-5" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-blue-500 hover:text-white hover:bg-blue-500 rounded-xl transition-all shadow-none"
                                onClick={() => handleGenerateBlurb(product)}
                                disabled={isBlurbLoading === product.id}
                                title="Generate Marketing Blurb"
                              >
                                {isBlurbLoading === product.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                              </Button>
                            </div>
                            <Separator orientation="vertical" className="h-10 bg-secondary" />
                            <div className="flex items-center gap-1">
                               <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-secondary rounded-xl">
                                 <Edit2 className="h-5 w-5" />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-10 w-10 text-danger hover:text-white hover:bg-danger rounded-xl transition-all"
                                 onClick={() => handleDelete(product.id)}
                               >
                                 <Trash2 className="h-5 w-5" />
                               </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.map((product, idx) => {
              const status = getExpiryStatus(product.expiryDate)
              const colorClass = getExpiryColorClass(status).split(' ')[0].replace('text-', 'bg-')
              
              return (
                <div key={product.id} className={cn(
                    "bg-card border-none rounded-[2.5rem] p-10 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden group animate-in zoom-in-95",
                    `delay-[${idx * 50}ms]`
                )}>
                  <div className={cn("absolute top-0 right-0 w-3 h-full opacity-50", colorClass)} />
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-black text-2xl tracking-tighter mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                      <Badge className={cn("px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm", getExpiryColorClass(status))}>
                        {status === 'expired' ? 'Expired' : `Fresh • ${getDaysRemaining(product.expiryDate)} Days`}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-secondary/30 p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Volume</p>
                          <p className="text-xl font-black">{product.quantity} Units</p>
                       </div>
                       <div className="bg-secondary/30 p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Category</p>
                          <p className="text-xl font-black truncate">{product.category}</p>
                       </div>
                    </div>

                    <div className="flex justify-between items-end pt-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Market Price</p>
                        <p className="text-4xl font-black text-primary tracking-tighter">₹{(product.currentPrice || product.initialPrice).toFixed(0)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20" onClick={() => handleAiSuggestion(product)} disabled={isAiLoading === product.id}>
                          <Sparkles className={cn("h-6 w-6", isAiLoading === product.id && "animate-spin")} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-12 w-12 rounded-2xl text-danger hover:bg-danger/10" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
