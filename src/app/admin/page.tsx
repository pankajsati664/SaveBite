
"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Users, 
  Globe, 
  ShieldAlert, 
  Loader2,
  Trash2,
  Search,
  Image as ImageIcon,
  Upload,
  BarChart3,
  AlertOctagon,
  FileText,
  UserCheck,
  Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "users"), orderBy("createdAt", "desc"))
  }, [firestore])

  const stockImagesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "stock_images"), orderBy("createdAt", "desc"))
  }, [firestore])

  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)
  const { data: stockImages, isLoading: isImagesLoading } = useCollection(stockImagesQuery)

  const handleUpdateRole = (userId: string, newRole: string) => {
    if (!firestore) return
    const userRef = doc(firestore, "users", userId)
    updateDocumentNonBlocking(userRef, { role: newRole, updatedAt: serverTimestamp() })
    
    const roles = ['admin', 'store_owner', 'customer', 'ngo']
    roles.forEach(roleName => {
      const roleRef = doc(firestore, `roles_${roleName}`, userId)
      if (roleName === newRole) setDocumentNonBlocking(roleRef, { id: userId }, { merge: true })
      else deleteDocumentNonBlocking(roleRef)
    })
    
    toast({ title: "Authority Updated", description: `User role modified to ${newRole}.` })
  }

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !firestore) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "freshtrack")

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, {
        method: "POST",
        body: formData
      })
      const data = await response.json()
      
      if (data.secure_url) {
        addDocumentNonBlocking(collection(firestore, "stock_images"), {
          url: data.secure_url,
          name: file.name,
          createdAt: serverTimestamp()
        })
        toast({ title: "Asset Secured", description: "Image uploaded to Cloudinary library." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Network error during Cloudinary transfer." })
    } finally {
      setIsUploading(false)
    }
  }

  const heroImage = getPlaceholderById('landing-store')

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10 pb-24 animate-in fade-in duration-1000">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 px-8 py-12 sm:py-20 text-white shadow-2xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-40 mix-blend-overlay" 
            alt="Admin"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">Global Control</Badge>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter">System <span className="text-primary italic">Command.</span></h1>
              <p className="text-zinc-300 font-medium italic text-sm sm:text-lg max-w-xl opacity-80">Overseeing the global zero-waste infrastructure.</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <TabsList className="bg-secondary/40 p-1.5 rounded-2xl h-16 w-full sm:w-auto">
              <TabsTrigger value="users" className="flex-1 sm:flex-none rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">Nodes</TabsTrigger>
              <TabsTrigger value="images" className="flex-1 sm:flex-none rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">Library</TabsTrigger>
              <TabsTrigger value="reports" className="flex-1 sm:flex-none rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">Audit</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search nodes..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-white border-none shadow-lg" 
              />
            </div>
          </div>

          <TabsContent value="users">
            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 h-20">
                    <TableRow className="border-none">
                      <TableHead className="pl-10 font-black uppercase text-[10px]">Identity</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px]">Authority</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px]">Status</TableHead>
                      <TableHead className="text-right pr-10 font-black uppercase text-[10px]">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : allUsers?.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map((u) => (
                      <TableRow key={u.id} className="border-b border-zinc-100">
                        <TableCell className="pl-10">
                          <p className="font-black text-lg">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <select 
                            className="bg-secondary/50 rounded-xl p-2 font-black text-[10px] uppercase border-none focus:ring-0"
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          >
                            <option value="customer">Customer</option>
                            <option value="store_owner">Store Owner</option>
                            <option value="ngo">NGO</option>
                            <option value="admin">Admin</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className={cn("border-none px-3 py-1 font-black text-[9px] uppercase", u.isBlocked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                              {u.isBlocked ? "Blocked" : "Active"}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                           <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" className="h-10 w-10 text-rose-600" onClick={() => updateDocumentNonBlocking(doc(firestore!, "users", u.id), { isBlocked: !u.isBlocked })}>
                                 <Trash2 className="h-5 w-5" />
                              </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <Card className="border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-[2rem] flex flex-col items-center justify-center p-8 min-h-[250px] relative group overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCloudinaryUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Add Stock Asset</p>
                  </>
                )}
              </Card>
              {stockImages?.map((img) => (
                <Card key={img.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white aspect-square relative group">
                  <img src={img.url} className="object-cover w-full h-full" alt="Stock" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="rounded-full"
                      onClick={() => deleteDocumentNonBlocking(doc(firestore!, "stock_images", img.id))}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="py-12 text-center space-y-4">
             <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-10 w-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-black">Report Generator</h3>
             <p className="text-muted-foreground italic">Platform performance audits are ready for generation.</p>
             <Button className="h-14 rounded-2xl bg-primary px-10 font-black uppercase text-[10px]">Download Global Audit (PDF)</Button>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
