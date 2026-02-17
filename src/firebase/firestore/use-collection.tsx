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
        let unsubscribe: () => void = () => {};

        if (userLoading) {
            setLoading(true);
        } else if (!user || !query) {
            setData(null);
            setLoading(false);
        } else {
            // This block only runs if !userLoading && user && query
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
        }

        // Cleanup subscription on unmount or when dependencies change.
        return () => unsubscribe();
    }, [query, user, userLoading]);

    return { data, loading };
}
