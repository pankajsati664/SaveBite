"use client"

import { useState, useRef, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Barcode, 
  ShoppingCart, 
  Printer, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase"
import { collection, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  stockId: string
}

export default function POSPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [mode, setMode] = useState<"sell" | "ingress">("sell")
  const [scanValue, setScanValue] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<any>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "users", user.uid, "products"), orderBy("createdAt", "desc"))
  }, [firestore, user])

  const { data: inventory } = useCollection(productsQuery)

  useEffect(() => {
    const handleFocus = () => scanInputRef.current?.focus()
    window.addEventListener('click', handleFocus)
    return () => window.removeEventListener('click', handleFocus)
  }, [])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanValue || !firestore || !user) return

    const product = inventory?.find(p => p.id === scanValue || p.name.toLowerCase() === scanValue.toLowerCase())

    if (mode === "sell") {
      if (product) {
        if ((product.quantity || 0) <= 0) {
          toast({ variant: "destructive", title: "Out of Stock", description: `${product.name} is unavailable.` })
        } else {
          addToCart(product)
        }
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "Scan unsuccessful." })
      }
    } else {
      if (product) {
        const newQty = (product.quantity || 0) + 1
        const updateData = { quantity: newQty, updatedAt: serverTimestamp() }
        updateDocumentNonBlocking(doc(firestore, "users", user.uid, "products", product.id), updateData)
        setDocumentNonBlocking(doc(firestore, "products_marketplace", product.id), updateData, { merge: true })
        toast({ title: "Inventory Updated", description: `${product.name} count increased.` })
      }
    }
    setScanValue("")
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.stockId === product.id)
      if (existing) {
        return prev.map(item => item.stockId === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { 
        id: Math.random().toString(36).slice(2), 
        name: product.name, 
        price: product.currentPrice || product.initialPrice, 
        quantity: 1, 
        stockId: product.id 
      }]
    })
  }

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleCheckout = async () => {
    if (cart.length === 0 || !firestore || !user) return
    setIsProcessing(true)

    try {
      const orderData = {
        customerId: "POS_WALK_IN",
        shopId: user.uid,
        totalAmount: total,
        status: "Completed",
        items: cart,
        createdAt: serverTimestamp(),
      }

      addDocumentNonBlocking(collection(firestore, "users", user.uid, "orders"), orderData)
      
      for (const item of cart) {
        const product = inventory?.find(p => p.id === item.stockId)
        if (product) {
          const newQty = product.quantity - item.quantity
          const updateData = { 
            quantity: newQty, 
            status: newQty <= 0 ? 'SOLD' : (product.status || 'AVAILABLE_FOR_SALE'),
            updatedAt: serverTimestamp() 
          }
          updateDocumentNonBlocking(doc(firestore, "users", user.uid, "products", item.stockId), updateData)
          setDocumentNonBlocking(doc(firestore, "products_marketplace", item.stockId), updateData, { merge: true })
        }
      }

      setLastReceipt({ ...orderData, id: "POS-" + Math.random().toString(36).toUpperCase().slice(2, 8), date: new Date().toLocaleString() })
      toast({ title: "Sale Complete", description: `Transaction recorded.` })
      setCart([])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20 print:block">
        
        {/* Print Layout */}
        <div className="hidden print:block text-black p-4 font-mono text-xs">
          <h1 className="text-center font-bold uppercase mb-2">SaveBite Receipt</h1>
          <p>ID: {lastReceipt?.id}</p>
          <p>Date: {lastReceipt?.date}</p>
          <div className="border-y border-black py-2 my-2">
            {lastReceipt?.items.map((it: any) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.name} x{it.quantity}</span>
                <span>₹{(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="flex justify-between font-bold"><span>Total</span><span>₹{lastReceipt?.totalAmount.toFixed(2)}</span></p>
        </div>

        <div className="lg:col-span-2 space-y-6 print:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">POS Terminal</h1>
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
              <TabsList className="rounded-lg h-10">
                <TabsTrigger value="sell">Sell</TabsTrigger>
                <TabsTrigger value="ingress">Stock</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-none shadow-sm bg-zinc-900 text-white overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 opacity-50" />
                <h2 className="text-sm font-bold uppercase tracking-wider opacity-50">Scan Mode Active</h2>
              </div>
              <form onSubmit={handleScan} className="relative">
                <Input 
                  ref={scanInputRef}
                  value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  placeholder="Scan or type ID..."
                  className="h-16 bg-white/10 border-none text-2xl font-bold px-6 placeholder:text-white/20"
                />
                <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-lg bg-primary">
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Recent Items</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                   {inventory?.slice(0, 10).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group">
                         <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Stock: {p.quantity}</p>
                         </div>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => addToCart(p)}>
                            <Plus className="h-4 w-4" />
                         </Button>
                      </div>
                   ))}
                </CardContent>
             </Card>

             {lastReceipt && (
               <Card className="border-none shadow-sm bg-emerald-50 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
                  <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white mb-4">
                     <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-lg font-bold">Total: ₹{lastReceipt.totalAmount.toFixed(0)}</p>
                  <Button onClick={() => window.print()} variant="outline" className="mt-4 w-full h-10 text-xs font-bold gap-2">
                     <Printer className="h-4 w-4" /> Print Receipt
                  </Button>
               </Card>
             )}
          </div>
        </div>

        <div className="print:hidden">
          <Card className="border-none shadow-sm h-full flex flex-col min-h-[500px]">
            <CardHeader className="border-b bg-secondary/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <p className="text-sm font-medium">Cart is empty</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-secondary/20">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-primary font-bold">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-secondary rounded-lg px-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => updateCartQty(item.id, -999)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-6 border-t bg-secondary/30 space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-xs text-muted-foreground font-bold uppercase">Total</p>
                <p className="text-3xl font-bold tracking-tight">₹{total.toFixed(0)}</p>
              </div>
              <Button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="w-full h-12 font-bold text-base"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Sale"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}