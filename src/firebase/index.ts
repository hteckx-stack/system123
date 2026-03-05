
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type Storage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
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

  // Set the debug token before any App Check initialization
  if (typeof window !== 'undefined') {
    const debugToken = 'AB7D027F-F89C-44CB-A54A-04825C64BF94';
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const database = getDatabase(app);

  if (typeof window !== 'undefined') {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LcVm94qAAAAAK6v7v_Vf_X8n7zP_V_V_V_V_V_V'),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.warn("App Check initialization failed:", e);
    }
  }

  firebaseCache = {
    app,
    auth,
    firestore,
    storage,
    database,
  };

  return firebaseCache;
}
