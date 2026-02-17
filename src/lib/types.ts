import type { LucideIcon } from "lucide-react";

export type Staff = {
  id: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  department: string;
  photoUrl: string;
  status: 'active' | 'inactive';
};

export type Document = {
  id: string;
  staffName: string;
  staffId: string;
  type: string;
  fileName: string;
  date: string;
};

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
};
