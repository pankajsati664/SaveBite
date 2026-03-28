
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
    
    // Simulate a brief delay for UI feedback
    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "Profile updated", description: "Your changes have been saved successfully." })
    }, 500)
  }

  const handleLogout = () => {
    if (user?.auth) {
      signOut(user.auth).then(() => router.push("/login"))
    }
  }

  if (isAuthLoading || isProfileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const joinDate = userProfile?.createdAt?.seconds 
    ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() 
    : userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString() 
    : 'N/A'

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div>
          <h1 className="text-4xl font-headline font-black text-foreground">Settings</h1>
          <p className="text-muted-foreground text-lg italic">"Customize your SaveBite experience."</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Profile Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 pb-8 pt-10 text-center">
                <Avatar className="h-24 w-24 mx-auto border-4 border-background shadow-xl mb-4">
                  <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} />
                  <AvatarFallback className="text-2xl"><User /></AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl truncate px-4">{userProfile?.name || user?.email}</CardTitle>
                <Badge className="mt-2 capitalize" variant="secondary">{userProfile?.role?.replace('_', ' ') || 'User'}</Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-bold">{joinDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className="text-success border-success/20 bg-success/5 font-bold">Active</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="ghost" className="w-full text-danger hover:text-danger hover:bg-danger/5" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-md rounded-3xl p-6">
              <h3 className="font-bold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-between rounded-xl">
                  <span>Privacy Policy</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between rounded-xl">
                  <span>Help Center</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between rounded-xl">
                  <span>Legal Terms</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Settings Tabs/Forms */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-md rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal or business details.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name / Organization</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="pl-10 h-11 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="email" value={user?.email || ""} disabled className="pl-10 h-11 rounded-xl bg-secondary/30" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        value={formData.phoneNumber} 
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                        className="pl-10 h-11 rounded-xl"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Default Address (for stores/NGOs)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="address" 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="pl-10 h-11 rounded-xl"
                        placeholder="123 Eco Street, Green City"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                    Save Profile Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Manage how and when you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Expiry Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive push alerts for items expiring in 24h.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketplace Deals</Label>
                    <p className="text-sm text-muted-foreground">Get notified about 70%+ off deals near you.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS Notifications</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Smartphone className="h-3 w-3 text-primary" />
                      <p className="text-xs font-medium text-primary">Requires phone verification</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
