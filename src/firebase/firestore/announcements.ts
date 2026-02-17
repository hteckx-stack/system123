import { collection, addDoc, type Firestore, serverTimestamp } from 'firebase/firestore';
import type { Announcement } from '@/lib/types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function addAnnouncement(db: Firestore, announcementData: Omit<Announcement, 'id' | 'sentAt'>) {
    const announcementsCollection = collection(db, 'announcements');
    addDoc(announcementsCollection, { ...announcementData, sentAt: serverTimestamp() }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: announcementsCollection.path,
          operation: 'create',
          requestResourceData: announcementData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}
