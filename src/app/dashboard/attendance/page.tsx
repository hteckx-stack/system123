"use client"

import { useState, useEffect, useMemo } from "react"
import { useLocalStorage, useLocalUser, useLocalCollection } from '@/lib/local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, CheckCircle2, XCircle, Users, UserCheck, UserX } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import {
  recordDailyAttendance,
  getMonthlyAttendance,
  getAttendanceStats
} from "@/lib/local-attendance"
import type { Staff, AttendanceRecord } from "@/lib/types"

export default function AttendancePage() {
  const storage = useLocalStorage();
  const { user } = useLocalUser();
  const { toast } = useToast()

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [attendanceStats, setAttendanceStats] = useState<any>(null)
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Get all staff
  const { data: allStaff } = useLocalCollection<Staff>('users');

  // Load attendance data when month/year changes
  useEffect(() => {
    if (!allStaff) return

    const loadAttendanceData = async () => {
      setLoading(true)
      try {
        const [stats, records] = await Promise.all([
          getAttendanceStats(selectedYear, selectedMonth, allStaff!),
          getMonthlyAttendance(selectedYear, selectedMonth)
        ])
        setAttendanceStats(stats)
        setMonthlyRecords(records)
      } catch (error) {
        console.error("Error loading attendance data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAttendanceData()
  }, [selectedYear, selectedMonth, allStaff])

  const handleDailyCheckIn = async () => {
    if (!user) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const currentUser = allStaff?.find(staff => staff.id === user.id)

    // Allow both staff and admin to check in (admins might need to track their attendance too)
    if (!currentUser && user.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You must be a registered staff member or admin to check in."
      })
      return
    }

    // Check if already checked in today
    const todayRecord = monthlyRecords.find(
      record => record.staff_id === user.id && record.date === today
    )

    if (todayRecord) {
      toast({
        title: "Already Checked In",
        description: "You have already checked in for today."
      })
      return
    }

    setIsCheckingIn(true)
    try {
      const staffName = currentUser?.name || user.displayName || user.email || 'Unknown'
      await recordDailyAttendance(user.id, staffName, today)
      toast({
        title: "Check-In Successful",
        description: "Your attendance has been recorded for today."
      })

      // Reload data
      const [stats, records] = await Promise.all([
        getAttendanceStats(selectedYear, selectedMonth, allStaff!),
        getMonthlyAttendance(selectedYear, selectedMonth)
      ])
      setAttendanceStats(stats)
      setMonthlyRecords(records)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Check-In Failed",
        description: error.message || "Could not record attendance."
      })
    } finally {
      setIsCheckingIn(false)
    }
  }

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Attendance Register</h1>
        <p className="text-[#6B7280]">Daily check-in system with monthly attendance reports.</p>
      </div>

      {/* Daily Check-In */}
      <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-green-600 text-white py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl">Daily Check-In</CardTitle>
              <CardDescription className="text-white/70">
                Mark yourself as present for today
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">
                Today's Date: <span className="font-bold">{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
              </p>
            </div>
            <Button
              onClick={handleDailyCheckIn}
              disabled={isCheckingIn}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCheckingIn ? "Checking In..." : "Check In Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Report */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Month/Year Selector */}
        <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Select Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Monthly Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-6 bg-slate-100 rounded animate-pulse" />
                <div className="h-6 bg-slate-100 rounded animate-pulse" />
                <div className="h-6 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : attendanceStats ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Working Days</span>
                  <Badge variant="outline" className="font-bold">
                    {attendanceStats.totalWorkingDays}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    Staff Present
                  </span>
                  <Badge className="bg-green-50 text-green-700 font-bold">
                    {attendanceStats.totalPresent}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-600" />
                    Staff Absent
                  </span>
                  <Badge variant="destructive" className="font-bold">
                    {attendanceStats.totalAbsent}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Overall Rate</span>
                  <Badge variant="outline" className="font-bold">
                    {attendanceStats.overallAttendanceRate.toFixed(1)}%
                  </Badge>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <UserCheck className="h-4 w-4 mr-2" />
              View Attendees
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <UserX className="h-4 w-4 mr-2" />
              View Absentees
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Attendance Records</CardTitle>
          <CardDescription>
            Daily check-ins for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="h-12">
                <TableHead className="font-bold text-slate-700">Staff Member</TableHead>
                <TableHead className="font-bold text-slate-700">Date</TableHead>
                <TableHead className="font-bold text-slate-700">Check-in Time</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-slate-100 rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : monthlyRecords.length > 0 ? (
                monthlyRecords.map((record) => (
                  <TableRow key={record.id} className="h-12">
                    <TableCell className="font-medium">{record.staff_name}</TableCell>
                    <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{record.check_in_time?.toDate().toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-50 text-green-700 font-bold">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Present
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No attendance records found for this period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attendees and Absentees Lists */}
      {attendanceStats && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attendees */}
          <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Attendees ({attendanceStats.attendees.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attendanceStats.attendees.map((attendee: any) => (
                <div key={attendee.staff.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">{attendee.staff.name}</p>
                    <p className="text-sm text-green-600">{attendee.staff.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-800">{attendee.daysPresent} days</p>
                    <p className="text-sm text-green-600">{attendee.attendanceRate.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Absentees */}
          <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-600" />
                Absentees ({attendanceStats.absentees.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attendanceStats.absentees.map((absentee: Staff) => (
                <div key={absentee.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">{absentee.name}</p>
                    <p className="text-sm text-red-600">{absentee.position}</p>
                  </div>
                  <Badge variant="destructive" className="font-bold">
                    Absent
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}