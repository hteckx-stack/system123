"use client"

import { useLocalStorage } from '@/lib/local-storage';
import type { AttendanceRecord, Staff } from '@/lib/types';

export const recordDailyAttendance = async (
  staffId: string,
  staffName: string,
  date: string // YYYY-MM-DD format
) => {
  const storage = useLocalStorage();

  // Check if already checked in today
  const existingRecords = await storage.getCollection<AttendanceRecord>('attendance');
  const existingRecord = existingRecords.find(
    record => record.staff_id === staffId && record.date === date
  );

  if (existingRecord) {
    throw new Error("Already checked in for today");
  }

  return storage.addDocument('attendance', {
    staff_id: staffId,
    staff_name: staffName,
    date: date,
    check_in_time: new Date(),
    status: 'present'
  });
}

export const getMonthlyAttendance = async (
  year: number,
  month: number // 1-12
) => {
  const storage = useLocalStorage();
  const records = await storage.getCollection<AttendanceRecord>('attendance');

  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

  return records
    .filter(record => record.date >= startDate && record.date <= endDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.check_in_time instanceof Date ? b.check_in_time.getTime() : b.check_in_time.toDate().getTime()) - (a.check_in_time instanceof Date ? a.check_in_time.getTime() : a.check_in_time.toDate().getTime()));
}

export const getStaffAttendanceForMonth = async (
  staffId: string,
  year: number,
  month: number
) => {
  const monthlyRecords = await getMonthlyAttendance(year, month);
  return monthlyRecords.filter(record => record.staff_id === staffId);
}

export const getAttendanceStats = async (
  year: number,
  month: number,
  allStaff: Staff[]
) => {
  const monthlyAttendance = await getMonthlyAttendance(year, month);

  // Group by staff
  const staffAttendanceMap = new Map<string, AttendanceRecord[]>();
  monthlyAttendance.forEach(record => {
    if (!staffAttendanceMap.has(record.staff_id)) {
      staffAttendanceMap.set(record.staff_id, []);
    }
    staffAttendanceMap.get(record.staff_id)!.push(record);
  });

  // Calculate stats
  const presentStaffIds = Array.from(staffAttendanceMap.keys());
  const absentStaff = allStaff.filter(staff => !presentStaffIds.includes(staff.id));

  const totalWorkingDays = new Date(year, month, 0).getDate();
  const attendees = presentStaffIds.map(staffId => {
    const staff = allStaff.find(s => s.id === staffId);
    const attendanceDays = staffAttendanceMap.get(staffId)?.length || 0;
    return {
      staff: staff!,
      daysPresent: attendanceDays,
      attendanceRate: (attendanceDays / totalWorkingDays) * 100
    };
  });

  // Calculate overall statistics
  const totalPresentDays = attendees.reduce((sum, attendee) => sum + attendee.daysPresent, 0);
  const totalPossibleDays = allStaff.length * totalWorkingDays;

  return {
    totalWorkingDays,
    totalPresent: presentStaffIds.length, // Number of staff who checked in at least once
    totalAbsent: absentStaff.length,
    totalPresentDays, // Total check-in days across all staff
    totalPossibleDays, // Total possible check-in days
    overallAttendanceRate: totalPossibleDays > 0 ? (totalPresentDays / totalPossibleDays) * 100 : 0,
    attendees,
    absentees: absentStaff
  };
}