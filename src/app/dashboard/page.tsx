
"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  TrendingUp, 
  Leaf, 
  ShieldCheck, 
  ShoppingBag, 
  Package, 
  Heart, 
  Award,
  Globe,
  ChevronRight,
  Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import Link from "next/link"

const ADMIN_UID = "7zPezqeNFEPbYVsCM8NxO4fknhn1"

export default function DashboardPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: profile } = useDoc(userDocRef)
  
  // Force admin role for special UID
  const role = user?.uid === ADMIN_UID ? 'admin' : (profile?.role || 'customer')

  const stats = {
    admin: [
      { label: "Global Savings", value: "2.4T", icon: Globe, color: "text-blue-600" },
      { label: "System Health", value: "99.9%", icon: ShieldCheck, color: "text-emerald-600" },
      { label: "Active Nodes", value: "1,240", icon: Zap, color: "text-amber-500" },
      { label: "Revenue Share", value: "₹45.2k", icon: TrendingUp, color: "text-zinc-900" },
    ],
    store_owner: [
      { label: "Food Rescued", value: "142kg", icon: Leaf, color: "text-emerald-600" },
      { label: "Impact Points", value: profile?.points || "0", icon: Award, color: "text-amber-500" },
      { label: "Daily Sales", value: "₹12.4k", icon: TrendingUp, color: "text-blue-600" },
      { label: "Rating", value: "4.9/5", icon: Heart, color: "text-rose-500" },
    ],
    customer: [
      { label: "Saved Today", value: "₹450", icon: TrendingUp, color: "text-emerald-600" },
      { label: "CO2 Saved", value: `${profile?.impactScore || 0}kg`, icon: Leaf, color: "text-emerald-500" },
      { label: "Impact Level", value: "Silver", icon: Award, color: "text-amber-500" },
      { label: "Rescues", value: "24", icon: ShoppingBag, color: "text-blue-600" },
    ],
    ngo: [
      { label: "Meals Served", value: "840", icon: Heart, color: "text-rose-500" },
      { label: "CO2 Mitigated", value: "120kg", icon: Leaf, color: "text-emerald-600" },
      { label: "Active Fleet", value: "4", icon: Zap, color: "text-blue-600" },
      { label: "Partners", value: "12", icon: Package, color: "text-amber-500" },
    ]
  }[role] || []

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.name || (user?.uid === ADMIN_UID ? 'System Administrator' : 'User')}</h1>
          <p className="text-muted-foreground">Here is what is happening with your impact today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm card-hover">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl bg-secondary", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Progress to Next Level</span>
                  <span className="font-bold text-primary">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "CO2 Saved", value: "14.2kg" },
                  { label: "Water", value: "2.4k L" },
                  { label: "Energy", value: "84 kWh" }
                ].map(m => (
                  <div key={m.label} className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xl font-bold">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{m.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              {role === 'customer' && (
                <>
                  <Link href="/marketplace">
                    <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-sm">
                      Browse Marketplace <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground italic px-4">Find fresh food at huge discounts near you.</p>
                </>
              )}
              {role === 'store_owner' && (
                <Link href="/inventory">
                  <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-sm" variant="outline">
                    Update Inventory <Package className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
              {role === 'ngo' && (
                <Link href="/donations">
                  <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-sm" variant="outline">
                    View Donations <Heart className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
              {role === 'admin' && (
                <div className="space-y-2">
                  <Link href="/admin">
                    <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-sm" variant="secondary">
                      Manage Platform <ShieldCheck className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pos">
                    <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-sm" variant="outline">
                      Dev POS Access <Zap className="ml-1 h-4 w-4 text-amber-500" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
