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
        if (userLoading) {
            setLoading(true);
            return;
        }

        if (!user || !ref) {
            setData(null);
            setLoading(false);
            return;
        }

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
    }, [ref, user, userLoading]);

    return { data, loading };
}
