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
        // If auth state is still loading, wait.
        if (userLoading) {
            setLoading(true);
            return;
        }

        // If no user or no query, stop.
        if (!user || !query) {
            setData(null);
            setLoading(false);
            return;
        }
        
        setLoading(true);

        let unsubscribe: (() => void) | undefined;

        // Increased delay to 500ms to ensure the backend has fully registered the auth state
        // before the first request is sent. This prevents permission race conditions.
        const timeoutId = setTimeout(() => {
            unsubscribe = onSnapshot(query, 
                (snapshot) => {
                    const result: T[] = [];
                    snapshot.forEach((doc) => {
                        result.push({ id: doc.id, ...doc.data() } as T);
                    });
                    setData(result);
                    setLoading(false);
                }, 
                (error) => {
                    if (error.code === 'permission-denied') {
                        let path = 'collection';
                        try {
                            const internalQuery = (query as any)._query;
                            if (internalQuery && internalQuery.path) {
                                path = internalQuery.path.segments.join('/');
                            }
                        } catch (e) {
                            path = 'unknown';
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
        }, 500); 

        return () => {
            clearTimeout(timeoutId);
            if (unsubscribe) unsubscribe();
        };
    }, [query, user, userLoading]);

    return { data, loading };
}