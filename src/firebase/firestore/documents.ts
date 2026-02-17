import { collection, addDoc, type Firestore } from 'firebase/firestore';
import type { Document } from '@/lib/types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function addDocument(db: Firestore, documentData: Omit<Document, 'id'>) {
    const documentsCollection = collection(db, 'documents');
    addDoc(documentsCollection, documentData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: documentsCollection.path,
          operation: 'create',
          requestResourceData: documentData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}
