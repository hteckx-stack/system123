
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Staff } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { DataTableRowActions } from "./data-table-row-actions"

export const getColumns = (onEdit: (staff: Staff) => void): ColumnDef<Staff>[] => [
  {
    id: "initials",
    header: "",
    cell: ({ row }) => (
      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-primary">
        {row.original.name.charAt(0)}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-semibold text-slate-900">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "position",
    header: "Position",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge 
          variant="outline" 
          className={`capitalize border-none font-bold text-[10px] tracking-widest px-2.5 py-0.5 ${
            status === "active" ? "bg-green-50 text-green-600" : 
            status === "pending" ? "bg-orange-50 text-orange-600" : 
            "bg-red-50 text-red-600"
          }`}
        >
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={onEdit} />,
  },
]
