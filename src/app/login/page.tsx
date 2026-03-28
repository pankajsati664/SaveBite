"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Leaf, LogIn, Mail, Lock, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<string>("")
  
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) return
    setLoading(true)
    
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        toast({ title: "Welcome back!", description: "Successfully logged in." })
      })
      .catch((error: any) => {
        setLoading(false)
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: error.message 
        })
      })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !db || !role) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a role." })
      return
    }
    setLoading(true)
    
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const userId = userCredential.user.uid
        
        // Create user profile
        const userRef = doc(db, "users", userId)
        setDoc(userRef, {
          id: userId,
          email,
          name,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: { id: userId, email, name, role }
          }))
        })

        // Create role marker
        const roleRef = doc(db, `roles_${role}`, userId)
        setDoc(roleRef, { id: userId }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: roleRef.path,
            operation: 'create',
            requestResourceData: { id: userId }
          }))
        })

        toast({ title: "Account created", description: "Your SaveBite account is ready." })
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
    if (!auth) return
    const provider = new GoogleAuthProvider()
    signInWithPopup(auth, provider)
      .then(async (result) => {
        if (db && result.user) {
          // For Google users, initialize a default profile and role if not existing
          const userRef = doc(db, "users", result.user.uid);
          setDoc(userRef, {
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || "Google User",
            role: "customer", // Default role for social sign-in
            updatedAt: serverTimestamp(),
            // Only set createdAt if it's potentially a new user
            createdAt: serverTimestamp() 
          }, { merge: true });

          const roleRef = doc(db, "roles_customer", result.user.uid);
          setDoc(roleRef, { id: result.user.uid }, { merge: true });
          
          toast({ title: "Welcome to SaveBite!", description: "Successfully logged in via Google." });
        }
      })
      .catch((error: any) => {
        toast({ 
          variant: "destructive", 
          title: "Google Sign-In Failed", 
          description: error.message 
        })
      })
  }

  if (isUserLoading) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-primary p-2 rounded-xl">
          <Leaf className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-foreground">SaveBite</h1>
      </div>

      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader className="text-center">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <CardTitle className="text-2xl">Manage Food Waste</CardTitle>
            <CardDescription>
              Join SaveBite to track expiry dates and save food.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="pl-10" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      className="pl-10" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Authenticating..." : "Sign In"}
                  {!loading && <LogIn className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="John Doe" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select onValueChange={setRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="store_owner">Store Owner</SelectItem>
                      <SelectItem value="ngo">NGO Representative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                  {!loading && <UserPlus className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </TabsContent>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t pt-6">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to SaveBite's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  )
}