import { collection, addDoc, doc, setDoc, deleteDoc, type Firestore } from 'firebase/firestore';
import type { Staff } from '@/lib/types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function addUser(db: Firestore, staffData: Omit<Staff, 'id'>) {
    const usersCollection = collection(db, 'users');
    addDoc(usersCollection, staffData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: usersCollection.path,
          operation: 'create',
          requestResourceData: staffData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export function updateUser(db: Firestore, staffId: string, staffData: Partial<Staff>) {
    const userDocRef = doc(db, 'users', staffId);
    setDoc(userDocRef, staffData, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: staffData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export function deleteUser(db: Firestore, staffId: string) {
    const userDocRef = doc(db, 'users', staffId);
    deleteDoc(userDocRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}
