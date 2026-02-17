"use client"

import { useState } from "react";
import { mockStaff } from "@/lib/placeholder-data";
import { StaffTable } from "./components/staff-table";
import { getColumns } from "./components/columns";
import { AddStaffDialog } from "./components/add-staff-dialog";
import { EditStaffDialog } from "./components/edit-staff-dialog";
import type { Staff } from "@/lib/types";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>(mockStaff);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const handleAddStaff = (newStaffData: Omit<Staff, 'id' | 'status' | 'photoUrl'>) => {
    const newStaff: Staff = {
      ...newStaffData,
      id: `STF-${Math.random().toString(36).slice(2, 7)}`,
      status: 'active',
      photoUrl: `https://picsum.photos/seed/${Math.random()}/100/100`
    };
    setStaffList(prevStaff => [...prevStaff, newStaff]);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    setStaffList(staffList.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    setEditingStaff(null);
  };
  
  const columns = getColumns(handleEdit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage all staff members in your organization.
          </p>
        </div>
        <AddStaffDialog onAddStaff={handleAddStaff} />
      </div>
      <StaffTable columns={columns} data={staffList} />
      <EditStaffDialog
        staff={editingStaff}
        onUpdateStaff={handleUpdateStaff}
        open={!!editingStaff}
        onOpenChange={(open) => {
          if (!open) {
            setEditingStaff(null);
          }
        }}
      />
    </div>
  );
}
