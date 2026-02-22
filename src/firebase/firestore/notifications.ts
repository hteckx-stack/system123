
"use client"

import { collection, addDoc, type Firestore, serverTimestamp } from 'firebase/firestore';
import type { Notification } from '@/lib/types';

export function addNotification(db: Firestore, notification: Omit<Notification, 'id' | 'createdAt'>) {
    const notificationsCollection = collection(db, 'notifications');
    return addDoc(notificationsCollection, {
        ...notification,
        createdAt: serverTimestamp(),
    });
}
