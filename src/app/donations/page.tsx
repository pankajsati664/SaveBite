
"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Heart, 
  MapPin, 
  Clock, 
  Store, 
  CheckCircle2, 
  Calendar,
  Loader2,
  PackageCheck,
  Zap,
  ChevronRight,
  HandHelping
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getDaysRemaining } from "@/lib/utils/expiry"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc, serverTimestamp, query, where } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { getPlaceholderById } from "@/lib/placeholder-images"

export default function DonationsPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("available")
  const { toast } = useToast()
  const firestore = useFirestore()

  const donationsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "donations_public")
  }, [firestore])

  const claimedQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return collection(firestore, "users", user.uid, "claimed_donations")
  }, [firestore, user])

  const { data: availableDonations, isLoading: isAvailableLoading } = useCollection(donationsQuery)
  const { data: claimedDonations, isLoading: isClaimedLoading } = useCollection(claimedQuery)

  const handleClaim = async (donation: any) => {
    if (!user || !firestore) return

    const claimData = {
      ...donation,
      ngoId: user.uid,
      status: 'Claimed',
      claimDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }

    // 1. Add to NGO's claimed donations
    const claimedRef = doc(firestore, "users", user.uid, "claimed_donations", donation.id)
    setDocumentNonBlocking(claimedRef, claimData, { merge: true })

    // 2. Remove from public pool
    const publicRef = doc(firestore, "donations_public", donation.id)
    deleteDocumentNonBlocking(publicRef)

    // 3. Update shop owner's original product status
    if (donation.ownerId) {
      const storeProductRef = doc(firestore, "users", donation.ownerId, "products", donation.id)
      updateDocumentNonBlocking(storeProductRef, {
        status: 'CLAIMED_BY_NGO',
        ngoId: user.uid,
        updatedAt: serverTimestamp()
      })
    }

    toast({
      title: "Rescue Initiated",
      description: `Successfully claimed ${donation.name}. Coordination details shared.`,
    })
  }

  const heroImage = getPlaceholderById('landing-ngo')

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="relative overflow-hidden rounded-[3rem] bg-rose-900 px-10 py-20 text-white shadow-2xl">
          <img 
            src={heroImage.imageUrl} 
            className="absolute inset-0 object-cover w-full h-full opacity-60 mix-blend-overlay" 
            alt="NGO Impact Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-rose-900/40 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="h-32 w-32 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20">
              <Heart className="h-16 w-16 text-white fill-white" />
            </div>
            <div className="text-center md:text-left flex-1 space-y-4">
              <Badge className="bg-white/20 text-white border-none px-5 py-2 font-black uppercase tracking-widest text-xs">NGO Impact Portal</Badge>
              <h1 className="text-5xl md:text-6xl font-headline font-black leading-tight tracking-tighter">Food Rescue Hub</h1>
              <p className="text-xl text-rose-50 max-w-2xl font-medium italic opacity-90 leading-relaxed">Claim surplus food from local partners and deliver hope to the community.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] text-center border border-white/10 shadow-2xl min-w-[180px]">
                <p className="text-6xl font-black text-white tracking-tighter">{claimedDonations?.length || 0}</p>
                <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mt-3">Active Missions</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-6">
            <TabsList className="bg-secondary/40 p-1.5 rounded-[2rem] h-20 w-full sm:w-auto border border-secondary shadow-inner">
              <TabsTrigger value="available" className="rounded-[1.5rem] px-12 h-16 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl font-black uppercase tracking-widest text-[11px] transition-all">
                <Zap className="mr-3 h-4 w-4" />
                Available Pool
              </TabsTrigger>
              <TabsTrigger value="claimed" className="rounded-[1.5rem] px-12 h-16 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl font-black uppercase tracking-widest text-[11px] transition-all">
                <CheckCircle2 className="mr-3 h-4 w-4" />
                Claimed Missions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="available" className="mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {isAvailableLoading ? (
                <div className="col-span-2 py-32 text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Scanning donation pool...</p>
                </div>
              ) : availableDonations?.length === 0 ? (
                <div className="col-span-2 py-32 text-center bg-card rounded-[3rem] border-4 border-dashed border-secondary shadow-sm">
                  <PackageCheck className="h-20 w-20 text-muted-foreground opacity-30 mx-auto mb-8" />
                  <h3 className="text-3xl font-black mb-3 tracking-tight">Pool is currently empty</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium text-lg italic">Check back soon for new surplus listings from local partners.</p>
                </div>
              ) : (
                availableDonations?.map((item, idx) => {
                  const daysLeft = getDaysRemaining(item.expiryDate || new Date().toISOString())
                  return (
                    <Card key={item.id} className="border-none shadow-lg hover:shadow-2xl transition-all duration-700 rounded-[2.5rem] flex flex-col group bg-card animate-in fade-in slide-in-from-bottom-4">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <CardTitle className="text-3xl font-headline font-black group-hover:text-primary transition-colors leading-tight">{item.name || 'Surplus Batch'}</CardTitle>
                            <CardDescription className="flex items-center gap-2 font-black text-primary uppercase text-[10px] tracking-widest">
                              <Store className="h-4 w-4" />
                              Pickup: Partner Store Venue
                            </CardDescription>
                          </div>
                          <Badge className={cn("border-none font-black py-2 px-5 rounded-2xl shadow-sm text-[10px] uppercase tracking-widest", daysLeft <= 3 ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>
                            {daysLeft}D UNTIL EXPIRE
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-6 flex-1">
                        <div className="grid grid-cols-2 gap-8 bg-secondary/20 p-8 rounded-[2rem] border border-secondary">
                          <div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-2">Quantity</p>
                            <p className="text-3xl font-black tracking-tighter">{item.quantity} Units</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-2">Category</p>
                            <p className="text-3xl font-black tracking-tighter truncate">{item.category || 'Food'}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-8 pt-0">
                        <Button 
                          className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 font-black text-lg transition-all"
                          onClick={() => handleClaim(item)}
                        >
                          Claim Donation <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="claimed" className="mt-0 outline-none">
            {isClaimedLoading ? (
              <div className="py-32 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              </div>
            ) : claimedDonations?.length === 0 ? (
              <div className="bg-card rounded-[3rem] border-4 border-dashed border-secondary p-24 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-10" />
                <h3 className="text-4xl font-black mb-4 tracking-tighter">No active missions</h3>
                <p className="text-muted-foreground mb-12 max-w-sm mx-auto font-medium text-lg italic">Claim items from the pool to start your rescue mission.</p>
                <Button onClick={() => setActiveTab("available")} className="h-16 px-12 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">View Pool</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {claimedDonations?.map((item, idx) => (
                  <Card key={item.id} className="border-none shadow-md hover:shadow-2xl rounded-[2.5rem] overflow-hidden group bg-card transition-all duration-500 animate-in fade-in slide-in-from-right-4">
                    <div className="h-3 bg-success" />
                    <CardHeader className="p-8">
                      <div className="flex justify-between items-center mb-4">
                        <Badge className="bg-success text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl">SECURED</Badge>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{new Date(item.claimDate).toLocaleDateString()}</span>
                      </div>
                      <CardTitle className="text-2xl font-black tracking-tighter leading-tight group-hover:text-primary transition-colors">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <div className="space-y-4 bg-secondary/20 p-6 rounded-2xl border border-secondary">
                        <div className="flex items-center gap-3 text-base">
                          <PackageCheck className="h-5 w-5 text-primary" />
                          <span className="font-black">{item.quantity} Units</span>
                        </div>
                        <div className="flex items-center gap-3 text-base">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="font-bold text-muted-foreground">Store ID: {item.ownerId?.slice(0, 10)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-secondary/10 border-t border-secondary p-6 flex gap-4">
                      <Button variant="outline" className="flex-1 rounded-2xl font-black uppercase tracking-widest text-[9px] h-14 border-secondary">Contact Store</Button>
                      <Button className="flex-1 rounded-2xl font-black uppercase tracking-widest text-[9px] h-14 shadow-lg shadow-primary/20">Log Rescue</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
