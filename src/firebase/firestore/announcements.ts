"use client"

import { collection, addDoc, type Firestore, serverTimestamp } from 'firebase/firestore';
import type { Announcement } from '@/lib/types';

export function addAnnouncement(db: Firestore, announcementData: Omit<Announcement, 'id' | 'sentAt'>) {
    const announcementsCollection = collection(db, 'announcements');
    return addDoc(announcementsCollection, { ...announcementData, sentAt: serverTimestamp() });
}
