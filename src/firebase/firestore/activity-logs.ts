
"use client"

import { collection, addDoc, type Firestore, serverTimestamp } from 'firebase/firestore';

export function logActivity(db: Firestore, userId: string, userName: string, action: string, details: string) {
    const logsCollection = collection(db, 'activity_logs');
    return addDoc(logsCollection, {
        action,
        details,
        user_id: userId,
        user_name: userName,
        timestamp: serverTimestamp()
    });
}
