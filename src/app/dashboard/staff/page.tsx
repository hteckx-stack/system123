import { mockStaff } from "@/lib/placeholder-data";
import { StaffTable } from "./components/staff-table";
import { columns } from "./components/columns";
import { AddStaffDialog } from "./components/add-staff-dialog";

export default function StaffPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage all staff members in your organization.
          </p>
        </div>
        <AddStaffDialog />
      </div>
      <StaffTable columns={columns} data={mockStaff} />
    </div>
  );
}
