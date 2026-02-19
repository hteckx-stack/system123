
"use client"

import { doc, updateDoc, type Firestore } from 'firebase/firestore';

export function updateLeaveRequestStatus(db: Firestore, requestId: string, status: 'approved' | 'rejected') {
    const requestRef = doc(db, 'leave_requests', requestId);
    return updateDoc(requestRef, { status });
}
