
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

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  if (typeof window !== 'undefined') {
    // Set the App Check Debug Token provided by the user.
    // This allows the client to bypass standard reCAPTCHA verification in development.
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 'AB7D027F-F89C-44CB-A54A-04825C64BF94';

    // Initialize App Check. Even with a debug token, a provider must be initialized.
    // Standard reCAPTCHA v3 uses ReCaptchaV3Provider.
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LcO_...placeholder_site_key...'),
      isTokenAutoRefreshEnabled: true
    });
  }

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
