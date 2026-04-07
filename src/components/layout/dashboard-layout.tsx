
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
  Bell,
  Settings,
  LogOut,
  ChevronRight
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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Market", href: "/marketplace", icon: ShoppingBag },
  { title: "Vault", href: "/inventory", icon: Package, roles: ['store_owner', 'admin'] },
  { title: "NGO Hub", href: "/donations", icon: HandHelping, roles: ['ngo', 'admin'] },
  { title: "Journal", href: "/orders", icon: TrendingUp, roles: ['customer', 'admin'] },
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
    <div className="min-h-screen flex flex-col bg-background pb-32">
      <header className="h-16 sm:h-24 flex items-center justify-between px-6 sm:px-12 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-zinc-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-primary p-2.5 rounded-2xl shadow-xl group-hover:scale-110 transition-transform shadow-primary/20">
            <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="text-xl sm:text-3xl font-black text-primary tracking-tighter leading-none">SaveBite</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <Button variant="ghost" size="icon" className="relative rounded-2xl h-10 w-10 sm:h-14 sm:w-14 bg-zinc-50 border border-zinc-100">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" />
            <span className="absolute top-4 right-4 h-2.5 w-2.5 bg-rose-500 rounded-full ring-4 ring-white" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-4 cursor-pointer group">
                <div className="hidden sm:block text-right">
                   <p className="font-black text-sm tracking-tighter">{profile?.name || "Member"}</p>
                   <p className="text-[9px] font-black uppercase text-primary tracking-widest opacity-60">{role.replace('_', ' ')}</p>
                </div>
                <Avatar className="h-10 w-10 sm:h-14 sm:w-14 ring-4 ring-zinc-50 shadow-2xl transition-all group-hover:ring-primary/10">
                  <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/64/64`} />
                  <AvatarFallback className="bg-primary text-white font-black"><User className="h-6 w-6" /></AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 rounded-[2.5rem] p-6 mt-4 shadow-3xl border-none animate-in slide-in-from-top-2 duration-300" align="end">
              <DropdownMenuLabel className="space-y-1 p-0 mb-4">
                <p className="font-black text-2xl tracking-tighter leading-none">{profile?.name || "Member"}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-4" />
              <DropdownMenuItem className="rounded-2xl p-4 cursor-pointer gap-4 font-black text-xs uppercase tracking-widest" onClick={() => router.push('/settings')}>
                <Settings className="h-5 w-5 text-zinc-400" /> Profile Settings
              </DropdownMenuItem>
              {role === 'admin' && (
                <DropdownMenuItem className="rounded-2xl p-4 cursor-pointer gap-4 font-black text-xs uppercase tracking-widest text-primary bg-primary/5" onClick={() => router.push('/admin')}>
                  <ShieldAlert className="h-5 w-5" /> Global Command
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-4" />
              <DropdownMenuItem className="rounded-2xl p-4 cursor-pointer text-rose-600 font-black text-xs uppercase tracking-widest gap-4 hover:bg-rose-50" onClick={handleLogout}>
                <LogOut className="h-5 w-5" /> Terminate Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-12 pt-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-3 flex items-center gap-2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-x-auto scrollbar-hide">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1.5 py-4 rounded-[2.5rem] transition-all duration-500",
                pathname === item.href 
                  ? "bg-primary text-white shadow-2xl scale-105" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", pathname === item.href ? "animate-pulse" : "")} />
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
