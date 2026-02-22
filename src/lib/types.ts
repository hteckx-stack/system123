
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
  role: 'admin' | 'staff';
  status: 'pending' | 'active' | 'inactive';
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

export type LeaveRequest = {
  id: string;
  staff_id: string;
  name: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Timestamp;
};

export type CheckIn = {
  id: string;
  staff_id: string;
  staff_name: string;
  timestamp: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  location?: string;
};

export type TopicType = 'Contract' | 'Payslip' | 'Leave' | 'Announcement' | 'General';

export type Conversation = {
  id: string;
  staff_id: string;
  staff_name: string;
  topic: TopicType;
  last_message: string;
  timestamp: Timestamp;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'admin' | 'staff';
  message: string;
  timestamp: Timestamp;
};

export type ActivityLog = {
  id: string;
  action: string;
  details: string;
  user_id: string;
  user_name: string;
  timestamp: Timestamp;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'leave' | 'checkin' | 'message' | 'signup';
  read: boolean;
  createdAt: Timestamp;
};

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
};
