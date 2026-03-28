"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { 
  Package, 
  AlertTriangle, 
  History, 
  Heart, 
  TrendingUp, 
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const stats = [
  { label: "Total Products", value: "154", icon: Package, color: "bg-blue-500", trend: "+12%" },
  { label: "Near Expiry", value: "24", icon: AlertTriangle, color: "bg-warning", trend: "+2" },
  { label: "Expired", value: "5", icon: History, color: "bg-danger", trend: "-3" },
  { label: "Donations Made", value: "89", icon: Heart, color: "bg-primary", trend: "+15%" },
]

const recentActivity = [
  { id: 1, title: "Whole Wheat Bread", status: "near-expiry", date: "Expiring in 2 days", amount: "12 units" },
  { id: 2, title: "Organic Milk", status: "donated", date: "Donated 3 hours ago", amount: "5 units" },
  { id: 3, title: "Red Apples", status: "expired", date: "Expired yesterday", amount: "8 units" },
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Good Morning, Fresh Markets!</h1>
          <p className="text-muted-foreground">Here's what's happening with your inventory today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2 rounded-lg text-white", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                    stat.trend.startsWith('+') ? "text-success bg-success/10" : "text-danger bg-danger/10"
                  )}>
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart / Waste Savings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Waste Savings Over Time
              </CardTitle>
              <CardDescription>Estimated food weight saved from landfill (kg)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full bg-secondary/30 rounded-lg flex items-end justify-between p-6 gap-2">
                {[45, 60, 40, 70, 85, 95, 80].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div 
                      className="w-full max-w-[40px] bg-primary/80 group-hover:bg-primary transition-all rounded-t-sm" 
                      style={{ height: `${val}%` }} 
                    />
                    <span className="text-[10px] text-muted-foreground mt-2 font-medium">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Urgent Alerts / Expiry Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Critical Items
              </CardTitle>
              <CardDescription>Items needing immediate action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Expiring Today</span>
                  <span className="font-bold">12 units</span>
                </div>
                <Progress value={85} className="h-2 bg-secondary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Expiring in 3 Days</span>
                  <span className="font-bold">45 units</span>
                </div>
                <Progress value={45} className="h-2 bg-secondary" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    Mark Expired
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start text-primary">
                    Donate All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Updates from your inventory</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      item.status === 'near-expiry' ? "bg-warning/20 text-warning" : 
                      item.status === 'donated' ? "bg-primary/20 text-primary" : "bg-danger/20 text-danger"
                    )}>
                      {item.status === 'near-expiry' ? <AlertTriangle className="h-5 w-5" /> : 
                       item.status === 'donated' ? <Heart className="h-5 w-5" /> : <History className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {item.amount}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}