"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Heart, 
  MapPin, 
  Clock, 
  Store, 
  CheckCircle2, 
  Info,
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

const mockDonations = [
  { id: "d1", name: "Surplus Artisan Bread", qty: "20 units", expiryDate: "2024-05-18", store: "Downtown Bakery", address: "123 Main St", contact: "+1 234 567 890", status: "available" },
  { id: "d2", name: "Bulk Apples (Crates)", qty: "5 crates", expiryDate: "2024-05-20", store: "Green Grocery", address: "45 Market Ave", contact: "+1 987 654 321", status: "available" },
  { id: "d3", name: "Pre-made Salads", qty: "15 bowls", expiryDate: "2024-05-18", store: "QuickMart", address: "88 Plaza Rd", contact: "+1 555 012 345", status: "claimed" },
]

export default function DonationsPage() {
  const [activeTab, setActiveTab] = useState("available")
  const { toast } = useToast()

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
              <p className="text-2xl font-bold text-primary">1.2k</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Meals Provided</p>
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
              {mockDonations.filter(d => d.status === 'available').map((item) => {
                const daysLeft = getDaysRemaining(item.expiryDate)
                return (
                  <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{item.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-primary">
                            <Store className="h-3.5 w-3.5" />
                            {item.store}
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
                          <p className="font-semibold">{item.qty}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">Pickup By</p>
                          <p className="font-semibold">{item.expiryDate}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{item.address}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{item.contact}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                        onClick={() => handleClaim(item.name)}
                      >
                        Claim for Donation
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="claimed" className="mt-0">
            <div className="bg-card rounded-2xl border p-12 text-center">
              <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No active claims</h3>
              <p className="text-muted-foreground mb-6">You haven't claimed any donations yet. Browse available surplus to start saving food.</p>
              <Button onClick={() => setActiveTab("available")}>Browse Available Items</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}