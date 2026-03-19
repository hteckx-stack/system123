'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type Storage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './config';

export { FirebaseProvider, useFirebaseApp, useAuth, useFirestore, useFirebase, useStorage, useDatabase } from './provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { FirebaseClientProvider } from './client-provider';

export type FirebaseInstances = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: Storage;
  database: Database;
};

let firebaseCache: FirebaseInstances;

export function initializeFirebase(): FirebaseInstances {
  if (firebaseCache) {
    return firebaseCache;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const database = getDatabase(app);

  firebaseCache = {
    app,
    auth,
    firestore,
    storage,
    database,
  };

  return firebaseCache;
}
