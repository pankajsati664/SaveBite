
"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Users, 
  Package, 
  ShoppingBag, 
  Heart, 
  ShieldAlert, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Trash2,
  Search,
  ChevronRight,
  Store
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [search, setSearch] = useState("")

  // Global Queries for Admin
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "users"), orderBy("createdAt", "desc"))
  }, [firestore])

  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "products_marketplace")
  }, [firestore])

  const donationsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "donations_public")
  }, [firestore])

  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)
  const { data: marketplaceItems, isLoading: isMarketLoading } = useCollection(marketplaceQuery)
  const { data: publicDonations, isLoading: isDonationsLoading } = useCollection(donationsQuery)

  const isLoading = isUsersLoading || isMarketLoading || isDonationsLoading

  const handleDeleteUser = (userId: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, "users", userId))
    toast({ title: "User Revoked", description: "User profile has been removed from the platform." })
  }

  const handleDeleteProduct = (productId: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, "products_marketplace", productId))
    toast({ title: "Product Delisted", description: "Item removed from public view." })
  }

  const stats = [
    { label: "Total Users", value: allUsers?.length || 0, icon: Users, color: "bg-blue-500" },
    { label: "Market Deals", value: marketplaceItems?.length || 0, icon: ShoppingBag, color: "bg-primary" },
    { label: "Donation Pool", value: publicDonations?.length || 0, icon: Heart, color: "bg-danger" },
    { label: "System Health", value: "99.9%", icon: ShieldAlert, color: "bg-success" },
  ]

  const filteredUsers = allUsers?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {/* Admin Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 sm:p-12 text-white shadow-2xl border-4 border-white/5">
          <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <Badge className="bg-white/10 text-white border-none backdrop-blur-md px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
                Global Command Center
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-headline font-black tracking-tighter">SaveBite <span className="text-primary italic">Admin.</span></h1>
              <p className="text-zinc-400 font-medium italic text-sm sm:text-lg max-w-xl">
                Managing the ecosystem at scale. Monitor users, moderate inventory, and ensure zero-waste impact across all regions.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl">
               <TrendingUp className="h-10 w-10 text-primary" />
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Global Impact</p>
                  <p className="text-3xl font-black">4.2 Tons <span className="text-xs text-zinc-500 font-medium">Saved</span></p>
               </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {stats.map((stat, idx) => (
            <Card key={stat.label} className="border-none shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 sm:p-4 rounded-2xl text-white shadow-lg", stat.color)}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-4xl font-black tracking-tighter">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <TabsList className="bg-secondary/40 p-1 rounded-2xl h-14 w-full sm:w-auto">
              <TabsTrigger value="users" className="rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]">User Base</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]">Marketplace</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search database..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-white border-none shadow-lg shadow-black/5" 
              />
            </div>
          </div>

          <TabsContent value="users" className="mt-0 outline-none">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 h-20">
                    <TableRow className="border-none">
                      <TableHead className="pl-10 font-black uppercase tracking-widest text-[10px] text-zinc-500">Identity</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-500 text-center">Role</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-500 text-center">Join Date</TableHead>
                      <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-zinc-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic font-medium">No system records match your query.</TableCell>
                      </TableRow>
                    ) : filteredUsers.map((u) => (
                      <TableRow key={u.id} className="group hover:bg-zinc-50/50 border-b border-zinc-100 transition-colors">
                        <TableCell className="pl-10">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400">
                               {u.name?.[0] || 'U'}
                            </div>
                            <div>
                               <p className="font-black text-lg tracking-tight leading-none mb-1">{u.name || 'Anonymous User'}</p>
                               <p className="text-[11px] text-muted-foreground font-medium italic">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="px-4 py-1.5 rounded-lg font-black uppercase tracking-widest text-[9px] border-zinc-200 bg-zinc-50">
                            {u.role || 'customer'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-zinc-400 font-medium text-xs">
                           {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'Active Member'}
                        </TableCell>
                        <TableCell className="text-right pr-10">
                           <Button variant="ghost" size="icon" className="h-10 w-10 text-danger hover:bg-danger/10 rounded-xl" onClick={() => handleDeleteUser(u.id)}>
                             <Trash2 className="h-5 w-5" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="mt-0 outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {marketplaceItems?.map((item, idx) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white group hover:-translate-y-2 transition-all duration-500">
                    <CardHeader className="p-8">
                       <div className="flex justify-between items-start mb-4">
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3 py-1 rounded-lg uppercase tracking-widest">Live Asset</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger rounded-lg" onClick={() => handleDeleteProduct(item.id)}>
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                       <CardTitle className="text-2xl font-black tracking-tighter leading-tight group-hover:text-primary transition-colors">{item.name}</CardTitle>
                       <CardDescription className="flex items-center gap-2 font-black text-primary uppercase text-[10px] tracking-widest mt-2">
                          <Store className="h-3.5 w-3.5" />
                          Owner: {item.ownerId?.slice(0, 8)}...
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                       <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                          <div>
                             <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Price</p>
                             <p className="text-xl font-black">₹{item.currentPrice}</p>
                          </div>
                          <div>
                             <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Stock</p>
                             <p className="text-xl font-black">{item.quantity} U</p>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
