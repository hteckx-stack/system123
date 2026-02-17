import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

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

export type Announcement = {
  id: string;
  title: string;
  message: string;
  recipientIds: string[];
  recipientCount: number;
  sentAt: Timestamp;
};

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
};
