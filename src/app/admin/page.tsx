"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Users, 
  ShoppingBag, 
  Heart, 
  ShieldAlert, 
  TrendingUp, 
  Loader2,
  Trash2,
  Search,
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
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getPlaceholderById } from "@/lib/placeholder-images"

export default function AdminPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [search, setSearch] = useState("")

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
    toast({ title: "User Revoked", description: "Profile removed from system." })
  }

  const handleDeleteProduct = (productId: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, "products_marketplace", productId))
    toast({ title: "Delisted", description: "Item removed from marketplace." })
  }

  const stats = [
    { label: "Users", value: allUsers?.length || 0, icon: Users, color: "bg-blue-600" },
    { label: "Market", value: marketplaceItems?.length || 0, icon: ShoppingBag, color: "bg-emerald-600" },
    { label: "Donations", value: publicDonations?.length || 0, icon: Heart, color: "bg-rose-600" },
    { label: "Health", value: "99%", icon: ShieldAlert, color: "bg-amber-600" },
  ]

  const filteredUsers = allUsers?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const heroImage = getPlaceholderById('landing-store')

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10 pb-24 animate-in fade-in duration-1000">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 px-6 py-10 sm:px-12 sm:py-16 text-white shadow-2xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-50 mix-blend-overlay" 
            alt="Admin Command Center"
            data-ai-hint={heroImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/40 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <Badge className="bg-white/10 text-white border-none backdrop-blur-md px-4 py-1.5 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">
                Command Center
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter">SaveBite <span className="text-primary italic">Admin.</span></h1>
              <p className="text-zinc-300 font-medium italic text-xs sm:text-lg max-w-xl opacity-80">
                Monitoring the ecosystem impact at scale.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 backdrop-blur-md">
               <TrendingUp className="h-6 w-6 sm:h-10 sm:w-10 text-primary" />
               <div className="text-center sm:text-left">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Global Saved</p>
                  <p className="text-xl sm:text-3xl font-black">4.2 Tons</p>
               </div>
            </div>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {stats.map((stat, idx) => (
            <Card key={stat.label} className={cn("border-none shadow-xl rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden card-3d", idx % 2 === 0 ? "bg-white" : "bg-zinc-50")}>
              <CardContent className="p-4 sm:p-8">
                <div className={cn("p-2 sm:p-4 rounded-xl sm:rounded-2xl text-white shadow-lg w-fit mb-4", stat.color)}>
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl sm:text-4xl font-black tracking-tighter">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
            <TabsList className="bg-secondary/40 p-1 rounded-xl sm:rounded-2xl h-12 sm:h-14 w-full sm:w-auto">
              <TabsTrigger value="users" className="flex-1 sm:flex-none rounded-lg sm:rounded-xl px-4 sm:px-8 h-10 sm:h-12 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Users</TabsTrigger>
              <TabsTrigger value="inventory" className="flex-1 sm:flex-none rounded-lg sm:rounded-xl px-4 sm:px-8 h-10 sm:h-12 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Market</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search DB..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-white border-none shadow-lg text-sm" 
              />
            </div>
          </div>

          <TabsContent value="users" className="mt-0 outline-none">
            <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 h-16 sm:h-20">
                    <TableRow className="border-none">
                      <TableHead className="pl-6 sm:pl-10 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Identity</TableHead>
                      <TableHead className="text-center font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Role</TableHead>
                      <TableHead className="text-right pr-6 sm:pr-10 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 italic">No records found.</TableCell>
                      </TableRow>
                    ) : filteredUsers.map((u) => (
                      <TableRow key={u.id} className="border-b border-zinc-100">
                        <TableCell className="pl-6 sm:pl-10">
                          <p className="font-black text-sm sm:text-lg leading-none truncate max-w-[150px] sm:max-w-none">{u.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px] sm:max-w-none">{u.email}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="px-2 py-0.5 rounded-lg font-black uppercase text-[8px] bg-zinc-50">
                            {u.role || 'customer'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 sm:pr-10">
                           <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-danger" onClick={() => handleDeleteUser(u.id)}>
                             <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
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
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {marketplaceItems?.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-white p-4 sm:p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                       <Badge className="bg-primary/10 text-primary border-none font-black text-[7px] sm:text-[9px] px-2 py-0.5 rounded-lg uppercase">Live</Badge>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => handleDeleteProduct(item.id)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                    <CardTitle className="text-base sm:text-2xl font-black tracking-tighter leading-tight line-clamp-1 mb-2">{item.name}</CardTitle>
                    <div className="bg-zinc-50 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-zinc-100 mt-auto">
                       <div className="flex justify-between items-center mb-1">
                          <p className="text-[7px] sm:text-[9px] text-muted-foreground font-black uppercase">Price</p>
                          <p className="text-sm sm:text-xl font-black">₹{item.currentPrice}</p>
                       </div>
                       <div className="flex justify-between items-center">
                          <p className="text-[7px] sm:text-[9px] text-muted-foreground font-black uppercase">Stock</p>
                          <p className="text-sm sm:text-xl font-black">{item.quantity}U</p>
                       </div>
                    </div>
                  </Card>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
