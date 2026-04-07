
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
  ClipboardList,
  ShieldAlert
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
  { title: "Admin Panel", href: "/admin", icon: ShieldAlert, roles: ['admin'] },
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
      router.push("/")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        router.push("/")
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-card border-r transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6 sm:p-8">
          <div className="flex items-center gap-4 px-2 mb-10 sm:mb-12">
            <div className="bg-primary p-2.5 sm:p-3 rounded-[1.25rem] shadow-xl shadow-primary/20">
              <Leaf className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl sm:text-3xl font-headline font-black text-primary tracking-tighter">SaveBite</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto lg:hidden rounded-full hover:bg-secondary h-10 w-10"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto pr-2 scrollbar-hide">
            {filteredNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px] sm:text-[11px]",
                  pathname === item.href 
                    ? "bg-primary text-white shadow-xl sm:shadow-2xl shadow-primary/30 scale-[1.02] sm:scale-105" 
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 sm:pt-8 border-t border-secondary">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 sm:px-5 py-3.5 sm:py-4 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-xl sm:rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] sm:text-[11px]"
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
        <header className="h-16 sm:h-20 lg:h-24 flex items-center justify-between px-4 sm:px-8 lg:px-12 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-xl hover:bg-secondary h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
            <div className="relative hidden lg:block group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-14 pr-6 py-3.5 bg-secondary/40 rounded-full border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 text-sm w-72 xl:w-96 transition-all outline-none border border-transparent focus:border-primary/20 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
            <Button variant="ghost" size="icon" className="relative rounded-xl sm:rounded-2xl hover:bg-secondary h-10 w-10 sm:h-12 sm:w-12">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 h-2 w-2 sm:h-2.5 sm:w-2.5 bg-danger rounded-full ring-2 sm:ring-4 ring-card" />
            </Button>
            <Separator orientation="vertical" className="h-8 sm:h-12 hidden sm:block" />
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm sm:text-base font-black tracking-tighter leading-none mb-1 truncate max-w-[100px]">{userProfile?.name?.split(' ')[0] || "User"}</p>
                <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em]">{userRole.replace('_', ' ')}</p>
              </div>
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 ring-4 ring-primary/5 shadow-xl transition-transform hover:scale-105 cursor-pointer" onClick={() => router.push('/settings')}>
                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/64/64`} />
                <AvatarFallback className="bg-secondary text-primary font-black text-base sm:text-xl"><User className="h-5 w-5 sm:h-6 sm:w-6" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 bg-background scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
