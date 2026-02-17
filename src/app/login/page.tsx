'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { AtSign, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real app, you'd handle Firebase authentication here
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  fill="currentColor"
                />
                <path
                  d="M12.5 12.5H17v-1h-4.5V7H11v5.5H7v1h4V17h1.5v-4.5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold">
              BlueLink Admin Portal
            </CardTitle>
            <CardDescription>
              Please sign in to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    className="pl-10"
                    defaultValue="admin@bluelink.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    className="pl-10"
                    defaultValue="password123"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full text-lg">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
