
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Leaf, LogIn, Mail, Lock, UserPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, serverTimestamp } from "firebase/firestore"

export default function LandingLoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<string>("")
  
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const { user } = useUser()

  // Fast redirect as soon as user state is detected
  useEffect(() => {
    if (user) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) return
    setLoading(true)
    
    // Non-blocking sign in
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        toast({ title: "Authenticating...", description: "Redirecting to your dashboard." })
      })
      .catch((error: any) => {
        setLoading(false)
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: "Invalid credentials. Please try again." 
        })
      })
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !db || !role) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please select your role and fill all fields." })
      return
    }
    setLoading(true)
    
    // Non-blocking registration
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const userId = userCredential.user.uid
        
        // Fast, non-blocking profile creation
        const userRef = doc(db, "users", userId)
        setDocumentNonBlocking(userRef, {
          id: userId,
          email,
          name,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true })

        const roleRef = doc(db, `roles_${role}`, userId)
        setDocumentNonBlocking(roleRef, { id: userId }, { merge: true })

        toast({ title: "Account Created!", description: "Welcome to the zero-waste movement." })
      })
      .catch((error: any) => {
        setLoading(false)
        toast({ 
          variant: "destructive", 
          title: "Registration Failed", 
          description: error.message 
        })
      })
  }

  const handleGoogleSignIn = () => {
    if (!auth || !db) return
    setLoading(true)
    const provider = new GoogleAuthProvider()
    
    signInWithPopup(auth, provider)
      .then((result) => {
        if (result.user) {
          const userRef = doc(db, "users", result.user.uid);
          setDocumentNonBlocking(userRef, {
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || "Impact Hero",
            role: "customer",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp() 
          }, { merge: true });

          const roleRef = doc(db, "roles_customer", result.user.uid);
          setDocumentNonBlocking(roleRef, { id: result.user.uid }, { merge: true });
        }
      })
      .catch((error: any) => {
        setLoading(false)
        toast({ 
          variant: "destructive", 
          title: "Sign-In Interrupted", 
          description: "Could not complete Google authentication." 
        })
      })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center bg-background p-4 relative overflow-y-auto">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/30 blur-[120px] rounded-full" />
      </div>

      <div className="flex items-center gap-3 mb-8 sm:mb-12 mt-8 sm:mt-0 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-primary p-3 rounded-[1.25rem] shadow-2xl shadow-primary/30">
          <Leaf className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-headline font-black text-primary tracking-tighter">SaveBite</h1>
      </div>

      <Card className="w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border-none rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader className="text-center p-8 pb-4">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 p-1.5 rounded-2xl h-14">
              <TabsTrigger value="login" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Register</TabsTrigger>
            </TabsList>
            <CardTitle className="text-3xl font-headline font-black tracking-tighter mb-2">Rescue Surplus</CardTitle>
            <CardDescription className="text-muted-foreground font-medium italic">
              Empowering communities to reduce food waste.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-4">
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Identifier</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="hero@savebite.com" 
                      className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none shadow-inner" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none shadow-inner" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                  {!loading && <LogIn className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1">
                  <Label htmlFor="reg-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="Jane Doe" 
                    required 
                    className="h-14 rounded-2xl bg-secondary/30 border-none shadow-inner"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="jane@example.com" 
                    required 
                    className="h-14 rounded-2xl bg-secondary/30 border-none shadow-inner"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Role</Label>
                  <Select onValueChange={setRole} required>
                    <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-none shadow-inner">
                      <SelectValue placeholder="How will you help?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="customer" className="rounded-xl p-3">Market Customer</SelectItem>
                      <SelectItem value="store_owner" className="rounded-xl p-3">Store Owner</SelectItem>
                      <SelectItem value="ngo" className="rounded-xl p-3">NGO / Food Bank</SelectItem>
                      <SelectItem value="admin" className="rounded-xl p-3">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Set Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    required 
                    className="h-14 rounded-2xl bg-secondary/30 border-none shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 mt-4 active:scale-[0.98]" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Identity"}
                  {!loading && <UserPlus className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </TabsContent>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 p-8 pt-0">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-secondary" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-card px-4 text-muted-foreground">Speed Access</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full h-14 rounded-2xl border-secondary hover:bg-secondary/30 transition-all font-bold text-sm" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign In with Google
            </Button>
          </CardFooter>
        </Tabs>
      </Card>
      
      <p className="mt-8 text-[10px] text-center text-muted-foreground font-medium italic opacity-60">
        Accelerated Login Enabled &bull; Secure by SaveBite
      </p>
    </div>
  )
}
