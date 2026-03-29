"use client"

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from "firebase/firestore"
import type { Firestore } from "firebase/firestore"
import type { Duty } from "@/lib/types"

export const createDuty = async (
  firestore: Firestore,
  staffId: string,
  staffName: string,
  title: string,
  description: string,
  documentUrl?: string,
  documentFileName?: string,
  documentType?: string,
  comments?: string
) => {
  const docRef = await addDoc(collection(firestore, "duties"), {
    staff_id: staffId,
    staff_name: staffName,
    title,
    description,
    documentUrl: documentUrl || null,
    documentFileName: documentFileName || null,
    documentType: documentType || null,
    comments: comments || null,
    created_at: serverTimestamp()
  })
  return docRef.id
}

export const updateDuty = async (
  firestore: Firestore,
  dutyId: string,
  updates: Partial<Duty>
) => {
  // Duties are immutable history forms - no updates allowed
  throw new Error("Duties are immutable history records and cannot be edited after creation")
}

export const deleteDuty = async (firestore: Firestore, dutyId: string) => {
  const dutyRef = doc(firestore, "duties", dutyId)
  await deleteDoc(dutyRef)
}

export const getDutiesByStaff = async (
  firestore: Firestore,
  staffId: string
) => {
  const q = query(
    collection(firestore, "duties"),
    where("staff_id", "==", staffId),
    orderBy("created_at", "desc")
  )

  try {
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Duty))
  } catch (error) {
    console.error("getDutiesByStaff query failed", error)
    throw new Error(
      "Failed to load duties. Ensure Firestore index exists for staff_id + created_at." 
    )
  }
}

export const subscribeToDutiesByStaff = (
  firestore: Firestore,
  staffId: string,
  callback: (duties: Duty[]) => void
) => {
  const q = query(
    collection(firestore, "duties"),
    where("staff_id", "==", staffId),
    orderBy("created_at", "desc")
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const duties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Duty))
      callback(duties)
    },
    (error) => {
      console.error("Duties snapshot listener error:", error)
      // Optionally: surface to UI toast / notification in your app
      // e.g. toast.error(error.message)
    }
  )

  return unsubscribe
}
