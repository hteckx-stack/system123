
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
        // If auth state is still loading, wait.
        if (userLoading) {
            setLoading(true);
            return;
        }

        // If no user or no ref, stop.
        if (!user || !ref) {
            setData(null);
            setLoading(false);
            return;
        }
        
        setLoading(true);

        let unsubscribe: (() => void) | undefined;

        // Increased delay to 500ms to ensure the backend has fully registered the auth state
        // before the first request is sent. This prevents permission race conditions.
        const timeoutId = setTimeout(() => {
            unsubscribe = onSnapshot(ref, 
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
        }, 500); 

        return () => {
            clearTimeout(timeoutId);
            if (unsubscribe) unsubscribe();
        };
    }, [ref, user, userLoading]);

    return { data, loading };
}
