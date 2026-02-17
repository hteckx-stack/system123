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
        if (!query || userLoading) {
            // If there's no query or the user is still loading, we just wait.
            // The loading state remains true.
            return;
        }

        if (!user) {
            // The user has finished loading, and they are not logged in.
            // We can stop loading and show no data.
            setLoading(false);
            setData(null);
            return;
        }
        
        // At this point, we have a query and an authenticated user.
        // The loading state is still true from its initial value.

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
                setData(null);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [query, userLoading, user]);

    return { data, loading };
}
