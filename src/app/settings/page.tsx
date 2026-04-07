
"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Shield, 
  Save,
  Bell,
  Smartphone,
  ChevronRight,
  LogOut,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, isUserLoading: isAuthLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phoneNumber: ""
  })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        address: userProfile.address || "",
        phoneNumber: userProfile.phoneNumber || ""
      })
    }
  }, [userProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firestore || !user) return

    setIsSaving(true)
    const userRef = doc(firestore, "users", user.uid)
    updateDocumentNonBlocking(userRef, {
      ...formData,
      updatedAt: serverTimestamp()
    })
    
    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "Profile Secured", description: "Your profile information has been successfully updated." })
    }, 800)
  }

  const handleLogout = () => {
    if (user?.auth) {
      signOut(user.auth).then(() => router.push("/"))
    }
  }

  if (isAuthLoading || isProfileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 sm:py-32">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const joinDate = userProfile?.createdAt?.seconds 
    ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() 
    : userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString() 
    : 'New Impact Member'

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-black text-foreground tracking-tighter">Impact Center</h1>
          <p className="text-muted-foreground text-sm sm:text-lg lg:text-xl font-medium italic opacity-80">"Personalize your sustainability journey."</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          <div className="lg:col-span-1 space-y-6 sm:space-y-8">
            <Card className="border-none shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 pb-8 sm:pb-12 pt-12 sm:pt-16 text-center relative">
                <div className="absolute top-0 left-0 w-full h-16 sm:h-24 bg-gradient-to-b from-primary/10 to-transparent" />
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mx-auto border-4 sm:border-8 border-white shadow-2xl mb-4 sm:mb-6 relative z-10 transition-transform hover:scale-105">
                  <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/128/128`} />
                  <AvatarFallback className="text-2xl sm:text-4xl bg-secondary text-primary font-black"><User className="h-10 w-10 sm:h-16 sm:w-16" /></AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl sm:text-2xl font-black truncate px-4 leading-tight">{userProfile?.name || user?.email?.split('@')[0]}</CardTitle>
                <Badge className="mt-3 sm:mt-4 bg-primary text-white border-none font-black uppercase tracking-widest text-[8px] sm:text-[10px] px-3 sm:px-5 py-1 sm:py-1.5 rounded-full shadow-lg shadow-primary/20">
                  {userProfile?.role?.replace('_', ' ') || 'Eco Member'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-6 sm:pt-10 px-6 sm:px-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between text-[11px] sm:text-sm font-bold">
                    <span className="text-muted-foreground uppercase tracking-widest text-[9px] sm:text-[10px]">Since</span>
                    <span className="text-foreground">{joinDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] sm:text-sm font-bold">
                    <span className="text-muted-foreground uppercase tracking-widest text-[9px] sm:text-[10px]">Status</span>
                    <Badge variant="outline" className="text-success border-success/20 bg-success/5 font-black uppercase tracking-widest text-[8px] sm:text-[9px] px-2 sm:px-3 py-0.5">Active Impact</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-secondary p-6 sm:p-8 bg-secondary/10">
                <Button variant="ghost" className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl text-danger hover:text-danger hover:bg-danger/10 font-black uppercase tracking-widest text-[10px] sm:text-[11px] transition-all" onClick={handleLogout}>
                  <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Terminate Session
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-lg rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 bg-card space-y-4 sm:space-y-6">
              <h3 className="font-black uppercase tracking-widest text-[9px] sm:text-xs text-primary/70">Resources</h3>
              <div className="space-y-2 sm:space-y-3">
                {["Privacy Standards", "Sustainability Guide", "Legal Framework", "Support Hub"].map(item => (
                  <Button key={item} variant="ghost" className="w-full justify-between rounded-xl sm:rounded-2xl h-11 sm:h-14 font-bold text-xs sm:text-sm hover:bg-secondary group px-4 sm:px-6">
                    <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all" />
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6 sm:space-y-10">
            <Card className="border-none shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[3rem] bg-card overflow-hidden">
              <CardHeader className="p-6 sm:p-10 pb-4">
                <CardTitle className="flex items-center gap-3 sm:gap-4 text-xl sm:text-3xl font-black tracking-tighter leading-tight">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl">
                    <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  Profile Mastery
                </CardTitle>
                <CardDescription className="text-sm sm:text-base font-medium italic">Your coordinates in the zero-waste ecosystem.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 pt-4 sm:pt-6">
                <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <Input 
                          id="name" 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="pl-11 sm:pl-12 h-12 sm:h-14 rounded-xl sm:rounded-[1.25rem] bg-secondary/30 border-none shadow-inner text-sm sm:text-base font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <Input id="email" value={user?.email || ""} disabled className="pl-11 sm:pl-12 h-12 sm:h-14 rounded-xl sm:rounded-[1.25rem] bg-secondary/10 border-none opacity-60 text-sm sm:text-base font-medium" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="phone" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Communication Line</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        value={formData.phoneNumber} 
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                        className="pl-11 sm:pl-12 h-12 sm:h-14 rounded-xl sm:rounded-[1.25rem] bg-secondary/30 border-none shadow-inner text-sm sm:text-base font-medium"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="address" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Base Coordinates</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <Input 
                        id="address" 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="pl-11 sm:pl-12 h-12 sm:h-14 rounded-xl sm:rounded-[1.25rem] bg-secondary/30 border-none shadow-inner text-sm sm:text-base font-medium"
                        placeholder="Verified Address"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 shadow-xl sm:shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-[11px] sm:text-sm transition-all active:scale-[0.98]" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mr-3" /> : <Save className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />}
                    Lock Profile Updates
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[3rem] bg-card overflow-hidden">
              <CardHeader className="p-6 sm:p-10 pb-4">
                <CardTitle className="flex items-center gap-3 sm:gap-4 text-xl sm:text-3xl font-black tracking-tighter leading-tight">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl">
                    <Bell className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  Alert Protocol
                </CardTitle>
                <CardDescription className="text-sm sm:text-base font-medium italic">Manage impact opportunities.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 pt-4 sm:pt-6 space-y-8 sm:space-y-10">
                <div className="flex items-center justify-between group">
                  <div className="space-y-0.5 sm:space-y-1 pr-4">
                    <Label className="text-base sm:text-lg font-black tracking-tight">Expiry Alerts</Label>
                    <p className="text-[10px] sm:text-sm text-muted-foreground font-medium italic">Instant pings for items expiring in 24h.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary scale-90 sm:scale-110" />
                </div>
                <Separator className="bg-secondary" />
                <div className="flex items-center justify-between group">
                  <div className="space-y-0.5 sm:space-y-1 pr-4">
                    <Label className="text-base sm:text-lg font-black tracking-tight">Marketplace Deals</Label>
                    <p className="text-[10px] sm:text-sm text-muted-foreground font-medium italic">Alerts for 80%+ discount surges.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary scale-90 sm:scale-110" />
                </div>
                <Separator className="bg-secondary" />
                <div className="flex items-center justify-between group">
                  <div className="space-y-0.5 sm:space-y-1 pr-4">
                    <Label className="text-base sm:text-lg font-black tracking-tight">SMS Direct Broadcast</Label>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                      <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <p className="text-[8px] sm:text-[9px] font-black text-primary uppercase tracking-widest">Verification Needed</p>
                    </div>
                  </div>
                  <Switch className="scale-90 sm:scale-110" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
