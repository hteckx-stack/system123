"use client"

import { collection, addDoc, doc, setDoc, deleteDoc, type Firestore } from 'firebase/firestore';
import type { Staff } from '@/lib/types';

export function addUser(db: Firestore, staffData: Omit<Staff, 'id'>) {
    const usersCollection = collection(db, 'users');
    return addDoc(usersCollection, staffData);
}

export function updateUser(db: Firestore, staffId: string, staffData: Partial<Staff>) {
    const userDocRef = doc(db, 'users', staffId);
    return setDoc(userDocRef, staffData, { merge: true });
}

export function deleteUser(db: Firestore, staffId: string) {
    const userDocRef = doc(db, 'users', staffId);
    return deleteDoc(userDocRef);
}
