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
        // Don't run query if no ref, user is loading, or user is not logged in.
        if (!ref || userLoading || !user) {
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);

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
                setLoading(false);
                setData(null);
            }
        );

        return () => unsubscribe();
    }, [ref, userLoading, user]);

    return { data, loading };
}
