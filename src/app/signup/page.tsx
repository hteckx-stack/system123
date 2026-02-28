'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Mail, KeyRound, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { updateUser } from '@/firebase/firestore/users';
import { addNotification } from '@/firebase/firestore/notifications';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, loading } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && !isSubmitting) {
      router.push('/dashboard');
    }
  }, [user, loading, router, isSubmitting]);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;

      await updateProfile(authUser, {
          displayName: name
      });
      
      const userData = {
          name,
          email,
          role,
          status: role === 'admin' ? 'active' : 'pending' as const,
          approved: role === 'admin',
          department: "Not Assigned",
          position: role === 'admin' ? 'Administrator' : 'Not Assigned',
          phone: ""
      };
      
      await updateUser(firestore, authUser.uid, userData);

      if (role === 'staff') {
        try {
          await addNotification(firestore, {
              userId: 'admin',
              title: 'New Staff Registration',
              message: `${name} has signed up and is awaiting approval.`,
              type: 'signup',
              read: false
          });
        } catch (notifErr) {
          console.warn("Notification error ignored:", notifErr);
        }
      }

      toast({
        title: "Account Created",
        description: role === 'admin' ? "Welcome to the Admin Portal!" : "Your registration is awaiting approval.",
      });

      router.push('/dashboard');
    } catch (error: any) {
      setIsSubmitting(false);
      console.error("Signup process failed:", error);
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
          description = "This email address is already in use.";
      } else if (error.code === 'auth/weak-password') {
          description = "The password is too weak.";
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description,
      });
    }
  };

  if (loading) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="mx-auto w-full max-w-[420px] space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portal Access</h1>
              <p className="text-slate-500 text-sm mt-1">Create an account for staff management</p>
            </div>
          </div>
          <form onSubmit={handleSignUp} className="grid gap-5">
            <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input id="name" placeholder="John Doe" required className="pl-10 h-12 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
               <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input id="email" type="email" placeholder="admin@bluelink.com" required className="pl-10 h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Register as</Label>
               <Select value={role} onValueChange={(val: 'admin' | 'staff') => setRole(val)}>
                  <SelectTrigger id="role" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input id="password" type="password" required className="pl-10 h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20">
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center text-sm font-medium text-slate-500 pt-2">
                Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
