'use client';
import { useMemo } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    const { app, auth, firestore, storage } = useMemo(() => initializeFirebase(), []);

    return (
        <FirebaseProvider app={app} auth={auth} firestore={firestore} storage={storage}>
            {children}
        </FirebaseProvider>
    );
}
