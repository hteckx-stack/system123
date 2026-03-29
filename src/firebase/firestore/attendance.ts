"use client"

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  type Firestore
} from "firebase/firestore"
import type { AttendanceRecord, Staff } from "@/lib/types"

export const recordDailyAttendance = async (
  firestore: Firestore,
  staffId: string,
  staffName: string,
  date: string // YYYY-MM-DD format
) => {
  // Check if already checked in today
  const existingQuery = query(
    collection(firestore, "attendance"),
    where("staff_id", "==", staffId),
    where("date", "==", date)
  )

  const existingDocs = await getDocs(existingQuery)
  if (!existingDocs.empty) {
    throw new Error("Already checked in for today")
  }

  const docRef = await addDoc(collection(firestore, "attendance"), {
    staff_id: staffId,
    staff_name: staffName,
    date: date,
    check_in_time: Timestamp.now(),
    status: "present"
  })

  return docRef.id
}

export const getMonthlyAttendance = async (
  firestore: Firestore,
  year: number,
  month: number // 1-12
) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  const q = query(
    collection(firestore, "attendance"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc"),
    orderBy("check_in_time", "desc")
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AttendanceRecord))
}

export const getStaffAttendanceForMonth = async (
  firestore: Firestore,
  staffId: string,
  year: number,
  month: number
) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  const q = query(
    collection(firestore, "attendance"),
    where("staff_id", "==", staffId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AttendanceRecord))
}

export const getAttendanceStats = async (
  firestore: Firestore,
  year: number,
  month: number,
  allStaff: Staff[]
) => {
  const monthlyAttendance = await getMonthlyAttendance(firestore, year, month)

  // Group by staff
  const staffAttendanceMap = new Map<string, AttendanceRecord[]>()
  monthlyAttendance.forEach(record => {
    if (!staffAttendanceMap.has(record.staff_id)) {
      staffAttendanceMap.set(record.staff_id, [])
    }
    staffAttendanceMap.get(record.staff_id)!.push(record)
  })

  // Calculate stats
  const presentStaffIds = Array.from(staffAttendanceMap.keys())
  const absentStaff = allStaff.filter(staff => !presentStaffIds.includes(staff.id))

  const totalWorkingDays = new Date(year, month, 0).getDate()
  const attendees = presentStaffIds.map(staffId => {
    const staff = allStaff.find(s => s.id === staffId)
    const attendanceDays = staffAttendanceMap.get(staffId)?.length || 0
    return {
      staff: staff!,
      daysPresent: attendanceDays,
      attendanceRate: (attendanceDays / totalWorkingDays) * 100
    }
  })

  // Calculate overall statistics
  const totalPresentDays = attendees.reduce((sum, attendee) => sum + attendee.daysPresent, 0)
  const totalPossibleDays = allStaff.length * totalWorkingDays

  return {
    totalWorkingDays,
    totalPresent: presentStaffIds.length, // Number of staff who checked in at least once
    totalAbsent: absentStaff.length,
    totalPresentDays, // Total check-in days across all staff
    totalPossibleDays, // Total possible check-in days
    overallAttendanceRate: totalPossibleDays > 0 ? (totalPresentDays / totalPossibleDays) * 100 : 0,
    attendees,
    absentees: absentStaff
  }
}