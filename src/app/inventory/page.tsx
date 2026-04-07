
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
  ChevronRight
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
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

    toast({ title: "Inventory Updated", description: "Product is now live." })
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

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black font-headline tracking-tighter text-foreground">Inventory</h1>
            <p className="text-muted-foreground text-xs sm:text-lg font-medium italic">"Intelligent tracking for zero waste."</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10">
              <DialogHeader className="space-y-2 sm:space-y-4">
                <DialogTitle className="text-xl sm:text-3xl font-black tracking-tighter">Add to Inventory</DialogTitle>
                <DialogDescription className="text-xs sm:text-base font-medium italic">
                  SaveBite AI will suggest markdowns as the date approaches.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="grid gap-4 sm:gap-6 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Name</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Organic Milk" className="h-11 sm:h-12 rounded-xl bg-secondary/30 border-none shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (₹)</Label>
                    <Input id="price" required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="150" className="h-11 sm:h-12 rounded-xl bg-secondary/30 border-none shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="qty" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock</Label>
                    <Input id="qty" required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="24" className="h-11 sm:h-12 rounded-xl bg-secondary/30 border-none shadow-inner" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiry" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiry Date</Label>
                  <Input id="expiry" required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="h-11 sm:h-12 rounded-xl bg-secondary/30 border-none shadow-inner" />
                </div>
              </form>
              <DialogFooter className="flex flex-row gap-2 mt-2 sm:mt-4">
                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 rounded-xl h-11 sm:h-12 font-black uppercase tracking-widest text-[9px] sm:text-[10px]">Dismiss</Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 sm:h-12 font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-lg shadow-primary/20" onClick={handleAddProduct}>Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-secondary shadow-lg">
          <div className="relative w-full sm:w-[300px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              className="pl-11 h-11 border-transparent bg-secondary/40 rounded-xl text-sm" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-secondary/50 p-1 rounded-xl flex-1 sm:flex-none">
              <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" className="flex-1 sm:h-9 sm:w-9 rounded-lg h-10" onClick={() => setViewMode('table')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="flex-1 sm:h-9 sm:w-9 rounded-lg h-10" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="outline" className="hidden sm:flex px-3 py-2 font-black uppercase tracking-widest text-[9px] rounded-lg border-secondary bg-secondary/20">
              {filteredProducts.length} Records
            </Badge>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-card rounded-xl sm:rounded-[2.5rem] border border-secondary shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/20 h-12 sm:h-20">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-[150px] sm:w-[300px] pl-4 sm:pl-10 font-black uppercase tracking-widest text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap">Product</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap text-center">Price</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap text-center">Exp</TableHead>
                    <TableHead className="text-right pr-4 sm:pr-10 font-black uppercase tracking-widest text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 sm:py-20">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic text-xs sm:text-sm">
                        No matches found.
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.map((product) => {
                    const status = getExpiryStatus(product.expiryDate)
                    const daysLeft = getDaysRemaining(product.expiryDate)
                    return (
                      <TableRow key={product.id} className="group border-b border-secondary/50">
                        <TableCell className="pl-4 sm:pl-10">
                          <div className="flex flex-col">
                            <span className="font-black text-xs sm:text-lg truncate max-w-[100px] sm:max-w-none">{product.name}</span>
                            <span className="text-[7px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest">Qty: {product.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-black text-xs sm:text-xl text-primary tracking-tighter">₹{(product.currentPrice || product.initialPrice).toFixed(0)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("px-1.5 py-0.5 sm:px-4 sm:py-1 rounded-md sm:rounded-xl font-black text-[7px] sm:text-[9px] uppercase tracking-widest border-none shadow-sm", getExpiryColorClass(status))}>
                            {status === 'expired' ? 'Exp' : `${daysLeft}d`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4 sm:pr-10">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-10 sm:w-10 text-primary active:bg-secondary" onClick={() => handleAiSuggestion(product)} disabled={isAiLoading === product.id}>
                              {isAiLoading === product.id ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-10 sm:w-10 text-danger active:bg-danger/10" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 sm:h-60 rounded-2xl bg-secondary/30 animate-pulse" />
               ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-10 text-center text-muted-foreground italic text-xs sm:text-sm">
                No items found.
              </div>
            ) : filteredProducts.map((product) => {
              const status = getExpiryStatus(product.expiryDate)
              return (
                <div key={product.id} className="bg-card border-none rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden animate-in zoom-in-95">
                  <div className={cn("absolute top-0 right-0 w-1.5 sm:w-2 h-full opacity-50", getExpiryColorClass(status).split(' ')[1])} />
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="font-black text-lg sm:text-2xl tracking-tighter mb-1 truncate">{product.name}</h3>
                      <Badge className={cn("px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg font-black text-[7px] sm:text-[8px] uppercase tracking-widest shadow-sm border-none", getExpiryColorClass(status))}>
                        {status === 'expired' ? 'Expired' : `${getDaysRemaining(product.expiryDate)} Days Left`}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                       <div className="bg-secondary/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Stock</p>
                          <p className="text-xs sm:text-base font-black">{product.quantity} U</p>
                       </div>
                       <div className="bg-secondary/30 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Price</p>
                          <p className="text-xs sm:text-base font-black truncate">₹{(product.currentPrice || product.initialPrice).toFixed(0)}</p>
                       </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1 sm:pt-2">
                        <Button size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-all" onClick={() => handleAiSuggestion(product)} disabled={isAiLoading === product.id}>
                          <TrendingDown className={cn("h-4 w-4 sm:h-5 sm:w-5", isAiLoading === product.id && "animate-spin")} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-danger hover:bg-danger/10 active:scale-95 transition-all" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
