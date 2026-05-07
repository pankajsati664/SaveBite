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
  User, 
  ShieldAlert, 
  Loader2,
  Bell,
  Settings,
  LogOut,
  Barcode,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", href: "/inventory", icon: Package, roles: ['store_owner', 'admin'] },
  { title: "Market", href: "/marketplace", icon: ShoppingBag },
  { title: "POS", href: "/pos", icon: Barcode, roles: ['store_owner', 'admin'] },
  { title: "NGO Hub", href: "/donations", icon: HandHelping, roles: ['ngo', 'admin'] },
  { title: "Orders", href: "/orders", icon: History, roles: ['customer', 'admin'] },
  { title: "Admin", href: "/admin", icon: ShieldAlert, roles: ['admin'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/")
  }, [user, isUserLoading, router])

  const handleLogout = () => {
    if (auth) signOut(auth).then(() => router.push("/"))
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    )
  }

  if (!user) return null
  const role = profile?.role || 'customer'
  const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(role))

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 print:pb-0">
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b sticky top-0 z-40 print:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary tracking-tight">SaveBite</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer group">
                <Avatar className="h-9 w-9 transition-all group-hover:ring-2 ring-primary/20">
                  <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/64/64`} />
                  <AvatarFallback className="bg-primary text-white text-xs font-bold uppercase">{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl mt-2 mr-2 shadow-lg" align="end">
              <DropdownMenuLabel className="font-bold">{profile?.name || "Member"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              {(role === 'admin' || role === 'store_owner') && (
                <DropdownMenuItem onClick={() => router.push('/pos')} className="cursor-pointer gap-2 text-primary font-bold">
                  <Barcode className="h-4 w-4" /> POS Terminal
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive">
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 pt-6 max-w-7xl mx-auto w-full print:p-0">
        {children}
      </main>

      {/* Simplified Bottom Navigation */}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center print:hidden">
        <nav className="bg-white/95 backdrop-blur-md border rounded-2xl p-1.5 flex items-center gap-1 shadow-lg w-fit max-w-full overflow-x-auto scrollbar-hide">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition-all",
                pathname === item.href 
                  ? "bg-primary text-white shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}