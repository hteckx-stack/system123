'use client';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { useDoc } from '../firestore/use-doc';
import { useUser } from './use-user';
import type { Staff } from '@/lib/types';

export function useUserProfile() {
  const { user: firebaseUser, loading: authLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firebaseUser?.uid) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser?.uid]);

  const { data: profile, loading: profileLoading } = useDoc<Staff>(userDocRef as any);

  const user = useMemo(() => {
    if (!firebaseUser) return null;
    return { ...firebaseUser, profile };
  }, [firebaseUser, profile]);

  return {
    user,
    profile,
    loading: authLoading || profileLoading,
    isAdmin: profile?.role === 'admin'
  };
}