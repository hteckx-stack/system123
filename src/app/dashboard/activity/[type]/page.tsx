"use client"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  UserPlus,
  UserCheck,
  Megaphone,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const mockActivities = [
  {
    id: "ACT-001",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "STAFF_CREATE",
    details: "Added new staff member: John Marston",
    timestamp: "2023-11-15 10:00 AM",
  },
  {
    id: "ACT-002",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "DOC_UPLOAD",
    details: "Uploaded 'contract-am.pdf' (Contract) for Arthur Morgan",
    timestamp: "2023-11-15 09:45 AM",
  },
  {
    id: "ACT-006",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "DOC_UPLOAD",
    details: "Uploaded 'payslip-ev.pdf' (Payslip) for Eleanor Vance",
    timestamp: "2023-11-15 09:40 AM",
  },
  {
    id: "ACT-007",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "DOC_UPLOAD",
    details: "Uploaded 'warning-mh.pdf' (Warning Letter) for Marcus Holloway",
    timestamp: "2023-11-15 09:35 AM",
  },
  {
    id: "ACT-003",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "ANNOUNCE_SEND",
    details: "Sent announcement: 'Team-wide meeting next week'",
    timestamp: "2023-11-14 02:30 PM",
  },
  {
    id: "ACT-008",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "ANNOUNCE_SEND",
    details: "Sent announcement: 'Holiday schedule update'",
    timestamp: "2023-11-14 10:00 AM",
  },
  {
    id: "ACT-004",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "STAFF_UPDATE",
    details: "Updated profile for Eleanor Vance",
    timestamp: "2023-11-14 11:10 AM",
  },
  {
    id: "ACT-005",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "AUTH_RESET",
    details: "Sent password reset for Marcus Holloway",
    timestamp: "2023-11-13 04:00 PM",
  },
]

const actionMeta: {
  [key: string]: {
    icon: React.ElementType
    badge: JSX.Element
    title: string
  }
} = {
  STAFF_CREATE: {
    icon: UserPlus,
    badge: (
      <Badge
        variant="secondary"
        className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
      >
        Staff Create
      </Badge>
    ),
    title: "New Staff Member Added",
  },
  STAFF_UPDATE: {
    icon: UserCheck,
    badge: (
      <Badge
        variant="secondary"
        className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
      >
        Staff Update
      </Badge>
    ),
    title: "Staff Profile Updated",
  },
  DOC_UPLOAD: {
    icon: FileText,
    badge: (
      <Badge
        variant="secondary"
        className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200"
      >
        Document Upload
      </Badge>
    ),
    title: "Document Uploaded",
  },
  ANNOUNCE_SEND: {
    icon: Megaphone,
    badge: (
      <Badge
        variant="secondary"
        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
      >
        Announcement
      </Badge>
    ),
    title: "Announcement Sent",
  },
  AUTH_RESET: {
    icon: KeyRound,
    badge: <Badge variant="destructive">Password Reset</Badge>,
    title: "Password Reset Initiated",
  },
}

const getActionMetaData = (action: string) => {
  return (
    actionMeta[action] || {
      icon: ShieldAlert,
      badge: <Badge>{action}</Badge>,
      title: "System Action",
    }
  )
}

const filterConfig: { [key: string]: { title: string; filter: (a: typeof mockActivities[0]) => boolean } } = {
  contracts: {
    title: "Contracts Sent",
    filter: (a) => a.action === 'DOC_UPLOAD' && a.details.includes('Contract')
  },
  payslips: {
    title: "Payslips Issued",
    filter: (a) => a.action === 'DOC_UPLOAD' && a.details.includes('Payslip')
  },
  warnings: {
    title: "Warning Letters",
    filter: (a) => a.action === 'DOC_UPLOAD' && a.details.includes('Warning Letter')
  },
  announcements: {
    title: "Announcements Sent",
    filter: (a) => a.action === 'ANNOUNCE_SEND'
  }
};

type Activity = typeof mockActivities[0];

export default function ActivityTypePage() {
  const params = useParams();
  const type = params.type as string;

  if (!type || !filterConfig[type]) {
      return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Invalid Activity Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The activity type you are looking for does not exist.</p>
                    <Link href="/dashboard/activity" className="mt-4 inline-block">
                        <Button>Go Back to Activities</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      )
  }

  const { title, filter } = filterConfig[type];
  const filteredActivities = mockActivities.filter(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/activity" passHref>
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            A log of all activities related to &quot;{title.toLowerCase()}&quot;.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => {
            const { icon: Icon, title: actionTitle, badge } = getActionMetaData(
              activity.action
            );
            return (
              <Card key={activity.id}>
                <CardHeader className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">
                          {actionTitle}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.details}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="flex items-center justify-between p-4 pt-0">
                  {badge}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={activity.userAvatar}
                        alt={activity.user}
                      />
                      <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {activity.user}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">
                No activities found for this category.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
