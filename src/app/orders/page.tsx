"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  ClipboardList, 
  PackageCheck, 
  Clock, 
  MapPin, 
  ShoppingBag,
  ArrowRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Link from "next/link"

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
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-headline font-black text-foreground">My Orders</h1>
            <p className="text-muted-foreground text-lg italic">"Your rescued deals, ready for pickup."</p>
          </div>
          <Link href="/marketplace">
            <Button className="rounded-full bg-primary hover:bg-primary/90 h-12 px-6 font-bold shadow-lg shadow-primary/20">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Shop More Deals
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your reservations...</p>
          </div>
        ) : orders?.length === 0 ? (
          <div className="bg-card rounded-3xl border-2 border-dashed border-primary/20 p-20 text-center shadow-sm">
            <div className="bg-secondary/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Start saving food and money by exploring deals in your local marketplace!</p>
            <Link href="/marketplace">
              <Button size="lg" className="rounded-xl px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                Explore Marketplace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {orders?.map((order) => (
              <Card key={order.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                <CardHeader className="bg-secondary/30 pb-4">
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="outline" className="bg-white/80 border-primary/20 text-primary font-bold">
                      {order.status}
                    </Badge>
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-headline group-hover:text-primary transition-colors">{order.productName}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total Price</p>
                      <p className="text-2xl font-black text-primary">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                    <PackageCheck className="h-10 w-10 text-primary/30" />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 text-sm">
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-bold">Estimated Pickup</p>
                        <p className="text-muted-foreground">Today or tomorrow during store hours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-bold">Store Location</p>
                        <p className="text-muted-foreground">Local partner store • Visit for details</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t p-5 bg-card">
                  <Button className="w-full rounded-xl font-bold h-11" variant="outline">
                    View Details
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
