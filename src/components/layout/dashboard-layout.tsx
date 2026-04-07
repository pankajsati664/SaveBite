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
  Bell,
  User,
  ClipboardList,
  ShieldAlert,
  Loader2,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const navItems: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Market", href: "/marketplace", icon: ShoppingBag },
  { title: "Inventory", href: "/inventory", icon: Package, roles: ['store_owner', 'admin'] },
  { title: "Rescue", href: "/donations", icon: HandHelping, roles: ['ngo', 'store_owner', 'admin'] },
  { title: "Orders", href: "/orders", icon: ClipboardList, roles: ['customer', 'admin'] },
  { title: "Admin", href: "/admin", icon: ShieldAlert, roles: ['admin'] },
  { title: "Profile", href: "/settings", icon: User },
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

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => router.push("/"))
    }
  }

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
  ).slice(0, 5)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-16 sm:h-20 flex items-center justify-between px-6 sm:px-10 bg-card/80 backdrop-blur-xl sticky top-0 z-40 border-b border-secondary/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl sm:text-2xl font-headline font-black text-primary tracking-tighter">SaveBite</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-secondary h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-danger rounded-full ring-2 ring-card" />
          </Button>
          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 shadow-md cursor-pointer hover:scale-105 transition-transform">
                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/64/64`} />
                <AvatarFallback className="bg-secondary text-primary font-black"><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl p-2 mt-2 shadow-2xl border-none" align="end">
              <DropdownMenuLabel className="font-black uppercase tracking-widest text-[10px] text-muted-foreground px-4 py-3">
                {userProfile?.name || "Account Hub"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-secondary/50" />
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer" onClick={() => router.push('/settings')}>
                <User className="mr-3 h-4 w-4" />
                <span>Impact Profile</span>
              </DropdownMenuItem>
              {userRole === 'admin' && (
                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer font-bold text-primary" onClick={() => router.push('/admin')}>
                  <ShieldAlert className="mr-3 h-4 w-4" />
                  <span>Admin Control</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-secondary/50" />
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer text-danger hover:bg-danger/10" onClick={handleLogout}>
                <LogOut className="mr-3 h-4 w-4" />
                <span>Terminate Session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 pb-32 pt-6 px-4 sm:px-8 lg:px-12 bg-background scrollbar-hide overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Snackbar Navigation Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-10 duration-700">
        <nav className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex items-center gap-1 sm:gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-lg">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-[2rem] transition-all duration-300",
                pathname === item.href 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-5 w-5 sm:h-6", pathname === item.href ? "animate-pulse" : "")} />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em]">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
