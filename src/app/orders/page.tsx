"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  ClipboardList, 
  PackageCheck, 
  Clock, 
  MapPin, 
  ShoppingBag,
  ArrowRight,
  Loader2,
  ChevronRight,
  TrendingUp,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function OrdersPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(
      collection(firestore, "users", user.uid, "orders"),
      orderBy("createdAt", "desc")
    )
  }, [firestore, user])

  const { data: orders, isLoading } = useCollection(ordersQuery)

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-card p-10 rounded-[2.5rem] border border-secondary shadow-lg">
          <div className="space-y-3">
            <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-xl">
              <History className="mr-2 h-4 w-4" />
              Order History
            </Badge>
            <h1 className="text-4xl font-headline font-black text-foreground tracking-tighter">My Rescue Journal</h1>
            <p className="text-muted-foreground text-lg font-medium italic">"Tracking your personal contribution to zero food waste."</p>
          </div>
          <Link href="/marketplace">
            <Button className="rounded-2xl bg-primary hover:bg-primary/90 h-16 px-10 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1">
              <ShoppingBag className="mr-3 h-5 w-5" />
              Claim More Deals
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-32 text-center flex flex-col items-center gap-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Accessing your vault...</p>
          </div>
        ) : orders?.length === 0 ? (
          <div className="bg-card rounded-[3rem] border-4 border-dashed border-secondary p-24 text-center shadow-sm animate-in zoom-in-95 duration-700">
            <div className="bg-secondary/50 h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner group-hover:scale-110 transition-transform">
              <ClipboardList className="h-12 w-12 text-muted-foreground opacity-30" />
            </div>
            <h3 className="text-4xl font-black mb-4 tracking-tighter">No rescues recorded yet</h3>
            <p className="text-muted-foreground mb-12 max-w-md mx-auto font-medium text-lg italic leading-relaxed">Your sustainability journey is just beginning. Explore the marketplace to claim your first incredible deal!</p>
            <Link href="/marketplace">
              <Button size="lg" className="rounded-2xl px-12 h-16 text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 bg-primary">
                Browse Marketplace
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {orders?.map((order, idx) => (
              <Card key={order.id} className={cn(
                  "border-none shadow-md hover:shadow-2xl transition-all duration-700 rounded-[2.5rem] overflow-hidden group bg-card animate-in fade-in slide-in-from-right-4",
                  `delay-[${idx * 50}ms]`
              )}>
                <CardHeader className="bg-secondary/20 p-8 pb-6 border-b border-secondary/50">
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="outline" className="bg-white/90 border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] px-4 py-1.5 rounded-xl shadow-sm">
                      {order.status === 'Pending' ? 'READY FOR PICKUP' : order.status}
                    </Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-headline font-black group-hover:text-primary transition-colors leading-tight">{order.productName}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10 shadow-inner group-hover:bg-primary/10 transition-colors">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Amount Paid</p>
                      <p className="text-3xl font-black text-primary tracking-tighter">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                        <TrendingUp className="h-7 w-7 text-primary/40" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-4 text-sm group-hover:translate-x-1 transition-transform">
                      <div className="h-10 w-10 bg-secondary/50 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground mb-1">Pickup window</p>
                        <p className="text-foreground font-bold leading-relaxed italic">Today or tomorrow during business hours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 text-sm group-hover:translate-x-1 transition-transform">
                       <div className="h-10 w-10 bg-secondary/50 rounded-xl flex items-center justify-center shrink-0">
                         <MapPin className="h-5 w-5 text-primary" />
                       </div>
                      <div>
                        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground mb-1">Store details</p>
                        <p className="text-foreground font-bold leading-relaxed italic">Verified SaveByte Partner Store • Check email for QR code</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-secondary p-8 bg-secondary/5">
                  <Button className="w-full rounded-2xl font-black uppercase tracking-widest text-[10px] h-14 bg-white border-secondary text-foreground hover:bg-white/80 shadow-sm" variant="outline">
                    Transaction Details <ChevronRight className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
