
"use client"

import { 
    collection, 
    addDoc, 
    type Firestore, 
    serverTimestamp, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc 
} from 'firebase/firestore';
import type { TopicType } from '@/lib/types';

export async function sendMessage(
    db: Firestore, 
    conversationId: string, 
    senderId: string, 
    senderRole: 'admin' | 'staff', 
    messageText: string
) {
    // Add message
    await addDoc(collection(db, 'messages'), {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_role: senderRole,
        message: messageText,
        timestamp: serverTimestamp()
    });

    // Update conversation last message
    const convRef = doc(db, 'conversations', conversationId);
    await setDoc(convRef, {
        last_message: messageText,
        timestamp: serverTimestamp()
    }, { merge: true });
}

export async function getOrCreateConversation(
    db: Firestore, 
    staffId: string, 
    staffName: string, 
    topic: TopicType = 'General'
) {
    const q = query(
        collection(db, 'conversations'), 
        where('staff_id', '==', staffId),
        where('topic', '==', topic)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    const docRef = await addDoc(collection(db, 'conversations'), {
        staff_id: staffId,
        staff_name: staffName,
        topic: topic,
        last_message: "Conversation started",
        timestamp: serverTimestamp()
    });

    return docRef.id;
}
