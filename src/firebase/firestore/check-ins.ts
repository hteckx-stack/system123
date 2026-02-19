
"use client"

import { doc, updateDoc, type Firestore } from 'firebase/firestore';

export function updateCheckInStatus(db: Firestore, checkInId: string, status: 'approved' | 'rejected') {
    const checkInRef = doc(db, 'check_ins', checkInId);
    return updateDoc(checkInRef, { status });
}
