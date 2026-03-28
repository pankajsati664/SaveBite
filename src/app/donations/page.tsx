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
  Phone
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"

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

  const handleClaim = (item: string) => {
    toast({
      title: "Item Claimed",
      description: `Successfully claimed ${item}. Check 'My Claims' for pickup details.`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
            <Heart className="h-10 w-10 text-white fill-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">NGO Food Rescuer Hub</h1>
            <p className="text-muted-foreground max-w-xl">
              Connect with local stores to collect surplus food and redistribute it to those in need. Every pickup prevents waste and feeds families.
            </p>
          </div>
          <div className="ml-auto flex gap-4">
            <div className="bg-card p-4 rounded-xl border text-center shadow-sm">
              <p className="text-2xl font-bold text-primary">{claimedDonations?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Rescues Made</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-secondary/50 p-1 rounded-full h-12">
              <TabsTrigger value="available" className="rounded-full px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">Available Surplus</TabsTrigger>
              <TabsTrigger value="claimed" className="rounded-full px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">My Active Claims</TabsTrigger>
            </TabsList>
            <Button variant="outline" className="hidden sm:flex rounded-full">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Pickup
            </Button>
          </div>

          <TabsContent value="available" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isAvailableLoading ? (
                <p className="text-center py-10 text-muted-foreground col-span-2">Searching for surplus food...</p>
              ) : availableDonations?.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground col-span-2">No available donations at this time.</p>
              ) : (
                availableDonations?.map((item) => {
                  const daysLeft = getDaysRemaining(item.expiryDate || new Date().toISOString())
                  return (
                    <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{item.productName || 'Surplus Item'}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-primary">
                              <Store className="h-3.5 w-3.5" />
                              Store Pickup
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-danger/10 text-danger border-none">
                            <Clock className="h-3 w-3 mr-1" />
                            {daysLeft}d left
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-secondary/30 p-4 rounded-xl">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Quantity</p>
                            <p className="font-semibold">{item.quantity} units</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Status</p>
                            <p className="font-semibold capitalize">{item.status}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span>Check store for location</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                          onClick={() => handleClaim(item.productName)}
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

          <TabsContent value="claimed" className="mt-0">
            {isClaimedLoading ? (
              <p className="text-center py-10 text-muted-foreground">Loading your claims...</p>
            ) : claimedDonations?.length === 0 ? (
              <div className="bg-card rounded-2xl border p-12 text-center">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No active claims</h3>
                <p className="text-muted-foreground mb-6">You haven't claimed any donations yet. Browse available surplus to start saving food.</p>
                <Button onClick={() => setActiveTab("available")}>Browse Available Items</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {claimedDonations?.map((item) => (
                  <Card key={item.id} className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle>{item.productName}</CardTitle>
                      <Badge className="w-fit">{item.status}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Claimed on: {new Date(item.claimDate).toLocaleDateString()}</p>
                    </CardContent>
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
