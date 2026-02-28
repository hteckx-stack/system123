
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

  // Redirect if already logged in and not currently submitting
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
      // 1. Create the Authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;

      const photoUrl = `https://picsum.photos/seed/${authUser.uid}/100/100`;

      // 2. Update Auth Profile
      await updateProfile(authUser, {
          displayName: name,
          photoURL: photoUrl
      });
      
      // 3. Prepare user data for Firestore
      const userData = {
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
      
      // 4. Create Firestore User Profile
      await updateUser(firestore, authUser.uid, userData);

      // 5. Notify admin for new staff registration
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
          console.warn("Notification error ignored for UX fluidity.");
        }
      }

      toast({
        title: "Account Created",
        description: role === 'admin' ? "Welcome to the Admin Portal!" : "Your registration is awaiting approval.",
      });

      // 6. Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setIsSubmitting(false);
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
          description = "This email address is already in use.";
      } else if (error.code === 'auth/weak-password') {
          description = "The password is too weak.";
      } else if (error.code === 'permission-denied') {
          description = "Database permissions denied.";
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
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Portal Access</h1>
            <p className="text-muted-foreground text-sm">Create an account to manage the Staff App</p>
          </div>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" placeholder="John Doe" required className="pl-10" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
               <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="admin@bluelink.com" required className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Register as</Label>
               <Select value={role} onValueChange={(val: 'admin' | 'staff') => setRole(val)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" required className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-11">
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center text-sm">
                Already have an account? <Link href="/login" className="underline font-bold">Log in</Link>
            </div>
          </form>
        </div>
      </div>
       <div className="hidden bg-muted lg:block">
         {signupImage && <Image
          src={signupImage.imageUrl}
          alt="Office"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />}
      </div>
    </div>
  );
}
