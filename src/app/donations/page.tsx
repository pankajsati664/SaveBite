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
  PackageCheck
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
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"

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

    const claimId = doc(collection(firestore, "temp")).id
    const claimData = {
      ...donation,
      ngoId: user.uid,
      status: 'Claimed',
      claimDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }

    // Add to NGO's claimed collection
    const claimedRef = doc(firestore, "users", user.uid, "claimed_donations", donation.id)
    setDocumentNonBlocking(claimedRef, claimData, { merge: true })

    // Update public donation status or remove it
    const publicRef = doc(firestore, "donations_public", donation.id)
    deleteDocumentNonBlocking(publicRef)

    // Update store owner's donation record
    const storeDonationRef = doc(firestore, "users", donation.storeOwnerId, "donations", donation.id)
    setDocumentNonBlocking(storeDonationRef, { ...claimData }, { merge: true })

    toast({
      title: "Donation Claimed",
      description: `Successfully claimed ${donation.name}. Check 'My Active Claims' for pickup details.`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 animate-pulse">
            <Heart className="h-10 w-10 text-white fill-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">NGO Food Rescuer Hub</h1>
            <p className="text-muted-foreground max-w-xl">
              Connect with local stores to collect surplus food and redistribute it to those in need. Every pickup prevents waste and feeds families.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-card p-4 rounded-2xl border text-center shadow-sm min-w-[120px]">
              <p className="text-3xl font-black text-primary">{claimedDonations?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Total Rescues</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <TabsList className="bg-secondary/50 p-1 rounded-full h-14 w-full sm:w-auto">
              <TabsTrigger value="available" className="rounded-full px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">Available Surplus</TabsTrigger>
              <TabsTrigger value="claimed" className="rounded-full px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">My Active Claims</TabsTrigger>
            </TabsList>
            <Button variant="outline" className="w-full sm:w-auto rounded-xl h-12 border-primary/20 hover:bg-primary/5">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Pickup Window
            </Button>
          </div>

          <TabsContent value="available" className="mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isAvailableLoading ? (
                <div className="col-span-2 py-20 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Searching for surplus food donations...</p>
                </div>
              ) : availableDonations?.length === 0 ? (
                <div className="col-span-2 py-20 text-center bg-card rounded-3xl border border-dashed border-primary/20">
                  <PackageCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-1">No donations available</h3>
                  <p className="text-muted-foreground">Check back later or refresh for new listings from local partners.</p>
                </div>
              ) : (
                availableDonations?.map((item) => {
                  const daysLeft = getDaysRemaining(item.expiryDate || new Date().toISOString())
                  return (
                    <Card key={item.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col group">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-2xl font-headline group-hover:text-primary transition-colors">{item.name || 'Surplus Food Pack'}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 mt-2 font-bold text-primary uppercase text-[11px] tracking-wider">
                              <Store className="h-4 w-4" />
                              Pickup at Store Location
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-danger/10 text-danger border-none font-bold py-1.5 px-3 rounded-full">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            {daysLeft}d left
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-6 bg-secondary/30 p-5 rounded-2xl border border-primary/5">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Quantity</p>
                            <p className="text-xl font-black">{item.quantity} units</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Condition</p>
                            <p className="text-xl font-black capitalize text-success">Good</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 text-sm text-muted-foreground">
                            <MapPin className="h-5 w-5 text-primary shrink-0" />
                            <p className="font-medium">Specific store address available after claiming for security reasons.</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 p-5 mt-auto">
                        <Button 
                          className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 font-bold text-lg"
                          onClick={() => handleClaim(item)}
                        >
                          Claim for Donation
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
              <div className="py-20 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              </div>
            ) : claimedDonations?.length === 0 ? (
              <div className="bg-card rounded-3xl border border-dashed border-primary/20 p-16 text-center shadow-sm">
                <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black mb-3">No active claims</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">You haven't claimed any food rescues yet. Browse available surplus to start your first mission.</p>
                <Button onClick={() => setActiveTab("available")} className="h-12 px-8 rounded-xl font-bold">Browse Available Items</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {claimedDonations?.map((item) => (
                  <Card key={item.id} className="border-none shadow-md rounded-2xl overflow-hidden group">
                    <div className="h-2 bg-success" />
                    <CardHeader>
                      <div className="flex justify-between items-center mb-2">
                        <Badge className="bg-success/10 text-success border-none font-bold">Rescued</Badge>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tighter">Claimed {new Date(item.claimDate).toLocaleDateString()}</span>
                      </div>
                      <CardTitle className="text-xl">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <PackageCheck className="h-4 w-4 text-primary" />
                          <span className="font-bold">{item.quantity} units</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Store ID: {item.storeOwnerId?.slice(0, 8)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-secondary/20 border-t p-4 flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl font-bold text-xs h-9">Contact Store</Button>
                      <Button className="flex-1 rounded-xl font-bold text-xs h-9">Mark Picked Up</Button>
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
