"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2,
  Sparkles,
  Filter,
  Package,
  Calendar,
  Tag,
  Percent,
  Heart,
  Upload
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const CATEGORIES = ["Dairy", "Produce", "Bakery", "Meat", "Pantry", "General"]

export default function InventoryPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedStockImage, setSelectedStockImage] = useState<string | null>(null)
  const [manualDiscount, setManualDiscount] = useState<string>("")

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
          <Button size="sm" variant="default" className="font-bold" onClick={() => applyDiscount(product, suggestion.suggestedDiscountPercentage)}>
            Apply
          </Button>
        )
      })
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate suggestion." })
    } finally {
      setIsAiLoading(null)
    }
  }

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "images")

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dqmhidejk/image/upload`, {
        method: "POST",
        body: formData
      })
      const data = await response.json()
      
      if (data.secure_url) {
        setSelectedStockImage(data.secure_url)
        toast({ title: "Image Uploaded", description: "Custom product image is ready." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Error during Cloudinary transfer." })
    } finally {
      setIsUploading(false)
    }
  }

  const applyDiscount = (product: any, discount: number) => {
    if (!firestore || !user) return
    const newPrice = (product.initialPrice * (100 - discount)) / 100
    const isDonation = discount >= 100
    
    const updateData = {
      currentPrice: newPrice,
      status: isDonation ? 'AVAILABLE_FOR_DONATION' : 'AVAILABLE_FOR_SALE',
      updatedAt: serverTimestamp()
    }
    
    // Update personal inventory
    updateDocumentNonBlocking(doc(firestore, "users", user.uid, "products", product.id), updateData)
    
    // If it's a donation, move it to the public donation pool and remove from marketplace
    if (isDonation) {
      deleteDocumentNonBlocking(doc(firestore, "products_marketplace", product.id))
      setDocumentNonBlocking(doc(firestore, "donations_public", product.id), {
        ...product,
        ...updateData,
        storeOwnerId: user.uid,
        status: 'AVAILABLE_FOR_DONATION'
      }, { merge: true })
      toast({ title: "Item Donated", description: `${product.name} is now available for NGO rescue.` })
    } else {
      // Sync to marketplace
      setDocumentNonBlocking(doc(firestore, "products_marketplace", product.id), updateData, { merge: true })
      toast({ title: "Price Slashed!", description: `${product.name} is now ₹${newPrice.toFixed(0)}` })
    }
    
    setIsDiscountOpen(false)
    setManualDiscount("")
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
          toast({ title: "Product Added", description: `${formData.name} is now live.` })
        }
      })

    setIsAddOpen(false)
    setFormData({ name: "", price: "", quantity: "", expiryDate: "", category: "General" })
    setSelectedStockImage(null)
  }

  const handleDelete = (p: any) => {
    if (!firestore || !user) return
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "products", p.id))
    deleteDocumentNonBlocking(doc(firestore, "products_marketplace", p.id))
    deleteDocumentNonBlocking(doc(firestore, "donations_public", p.id))
    toast({ title: "Item Removed", description: "Product has been cleared from inventory." })
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Inventory</h1>
            <p className="text-muted-foreground font-medium italic">Manage your store's stock and discounts.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                <Plus className="mr-2 h-5 w-5" /> Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Add Product</DialogTitle>
                <DialogDescription className="font-medium italic">Fill in the details for your new item.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-5 pt-4">
                <div className="space-y-1">
                  <Input 
                    placeholder="Product Name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="h-12 rounded-xl bg-secondary/50 border-none px-4 font-bold"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input 
                      type="number" 
                      placeholder="Price (₹)" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      className="h-12 rounded-xl bg-secondary/50 border-none px-4 font-bold"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Input 
                      type="number" 
                      placeholder="Quantity" 
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})} 
                      className="h-12 rounded-xl bg-secondary/50 border-none px-4 font-bold"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-none px-4 font-bold">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiry Date</label>
                  <Input 
                    type="date" 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                    className="h-12 rounded-xl bg-secondary/50 border-none px-4 font-bold"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Image</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleDirectUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        disabled={isUploading}
                      />
                      <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest gap-2">
                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Upload Custom
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto p-3 bg-secondary/30 rounded-2xl border border-secondary">
                    {stockImages?.map((img) => (
                      <div 
                        key={img.id}
                        onClick={() => setSelectedStockImage(img.url)}
                        className={cn(
                          "aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all",
                          selectedStockImage === img.url ? "border-primary" : "border-transparent opacity-60"
                        )}
                      >
                        <img src={img.url} className="object-cover w-full h-full" alt="Asset" />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20" disabled={isUploading}>
                  Save Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-[1.5rem] shadow-sm border border-secondary">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 border-none bg-transparent font-bold" 
            />
          </div>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-secondary"><Filter className="h-5 w-5" /></Button>
        </div>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Syncing...</p>
          </div>
        ) : products?.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-[3rem] border-4 border-dashed border-secondary shadow-inner">
             <Package className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-6" />
             <h3 className="text-3xl font-black tracking-tight mb-2">No items found</h3>
             <p className="text-muted-foreground font-medium italic">Start adding products to track expiry.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).map((p) => {
              const status = getExpiryStatus(p.expiryDate)
              const days = getDaysRemaining(p.expiryDate)
              const placeholder = getPlaceholderByCategory(p.category)
              const isDonated = p.status === 'AVAILABLE_FOR_DONATION'
              
              return (
                <Card key={p.id} className="border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col bg-card group">
                  <div className="aspect-[16/10] relative bg-secondary/20 overflow-hidden">
                    <img 
                      src={p.imageUrl || placeholder.imageUrl} 
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" 
                      alt={p.name} 
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      {isDonated && <Badge className="bg-rose-500 text-white border-none font-black px-4 py-1.5 rounded-xl">DONATION</Badge>}
                      <Badge className={cn("border-none font-black px-4 py-1.5 rounded-xl shadow-lg", getExpiryColorClass(status))}>
                        {days < 0 ? 'EXPIRED' : `${days}D LEFT`}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 flex-1 flex flex-col gap-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="text-xl font-black truncate tracking-tight">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag className="h-3 w-3 text-primary" />
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{p.category} • {p.quantity} Units</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-primary tracking-tighter">₹{p.currentPrice?.toFixed(0)}</p>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3">
                       <Button 
                         onClick={() => {
                           setSelectedProduct(p)
                           setIsDiscountOpen(true)
                         }} 
                         variant="secondary" 
                         className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-secondary/50"
                       >
                          <Percent className="h-4 w-4" />
                          Manage Price
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-12 w-full rounded-xl text-danger hover:bg-danger/10" 
                         onClick={() => handleDelete(p)}
                       >
                          <Trash2 className="h-5 w-5" />
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Discount Dialog */}
        <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Price Management</DialogTitle>
              <DialogDescription className="font-medium italic">Apply a discount or mark for donation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Original Price</p>
                  <p className="text-2xl font-black">₹{selectedProduct?.initialPrice}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Current Price</p>
                  <p className="text-2xl font-black text-primary">₹{selectedProduct?.currentPrice?.toFixed(0)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Discount Percentage (0-100)</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="e.g. 50" 
                    value={manualDiscount} 
                    onChange={e => setManualDiscount(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-none px-4 font-bold"
                  />
                  <Button onClick={() => applyDiscount(selectedProduct, parseInt(manualDiscount || "0"))} className="h-12 px-6 rounded-xl font-black uppercase text-[10px]">Apply</Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-1">* 100% discount moves the item to the NGO donation pool.</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest"><span className="bg-white px-3 text-muted-foreground">Or Use AI</span></div>
              </div>

              <Button 
                onClick={() => handleAiAnalysis(selectedProduct)} 
                variant="outline" 
                className="w-full h-14 rounded-2xl border-primary/20 hover:bg-primary/5 font-black uppercase text-[11px] tracking-widest gap-2"
                disabled={isAiLoading === selectedProduct?.id}
              >
                {isAiLoading === selectedProduct?.id ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5 text-primary" />}
                Get AI Suggested Discount
              </Button>

              <Button 
                onClick={() => applyDiscount(selectedProduct, 100)} 
                variant="ghost" 
                className="w-full h-14 rounded-2xl text-rose-600 hover:bg-rose-50 font-black uppercase text-[11px] tracking-widest gap-2"
              >
                <Heart className="h-5 w-5" />
                Mark as Free Donation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
