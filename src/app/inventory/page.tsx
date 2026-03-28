"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Sparkles, 
  HeartHandshake, 
  Tag,
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
import { getExpiryStatus, getExpiryColorClass, getDaysRemaining } from "@/lib/utils/expiry"
import { generateDiscountSuggestion } from "@/ai/flows/generate-discount-suggestion-flow"

const mockInventory = [
  { id: "1", name: "Organic Whole Milk", price: 4.50, quantity: 12, expiryDate: "2025-05-20", category: "Dairy" },
  { id: "2", name: "French Baguette", price: 2.99, quantity: 25, expiryDate: "2024-05-18", category: "Bakery" },
  { id: "3", name: "Red Grapes (500g)", price: 3.50, quantity: 10, expiryDate: "2025-05-25", category: "Fruit" },
  { id: "4", name: "Chicken Breast", price: 12.00, quantity: 6, expiryDate: "2024-05-19", category: "Meat" },
  { id: "5", name: "Greek Yogurt", price: 5.50, quantity: 15, expiryDate: "2025-05-22", category: "Dairy" },
]

export default function InventoryPage() {
  const [products, setProducts] = useState(mockInventory)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAiSuggestion = async (product: typeof mockInventory[0]) => {
    setIsAiLoading(product.id)
    try {
      const suggestion = await generateDiscountSuggestion({
        productName: product.name,
        originalPrice: product.price,
        expiryDate: product.expiryDate
      })
      
      toast({
        title: `AI Suggestion for ${product.name}`,
        description: `Suggested ${suggestion.suggestedDiscountPercentage}% discount. Reasoning: ${suggestion.reasoning}`,
        action: (
          <Button variant="outline" size="sm" className="bg-primary text-white hover:bg-primary/90">
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
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" placeholder="Milk" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Price</Label>
                    <Input id="price" type="number" placeholder="4.99" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="qty" className="text-right">Quantity</Label>
                    <Input id="qty" type="number" placeholder="10" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expiry" className="text-right">Expiry</Label>
                    <Input id="expiry" type="date" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90" onClick={() => {
                    toast({ title: "Product added", description: "Successfully added to your inventory." })
                    setIsAddOpen(false)
                  }}>Save Product</Button>
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
              {products.length} Products Total
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
              {products.map((product) => {
                const status = getExpiryStatus(product.expiryDate)
                const daysLeft = getDaysRemaining(product.expiryDate)
                
                return (
                  <TableRow key={product.id} className="group hover:bg-secondary/10 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">ID: {product.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10">
                          <Trash2 className="h-4 w-4" />
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
    </DashboardLayout>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}