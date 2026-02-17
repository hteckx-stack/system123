'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useUser } from '../auth/use-user';

export function useCollection<T extends DocumentData>(query: Query<T> | null) {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const { loading: userLoading } = useUser();

    useEffect(() => {
        if (!query || userLoading) {
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
                let path = 'unknown collection';
                // This is a workaround to get the path from a query object, as the public API does not expose it.
                if (query && (query as any)._query?.path?.segments) {
                    path = (query as any)._query.path.segments.join('/');
                }
                const permissionError = new FirestorePermissionError({
                    path: path, 
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setLoading(false);
                setData(null);
            }
        );

        return () => unsubscribe();
    }, [query, userLoading]);

    return { data, loading };
}
