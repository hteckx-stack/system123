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

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
};
