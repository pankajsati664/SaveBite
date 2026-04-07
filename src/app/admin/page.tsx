
"use client"

import { useState, useRef } from "react"
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
  UserCog,
  ShieldCheck,
  Image as ImageIcon,
  Upload,
  Plus
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  addDocumentNonBlocking
} from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getPlaceholderById } from "@/lib/placeholder-images"

export default function AdminPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "users"), orderBy("createdAt", "desc"))
  }, [firestore])

  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "products_marketplace")
  }, [firestore])

  const stockImagesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "stock_images"), orderBy("createdAt", "desc"))
  }, [firestore])

  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)
  const { data: marketplaceItems, isLoading: isMarketLoading } = useCollection(marketplaceQuery)
  const { data: stockImages, isLoading: isStockLoading } = useCollection(stockImagesQuery)

  const isLoading = isUsersLoading || isMarketLoading || isStockLoading

  const handleUploadStockImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !firestore) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "freshtrack")

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dian1nfyk/image/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      
      if (data.secure_url) {
        const stockImageRef = collection(firestore, "stock_images")
        addDocumentNonBlocking(stockImageRef, {
          url: data.secure_url,
          name: file.name,
          createdAt: serverTimestamp()
        })
        toast({ title: "Image Published", description: "Stock image added to the system library." })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not push image to Cloudinary." })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, "users", userId))
    toast({ title: "User Revoked", description: "Profile removed from system." })
  }

  const handleUpdateRole = (userId: string, newRole: string) => {
    if (!firestore) return
    const userRef = doc(firestore, "users", userId)
    updateDocumentNonBlocking(userRef, { role: newRole, updatedAt: serverTimestamp() })
    
    const roles = ['admin', 'store_owner', 'customer', 'ngo']
    roles.forEach(roleName => {
      const roleRef = doc(firestore, `roles_${roleName}`, userId)
      if (roleName === newRole) {
        setDocumentNonBlocking(roleRef, { id: userId }, { merge: true })
      } else {
        deleteDocumentNonBlocking(roleRef)
      }
    })
    
    toast({ title: "Role Updated", description: `User is now a ${newRole.replace('_', ' ')}.` })
  }

  const stats = [
    { label: "Total Users", value: allUsers?.length || 0, icon: Users, color: "bg-blue-600" },
    { label: "Market Items", value: marketplaceItems?.length || 0, icon: ShoppingBag, color: "bg-emerald-600" },
    { label: "Stock Assets", value: stockImages?.length || 0, icon: ImageIcon, color: "bg-amber-600" },
    { label: "Platform Health", value: "99%", icon: ShieldAlert, color: "bg-rose-600" },
  ]

  const filteredUsers = allUsers?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
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
              <Badge className="bg-white/10 text-white border-none backdrop-blur-md px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">Command Center</Badge>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter">Platform <span className="text-primary italic">Intelligence.</span></h1>
              <p className="text-zinc-300 font-medium italic text-xs sm:text-lg max-w-xl opacity-80">Managing the global surplus ecosystem.</p>
            </div>
          </div>
        </div>

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
              <TabsTrigger value="images" className="flex-1 sm:flex-none rounded-lg sm:rounded-xl px-4 sm:px-8 h-10 sm:h-12 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Stock Images</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search database..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-white border-none shadow-lg text-sm" 
              />
            </div>
          </div>

          <TabsContent value="users" className="mt-0 outline-none">
            <Card className="border-none shadow-2xl rounded-[1.5rem] overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 h-16 sm:h-20">
                    <TableRow className="border-none">
                      <TableHead className="pl-6 font-black uppercase tracking-widest text-[10px]">Identity</TableHead>
                      <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Role</TableHead>
                      <TableHead className="text-right pr-6 font-black uppercase tracking-widest text-[10px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></TableCell></TableRow>
                    ) : filteredUsers.map((u) => (
                      <TableRow key={u.id} className="border-b border-zinc-100">
                        <TableCell className="pl-6">
                          <p className="font-black text-sm sm:text-lg">{u.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="h-8 rounded-xl px-4 gap-2 border-zinc-200">
                                <Badge variant="outline" className="bg-zinc-50 border-none font-black text-[8px] uppercase">{u.role}</Badge>
                                <UserCog className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-2xl border-none shadow-2xl p-2 w-48">
                              <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground p-3">Authority</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3 font-bold text-primary" onClick={() => handleUpdateRole(u.id, 'admin')}><ShieldCheck className="h-4 w-4" /> Admin</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3 font-bold" onClick={() => handleUpdateRole(u.id, 'store_owner')}><ShoppingBag className="h-4 w-4" /> Store Owner</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3 font-bold" onClick={() => handleUpdateRole(u.id, 'customer')}><Users className="h-4 w-4" /> Customer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => handleDeleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="mt-0 outline-none">
            <div className="flex justify-end mb-6">
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleUploadStockImage} accept="image/*" />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                className="h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] px-8"
              >
                {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Stock Asset
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {stockImages?.map((img) => (
                <Card key={img.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white group aspect-square relative">
                  <img src={img.url} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" alt={img.name} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon" className="rounded-full" onClick={() => deleteDocumentNonBlocking(doc(firestore!, "stock_images", img.id))}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
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
