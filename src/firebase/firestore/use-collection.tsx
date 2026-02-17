'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T extends DocumentData>(query: Query<T> | null) {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) {
            setLoading(false);
            setData(null);
            return;
        }
        
        setLoading(true);

        const unsubscribe = onSnapshot(query, 
            (snapshot) => {
                const result: T[] = [];
                snapshot.forEach((doc) => {
                    result.push({ id: doc.id, ...doc.data() } as T);
                });
                setData(result);
                setLoading(false);
            }, 
            (error) => {
                const permissionError = new FirestorePermissionError({
                    path: 'unknown collection', 
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                console.error("Firestore error:", error);
                setLoading(false);
                setData(null);
            }
        );

        return () => unsubscribe();
    }, [query]);

    return { data, loading };
}
