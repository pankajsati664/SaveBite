"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Sparkles, 
  Barcode
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

  const handleAiSuggestion = async (product: any) => {
    setIsAiLoading(product.id)
    try {
      const suggestion = await generateDiscountSuggestion({
        productName: product.name,
        originalPrice: product.currentPrice || product.initialPrice,
        expiryDate: product.expiryDate
      })
      
      toast({
        title: `AI Suggestion for ${product.name}`,
        description: `Suggested ${suggestion.suggestedDiscountPercentage}% discount. Reasoning: ${suggestion.reasoning}`,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => handleApplyDiscount(product, suggestion.suggestedDiscountPercentage)}
          >
            Apply
          </Button>
        )
      })
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to fetch suggestion." })
    } finally {
      setIsAiLoading(null)
    }
  }

  const handleApplyDiscount = (product: any, discount: number) => {
    if (!firestore || !user) return
    const newPrice = (product.initialPrice * (100 - discount)) / 100
    const productRef = doc(firestore, "users", user.uid, "products", product.id)
    
    setDocumentNonBlocking(productRef, {
      currentPrice: newPrice,
      lastAIRecommendation: `Discount ${discount}%`,
      recommendedActionDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true })

    toast({ title: "Discount Applied", description: `Updated price to $${newPrice.toFixed(2)}` })
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
      ownerId: user.uid,
      status: 'AVAILABLE_FOR_SALE',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const colRef = collection(firestore, "users", user.uid, "products")
    addDocumentNonBlocking(colRef, productData)

    toast({ title: "Product added", description: "Successfully added to your inventory." })
    setIsAddOpen(false)
    setFormData({ name: "", price: "", quantity: "", expiryDate: "", category: "General" })
  }

  const handleDelete = (productId: string) => {
    if (!firestore || !user) return
    const productRef = doc(firestore, "users", user.uid, "products", productId)
    deleteDocumentNonBlocking(productRef)
    toast({ title: "Product deleted" })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Product Inventory</h1>
            <p className="text-muted-foreground">Manage your stock and track expiry dates.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden sm:flex">
              <Barcode className="mr-2 h-4 w-4" />
              Scan Barcode
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter product details. Expiry tracking will start immediately.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Milk" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Price</Label>
                    <Input id="price" required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="4.99" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="qty" className="text-right">Quantity</Label>
                    <Input id="qty" required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="10" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expiry" className="text-right">Expiry</Label>
                    <Input id="expiry" required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="col-span-3" />
                  </div>
                </form>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90" onClick={handleAddProduct}>Save Product</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search inventory..." className="pl-9 h-10 border-transparent bg-secondary/50 focus:bg-background" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Badge variant="secondary" className="px-3 py-1 font-medium">
              {products?.length || 0} Products Total
            </Badge>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="w-[250px]">Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products in inventory.</TableCell>
                </TableRow>
              ) : (
                products?.map((product) => {
                  const status = getExpiryStatus(product.expiryDate)
                  const daysLeft = getDaysRemaining(product.expiryDate)
                  
                  return (
                    <TableRow key={product.id} className="group hover:bg-secondary/10 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">ID: {product.id.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>${(product.currentPrice || product.initialPrice).toFixed(2)}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>
                        <Badge className={cn("flex w-fit items-center gap-1.5", getExpiryColorClass(status))}>
                          <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          {status === 'expired' ? 'Expired' : 
                           status === 'near-expiry' ? `Expiring soon (${daysLeft}d)` : `Fresh (${daysLeft}d)`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleAiSuggestion(product)}
                            disabled={isAiLoading === product.id}
                          >
                            <Sparkles className={cn("h-4 w-4", isAiLoading === product.id && "animate-spin")} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
