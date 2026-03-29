import { collection, addDoc, updateDoc, doc, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore"
import type { Firestore } from "firebase/firestore"
import type { CallRecord } from "@/lib/types"

export const createCallRecord = async (
  firestore: Firestore,
  callData: Omit<CallRecord, 'id' | 'started_at' | 'ended_at'>
) => {
  const docRef = await addDoc(collection(firestore, "calls"), {
    ...callData,
    started_at: serverTimestamp()
  })
  return docRef.id
}

export const updateCallRecord = async (
  firestore: Firestore,
  callId: string,
  updates: Partial<CallRecord>
) => {
  const callRef = doc(firestore, "calls", callId)
  await updateDoc(callRef, {
    ...updates,
    ended_at: updates.status === 'ended' ? serverTimestamp() : undefined
  })
}

export const getCallHistory = async (
  firestore: Firestore,
  conversationId: string
) => {
  const q = query(
    collection(firestore, "calls"),
    where("conversation_id", "==", conversationId),
    orderBy("started_at", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRecord))
}