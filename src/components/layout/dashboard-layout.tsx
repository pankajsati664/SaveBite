
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
  TrendingUp,
  Globe,
  Bell,
  Settings,
  LogOut
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
  { title: "Market", href: "/marketplace", icon: ShoppingBag },
  { title: "Vault", href: "/inventory", icon: Package, roles: ['store_owner', 'admin'] },
  { title: "Rescue", href: "/donations", icon: HandHelping, roles: ['ngo', 'admin'] },
  { title: "Orders", href: "/orders", icon: TrendingUp, roles: ['customer', 'admin'] },
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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null
  const role = profile?.role || 'customer'
  const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(role))

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 sm:h-20 flex items-center justify-between px-6 sm:px-10 bg-card/80 backdrop-blur-xl sticky top-0 z-40 border-b border-secondary/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-primary p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter">SaveBite</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative rounded-xl h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-danger rounded-full ring-2 ring-card" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 shadow-md cursor-pointer hover:scale-105 transition-all">
                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/64/64`} />
                <AvatarFallback className="bg-secondary text-primary font-black"><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-[2rem] p-4 mt-2 shadow-2xl border-none" align="end">
              <DropdownMenuLabel className="space-y-1 p-2">
                <p className="font-black text-lg tracking-tighter leading-none">{profile?.name || "Member"}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3 font-bold" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4" /> Impact Settings
              </DropdownMenuItem>
              {role === 'admin' && (
                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3 font-bold text-primary" onClick={() => router.push('/admin')}>
                  <ShieldAlert className="h-4 w-4" /> Global Command
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer text-danger font-bold gap-3" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Terminate Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 pb-32 pt-6 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-10 duration-700">
        <nav className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex items-center gap-1 sm:gap-2 shadow-2xl w-full max-w-2xl overflow-x-auto scrollbar-hide">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex-1 min-w-[60px] flex flex-col items-center justify-center gap-1 py-3 rounded-[2rem] transition-all duration-300",
                pathname === item.href 
                  ? "bg-primary text-white shadow-xl scale-105" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", pathname === item.href ? "animate-pulse" : "")} />
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
