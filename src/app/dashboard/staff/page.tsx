"use client"

import { useState } from "react";
import { mockStaff } from "@/lib/placeholder-data";
import { AddStaffDialog } from "./components/add-staff-dialog";
import { EditStaffDialog } from "./components/edit-staff-dialog";
import type { Staff } from "@/lib/types";
import { StaffCard } from "./components/staff-card";

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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {staffList.map((staff) => (
          <StaffCard key={staff.id} staff={staff} onEdit={handleEdit} />
        ))}
        {staffList.length === 0 && (
          <div className="col-span-full rounded-lg border-2 border-dashed border-muted-foreground/30 py-12 text-center">
            <h3 className="text-lg font-medium text-muted-foreground">No staff members found</h3>
            <p className="text-sm text-muted-foreground">Add a new staff member to get started.</p>
          </div>
        )}
      </div>

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
