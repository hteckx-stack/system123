
'use client';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Database } from 'firebase/database';
import { createContext, useContext } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  database: Database;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

type FirebaseProviderProps = {
    children: React.ReactNode;
} & FirebaseContextValue;

export function FirebaseProvider({ children, app, auth, firestore, storage, database }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore, storage, database }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  return context.app;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useAuth must be used within a FirebaseProvider');
  return context.auth;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirestore must be used within a FirebaseProvider');
  return context.firestore;
};

export const useStorage = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useStorage must be used within a FirebaseProvider');
    return context.storage;
};

export const useDatabase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useDatabase must be used within a FirebaseProvider');
  return context.database;
};

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};
