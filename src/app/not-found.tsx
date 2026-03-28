
"use client"

import Link from "next/link"
import { Leaf, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-8 animate-bounce">
        <div className="bg-primary p-6 rounded-[2rem] shadow-2xl shadow-primary/20">
          <Leaf className="h-20 w-20 text-white" />
        </div>
      </div>
      <h1 className="text-9xl font-black text-primary/10 absolute -z-10 select-none">404</h1>
      <div className="space-y-4 relative z-10">
        <h2 className="text-5xl font-headline font-black tracking-tighter">Page Not Found</h2>
        <p className="text-xl text-muted-foreground font-medium italic max-w-md mx-auto">
          "The resource you're looking for has been rescued or doesn't exist."
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-12">
        <Button asChild variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] border-primary/20 hover:bg-primary/5">
          <Link href="javascript:history.back()">
            <ArrowLeft className="mr-3 h-5 w-5" />
            Go Back
          </Link>
        </Button>
        <Button asChild className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-primary shadow-xl shadow-primary/20">
          <Link href="/">
            <Home className="mr-3 h-5 w-5" />
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
