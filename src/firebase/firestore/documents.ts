"use client"

import { collection, addDoc, type Firestore } from 'firebase/firestore';
import type { Document } from '@/lib/types';

export function addDocument(db: Firestore, documentData: Omit<Document, 'id'>) {
    const documentsCollection = collection(db, 'documents');
    return addDoc(documentsCollection, documentData);
}
