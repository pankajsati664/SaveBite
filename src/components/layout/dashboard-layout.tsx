
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
  Loader2,
  ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
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
  { title: "My Orders", href: "/orders", icon: ClipboardList, roles: ['customer', 'admin'] },
  { title: "Donations", href: "/donations", icon: HandHelping, roles: ['ngo', 'store_owner', 'admin'] },
  { title: "Settings", href: "/settings", icon: Settings },
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
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-card border-r transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-headline font-black text-primary tracking-tighter">SaveBite</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto lg:hidden rounded-full hover:bg-secondary"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <nav className="flex-1 space-y-2">
            {filteredNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                  pathname === item.href 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-secondary/50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-xl transition-all font-bold text-sm"
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
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b bg-card sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-xl hover:bg-secondary"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="relative hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search deals..." 
                className="pl-11 pr-4 py-2.5 bg-secondary/40 rounded-full border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm w-72 transition-all outline-none border border-transparent focus:border-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-secondary">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-danger rounded-full ring-2 ring-card" />
            </Button>
            <Separator orientation="vertical" className="h-10 mx-1 hidden md:block" />
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black tracking-tight leading-none mb-1">{userProfile?.name?.split(' ')[0] || "User"}</p>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{userRole.replace('_', ' ')}</p>
              </div>
              <Avatar className="h-9 w-9 md:h-11 md:w-11 ring-2 ring-primary/5 shadow-md">
                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/48/48`} />
                <AvatarFallback className="bg-secondary text-primary font-black"><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
