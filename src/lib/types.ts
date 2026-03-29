
import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

export type Staff = {
  id: string;
  name: string;
  phone: string;
  email: string;
  nrc: string;
  position: string;
  department: string;
  role: 'admin' | 'staff';
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  approved: boolean;
  rejectionReason?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  staff_id: string;
  staff_name: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Timestamp;
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
  recipientIds?: string[];
  recipientCount?: number;
  sentAt: Timestamp;
  date?: string; // RTDB format
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
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  location?: string;
  dateStr?: string; // used for path mapping
  comment?: string;
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
  attachments?: MessageAttachment[];
};

export type MessageAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Timestamp;
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

export type AttendanceRecord = {
  id: string;
  staff_id: string;
  staff_name: string;
  date: string;
  check_in_time: Timestamp;
  status: string;
};

export type Duty = {
  id: string;
  staff_id: string;
  staff_name: string;
  title: string;
  description: string;
  documentUrl?: string | null;
  documentFileName?: string | null;
  documentType?: string | null;
  comments?: string | null;
  created_at: Timestamp;
};

export type CallRecord = {
  id: string;
  conversation_id: string;
  caller_id: string;
  caller_name: string;
  caller_role: 'admin' | 'staff';
  receiver_id: string;
  receiver_name: string;
  receiver_role: 'admin' | 'staff';
  status: 'initiated' | 'ongoing' | 'ended';
  started_at: Timestamp;
  ended_at?: Timestamp;
  duration?: number;
};

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
};
