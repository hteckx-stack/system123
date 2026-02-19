'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useUser } from '../auth/use-user';

export function useCollection<T extends DocumentData>(query: Query<T> | null) {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, loading: userLoading } = useUser();

    useEffect(() => {
        // Wait until user loading is definitely finished
        if (userLoading) {
            setLoading(true);
            return;
        }

        // Do not attempt query if user is not authenticated or query is not provided
        if (!user || !query) {
            setData(null);
            setLoading(false);
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
                // If it's a permission error, use the specialized emitter
                if (error.code === 'permission-denied') {
                    // Safely attempt to extract path for better debugging
                    let path = 'unknown collection';
                    try {
                        // Accessing internal path for debugging purposes in dev
                        path = (query as any)._query?.path?.segments?.join('/') || 'unknown';
                    } catch (e) {
                        path = 'collection';
                    }

                    const permissionError = new FirestorePermissionError({
                        path: path, 
                        operation: 'list',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
                setData(null);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [query, user, userLoading]);

    return { data, loading };
}