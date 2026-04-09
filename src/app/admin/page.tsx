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
  Plus,
  ArrowUpRight,
  Filter
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
    
    toast({ title: "Authority Elevated", description: `User role modified to ${newRole.toUpperCase()}.` })
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
      <div className="space-y-12 pb-32 animate-in fade-in duration-1000">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-[3rem] bg-zinc-950 px-10 py-16 sm:px-16 sm:py-24 text-white shadow-3xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-30 mix-blend-overlay" 
            alt="Admin"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
              <Badge className="bg-primary/20 text-primary border-none px-6 py-2 font-black uppercase tracking-[0.2em] text-[10px]">Global Control</Badge>
              <h1 className="text-5xl sm:text-8xl font-black tracking-tighter leading-none">System <span className="text-primary italic">Command.</span></h1>
              <p className="text-zinc-400 font-medium italic text-lg sm:text-2xl max-w-xl opacity-90 leading-relaxed">Centralized oversight of the global zero-waste infrastructure and community.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0">
               {[
                 { l: "Nodes", v: allUsers?.length || 0, c: "bg-white/10" },
                 { l: "Assets", v: stockImages?.length || 0, c: "bg-primary/20" }
               ].map(s => (
                 <div key={s.l} className={cn("p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl text-center min-w-[140px]", s.c)}>
                    <p className="text-4xl font-black tracking-tighter">{s.v}</p>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-1">{s.l}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
            <TabsList className="bg-white/50 p-2 rounded-[2rem] h-20 w-full sm:w-auto shadow-xl border border-white">
              <TabsTrigger value="users" className="flex-1 sm:flex-none rounded-[1.5rem] px-10 h-16 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all duration-500">
                <Users className="mr-3 h-5 w-5" /> Nodes
              </TabsTrigger>
              <TabsTrigger value="images" className="flex-1 sm:flex-none rounded-[1.5rem] px-10 h-16 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all duration-500">
                <ImageIcon className="mr-3 h-5 w-5" /> Library
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex-1 sm:flex-none rounded-[1.5rem] px-10 h-16 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all duration-500">
                <FileText className="mr-3 h-5 w-5" /> Audit
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input 
                placeholder="Search nodes by identity..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-16 h-20 rounded-[1.75rem] bg-white border-none shadow-2xl font-bold text-lg" 
              />
            </div>
          </div>

          <TabsContent value="users" className="outline-none">
            <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 h-24">
                    <TableRow className="border-none">
                      <TableHead className="pl-12 font-black uppercase text-[10px] tracking-widest">Identity Node</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Authority Level</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Node Status</TableHead>
                      <TableHead className="text-right pr-12 font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-40"><Loader2 className="h-16 w-16 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
                    ) : allUsers?.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())).map((u) => (
                      <TableRow key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors h-24">
                        <TableCell className="pl-12">
                          <p className="font-black text-xl tracking-tighter leading-none">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5">{u.email}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <select 
                            className="bg-secondary/40 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest border-none focus:ring-2 focus:ring-primary/20 appearance-none text-center"
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          >
                            <option value="customer">Customer</option>
                            <option value="store_owner">Store Owner</option>
                            <option value="ngo">NGO Partner</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className={cn("border-none px-5 py-2 font-black text-[9px] uppercase tracking-widest rounded-xl shadow-sm", u.isBlocked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                              {u.isBlocked ? "DEACTIVATED" : "OPERATIONAL"}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-12">
                           <div className="flex justify-end gap-3">
                              <Button size="icon" variant="ghost" className={cn("h-12 w-12 rounded-xl transition-all", u.isBlocked ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")} onClick={() => updateDocumentNonBlocking(doc(firestore!, "users", u.id), { isBlocked: !u.isBlocked })}>
                                 {u.isBlocked ? <UserCheck className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
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

          <TabsContent value="images" className="outline-none">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
              <Card className="border-4 border-dashed border-zinc-200 bg-white rounded-[3rem] flex flex-col items-center justify-center p-10 min-h-[280px] relative group hover:border-primary/50 transition-all card-3d">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCloudinaryUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="p-5 bg-primary/10 rounded-[1.5rem] shadow-xl mb-6 group-hover:scale-110 group-hover:bg-primary transition-all">
                      <Plus className="h-10 w-10 text-primary group-hover:text-white" />
                    </div>
                    <p className="font-black text-[11px] uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 transition-colors">Add Stock Asset</p>
                  </>
                )}
              </Card>
              {stockImages?.map((img, idx) => (
                <Card key={img.id} className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white aspect-square relative group card-3d animate-in zoom-in-95" style={{ animationDelay: `${idx * 50}ms` }}>
                  <img src={img.url} className="object-cover w-full h-full" alt="Stock" />
                  <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-8">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest text-center truncate w-full">{img.name}</p>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="rounded-2xl h-14 w-14 shadow-2xl"
                      onClick={() => deleteDocumentNonBlocking(doc(firestore!, "stock_images", img.id))}
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="py-24 text-center space-y-8 animate-in slide-in-from-bottom-10">
             <div className="h-32 w-32 bg-secondary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <FileText className="h-16 w-16 text-muted-foreground opacity-30" />
             </div>
             <div className="space-y-3">
                <h3 className="text-4xl font-black tracking-tighter">Global Audit Intelligence</h3>
                <p className="text-muted-foreground italic text-lg max-w-lg mx-auto leading-relaxed">System-wide performance metrics and impact auditing are compiled and ready for archival.</p>
             </div>
             <Button className="h-20 rounded-[1.5rem] bg-zinc-950 px-16 font-black uppercase text-[11px] tracking-[0.2em] shadow-3xl hover:scale-105 active:scale-95 transition-all">
               Generate Global Audit (PDF) <ArrowUpRight className="ml-3 h-5 w-5" />
             </Button>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}