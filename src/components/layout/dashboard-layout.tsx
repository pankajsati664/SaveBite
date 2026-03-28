"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Leaf, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  HandHelping, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Bell,
  User,
  Search,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { signOut } from "firebase/auth"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", href: "/inventory", icon: Package, roles: ['store_owner', 'admin'] },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { title: "Donations", href: "/donations", icon: HandHelping, roles: ['ngo', 'store_owner', 'admin'] },
  { title: "Admin Panel", href: "/admin", icon: Settings, roles: ['admin'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const userRole = userProfile?.role || 'customer'

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push("/login")
      })
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="bg-primary p-1.5 rounded-lg">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-headline font-bold text-primary">FoodSaver AI</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1">
            {filteredNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  pathname === item.href 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b bg-card sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="pl-9 pr-4 py-2 bg-secondary/50 rounded-full border-transparent focus:border-primary text-sm w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-danger rounded-full ring-2 ring-card" />
            </Button>
            <Separator orientation="vertical" className="h-8 mx-1 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{userProfile?.name || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
              </div>
              <Avatar>
                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
