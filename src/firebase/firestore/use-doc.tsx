'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useUser } from '../auth/use-user';

export function useDoc<T extends DocumentData>(ref: DocumentReference<T> | null) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, loading: userLoading } = useUser();

    useEffect(() => {
        if (!ref || userLoading) {
            // If there's no ref or the user is still loading, just wait.
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

        // At this point, we have a ref and an authenticated user.
        // The loading state is still true from its initial value.

        const unsubscribe = onSnapshot(ref, 
            (doc) => {
                if (doc.exists()) {
                    setData({ id: doc.id, ...doc.data() } as T);
                } else {
                    setData(null);
                }
                setLoading(false);
            },
            (error) => {
                const permissionError = new FirestorePermissionError({
                    path: ref.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                setData(null);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [ref, userLoading, user]);

    return { data, loading };
}
