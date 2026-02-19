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
        // Wait until user loading is definitely finished
        if (userLoading) {
            setLoading(true);
            return;
        }

        // Do not attempt document fetch if user is not authenticated or ref is missing
        if (!user || !ref) {
            setData(null);
            setLoading(false);
            return;
        }
        
        setLoading(true);

        // Small delay to ensure the backend has fully registered the auth state
        // before the first request is sent. This prevents permission race conditions.
        const timeoutId = setTimeout(() => {
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
                    if (error.code === 'permission-denied') {
                        const permissionError = new FirestorePermissionError({
                            path: ref.path,
                            operation: 'get',
                        });
                        errorEmitter.emit('permission-error', permissionError);
                    }
                    setData(null);
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        }, 50);

        return () => clearTimeout(timeoutId);
    }, [ref, user, userLoading]);

    return { data, loading };
}