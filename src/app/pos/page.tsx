
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
  Zap, 
  CheckCircle2,
  PackagePlus,
  ArrowRight,
  AlertCircle,
  X,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { collection, doc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
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
    return collection(firestore, "users", user.uid, "products")
  }, [firestore, user])

  const { data: inventory } = useCollection(productsQuery)

  useEffect(() => {
    // Keep focus on scan input for hardware scanners
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
        toast({ variant: "destructive", title: "Unknown Item", description: "Product code not found in vault." })
      }
    } else {
      // Ingress Mode - Simple increment or open dialog
      if (product) {
        const newQty = (product.quantity || 0) + 1
        updateDocumentNonBlocking(doc(firestore, "users", user.uid, "products", product.id), { quantity: newQty, updatedAt: serverTimestamp() })
        updateDocumentNonBlocking(doc(firestore, "products_marketplace", product.id), { quantity: newQty, updatedAt: serverTimestamp() })
        toast({ title: "Inventory Updated", description: `${product.name} quantity increased to ${newQty}.` })
      } else {
        toast({ title: "New Item Detected", description: "Use the Ingress form in the Vault to add new items." })
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
      // Create Order
      const orderData = {
        customerId: "walk-in-customer",
        shopId: user.uid,
        totalAmount: total,
        status: "Completed",
        items: cart,
        createdAt: serverTimestamp(),
        type: "POS_OFFLINE"
      }

      const orderRef = await addDocumentNonBlocking(collection(firestore, "users", user.uid, "orders"), orderData)
      
      // Update Stock
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
          updateDocumentNonBlocking(doc(firestore, "products_marketplace", item.stockId), updateData)
        }
      }

      setLastReceipt({ ...orderData, id: orderRef?.id, date: new Date().toLocaleString() })
      toast({ title: "Sale Complete", description: `Transaction recorded. Receipt ready.` })
      setCart([])
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = () => {
    if (!lastReceipt) return
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 animate-in fade-in duration-700 print:block">
        {/* Receipt View (Hidden unless printing) */}
        <div className="hidden print:block text-black p-8 font-mono text-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-tighter">SaveBite Terminal</h1>
            <p>Verification ID: {user?.uid.slice(0, 8)}</p>
            <p>Date: {lastReceipt?.date}</p>
          </div>
          <div className="border-t border-b border-black py-4 mb-4">
            {lastReceipt?.items.map((it: any) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.name} x{it.quantity}</span>
                <span>₹{(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span>₹{lastReceipt?.totalAmount.toFixed(2)}</span>
          </div>
          <p className="text-center mt-8 italic">*** Thank You for Rescuing Food ***</p>
        </div>

        {/* POS Interface */}
        <div className="lg:col-span-2 space-y-8 print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">POS Terminal</h1>
              <p className="text-muted-foreground font-medium italic">High-speed ingress and walk-in sales.</p>
            </div>
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full sm:w-auto">
              <TabsList className="bg-secondary/40 p-1.5 rounded-2xl h-14 w-full">
                <TabsTrigger value="sell" className="rounded-xl px-8 h-11 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Egress (Sell)
                </TabsTrigger>
                <TabsTrigger value="ingress" className="rounded-xl px-8 h-11 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
                  <PackagePlus className="mr-2 h-4 w-4" /> Ingress (Stock)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-zinc-950 p-8 sm:p-12 relative overflow-hidden group">
            <div className={cn(
              "absolute inset-0 opacity-10 transition-colors duration-1000",
              mode === 'sell' ? "bg-primary" : "bg-blue-600"
            )} />
            <form onSubmit={handleScan} className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110",
                  mode === 'sell' ? "bg-primary" : "bg-zinc-800"
                )}>
                  <Barcode className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter">
                  {mode === 'sell' ? "Ready to Checkout" : "Awaiting Inventory Scan"}
                </h2>
              </div>
              <div className="relative">
                <Input 
                  ref={scanInputRef}
                  value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  placeholder="Scan product barcode or type name..."
                  className="h-20 sm:h-24 rounded-[2rem] bg-white/10 border-none text-white text-2xl sm:text-3xl font-black px-10 placeholder:text-white/20 focus:ring-4 focus:ring-primary/20"
                />
                <Button 
                  type="submit"
                  size="icon" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl"
                >
                  <ArrowRight className="h-8 w-8" />
                </Button>
              </div>
              <div className="flex items-center gap-3 text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">
                <Zap className="h-4 w-4 text-amber-400" /> Auto-focus enabled • Scan hardware compatible
              </div>
            </form>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Card className="border-none shadow-xl rounded-[2rem] bg-white p-8">
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center"><PackagePlus className="h-5 w-5" /></div>
                   <h3 className="font-black text-lg">Active Inventory</h3>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                   {inventory?.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl group hover:bg-secondary/50 transition-colors">
                         <div>
                            <p className="font-black text-sm">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Qty: {p.quantity}</p>
                         </div>
                         <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => addToCart(p)}>
                            <Plus className="h-4 w-4 text-primary" />
                         </Button>
                      </div>
                   ))}
                </div>
             </Card>

             {lastReceipt && (
               <Card className="border-none shadow-xl rounded-[2rem] bg-emerald-50 border-emerald-100 p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
                  <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                     <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tighter">Last Sale: ₹{lastReceipt.totalAmount.toFixed(0)}</h3>
                    <p className="text-sm text-emerald-800 italic opacity-70">Transaction {lastReceipt.id.slice(0, 6)} successfully synced.</p>
                  </div>
                  <Button onClick={handlePrint} className="h-14 w-full rounded-2xl bg-zinc-900 text-white font-black uppercase text-[10px] tracking-widest gap-2">
                     <Printer className="h-5 w-5" /> Print Last Bill
                  </Button>
               </Card>
             )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="lg:col-span-1 print:hidden">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white h-full flex flex-col min-h-[600px] overflow-hidden">
            <CardHeader className="p-8 border-b border-secondary">
              <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <ShoppingCart className="text-primary h-6 w-6" />
                Checkout Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Barcode className="h-10 w-10" />
                  </div>
                  <p className="font-black uppercase text-[10px] tracking-[0.2em]">Queue is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-secondary">
                  {cart.map(item => (
                    <div key={item.id} className="p-6 flex items-center justify-between group animate-in slide-in-from-right-4">
                      <div className="space-y-1 flex-1">
                        <p className="font-black text-lg leading-tight">{item.name}</p>
                        <p className="text-primary font-black">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-secondary/50 rounded-xl p-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateCartQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="w-8 text-center font-black">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateCartQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-rose-500 hover:bg-rose-50" onClick={() => updateCartQty(item.id, -999)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-8 bg-zinc-950 text-white rounded-t-[3rem] space-y-6">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Payable</p>
                <p className="text-5xl font-black tracking-tighter">₹{total.toFixed(0)}</p>
              </div>
              <Button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="w-full h-20 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : "Complete Sale"}
              </Button>
              {cart.length > 0 && (
                 <Button variant="ghost" className="w-full text-white/40 hover:text-white" onClick={() => setCart([])}>
                    Clear Queue
                 </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
