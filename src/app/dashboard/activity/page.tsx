import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  UserPlus,
  UserCheck,
  Megaphone,
  KeyRound,
  ShieldAlert,
  FileWarning,
  Receipt,
} from "lucide-react"

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

export default function ActivityPage() {
  const contractCount = mockActivities.filter(a => a.action === 'DOC_UPLOAD' && a.details.includes('Contract')).length;
  const payslipCount = mockActivities.filter(a => a.action === 'DOC_UPLOAD' && a.details.includes('Payslip')).length;
  const warningCount = mockActivities.filter(a => a.action === 'DOC_UPLOAD' && a.details.includes('Warning Letter')).length;
  const announcementCount = mockActivities.filter(a => a.action === 'ANNOUNCE_SEND').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">
          A log of important actions performed by administrators.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contracts Sent</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{contractCount}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payslips Issued</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{payslipCount}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warning Letters</CardTitle>
                <FileWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{warningCount}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{announcementCount}</div>
            </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight">Recent Activities</h2>

      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const { icon: Icon, title, badge } = getActionMetaData(
            activity.action
          )
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
                        {title}
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
          )
        })}
      </div>
    </div>
  )
}
