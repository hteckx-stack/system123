
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Mail, KeyRound, ShieldCheck, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from "@/lib/placeholder-images";
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
  
  const signupImage = PlaceHolderImages.find(p => p.id === 'login-splash');

  // Prevent automatic redirect on auth state change during signup process
  // We want to handle redirection manually after Firestore write is complete
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

      const photoUrl = `https://picsum.photos/seed/${authUser.uid}/100/100`;

      // Update Auth Profile
      await updateProfile(authUser, {
          displayName: name,
          photoURL: photoUrl
      });
      
      const newStaffData = {
          name,
          email,
          role,
          status: role === 'admin' ? 'active' : 'pending' as const,
          approved: role === 'admin',
          photoUrl,
          department: "Not Assigned",
          position: role === 'admin' ? 'Administrator' : 'Not Assigned',
          phone: ""
      };
      
      // Update Firestore User Profile - CRITICAL: must wait for this
      await updateUser(firestore, authUser.uid, newStaffData);

      if (role === 'staff') {
        await addNotification(firestore, {
            userId: 'admin',
            title: 'New Staff Registration',
            message: `${name} has signed up and is awaiting approval.`,
            type: 'signup',
            read: false
        });
      }

      toast({
        title: "Account Created",
        description: role === 'admin' ? "Welcome, Admin!" : "Your account is pending approval from an administrator.",
      });

      // Manual redirect after successful setup
      router.push('/dashboard');
    } catch (error: any) {
      setIsSubmitting(false);
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
          description = "This email address is already in use.";
      } else if (error.code === 'auth/weak-password') {
          description = "The password is too weak. Please use at least 6 characters."
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
        <div className="flex flex-col items-center gap-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse-subtle text-primary">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" />
            <path d="M12.5 12.5H17v-1h-4.5V7H11v5.5H7v1h4V17h1.5v-4.5z" fill="currentColor" />
          </svg>
          <p className="text-lg font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
      )
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="mb-4 flex justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" />
                    <path d="M12.5 12.5H17v-1h-4.5V7H11v5.5H7v1h4V17h1.5v-4.5z" fill="currentColor" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-balance text-muted-foreground">Create an account to get started</p>
          </div>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" placeholder="John Doe" required className="pl-10 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
               <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="name@example.com" required className="pl-10 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Register as</Label>
               <Select value={role} onValueChange={(val: 'admin' | 'staff') => setRole(val)}>
                  <SelectTrigger id="role" className="w-full rounded-xl">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Admin</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Staff</span>
                        </div>
                    </SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" required className="pl-10 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 bg-[#0D47A1] font-bold">
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
            <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">Log in</Link>
            </div>
          </form>
        </div>
      </div>
       <div className="hidden bg-muted lg:block">
         {signupImage && <Image
          src={signupImage.imageUrl}
          alt="Image"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
          data-ai-hint={signupImage.imageHint}
        />}
      </div>
    </div>
  );
}
