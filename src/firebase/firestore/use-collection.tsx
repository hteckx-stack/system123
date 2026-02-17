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
        // We are loading until the user is definitively authenticated or not.
        if (userLoading) {
            setLoading(true);
            return;
        }

        // If there's no user or no query, we're not fetching data.
        if (!user || !query) {
            setData(null);
            setLoading(false);
            return;
        }
        
        setLoading(true); // Start loading while we fetch
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
                let path = 'unknown collection';
                if (query && (query as any)._query?.path?.segments) {
                    path = (query as any)._query.path.segments.join('/');
                }
                const permissionError = new FirestorePermissionError({
                    path: path, 
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setData(null);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [query, user, userLoading]);

    return { data, loading };
}
