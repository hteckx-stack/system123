import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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
        details: "Uploaded 'contract-am.pdf' for Arthur Morgan",
        timestamp: "2023-11-15 09:45 AM",
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

const getActionBadge = (action: string) => {
    switch (action) {
      case "STAFF_CREATE":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">Staff Create</Badge>
      case "STAFF_UPDATE":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">Staff Update</Badge>
      case "DOC_UPLOAD":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">Document Upload</Badge>
      case "ANNOUNCE_SEND":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">Announcement</Badge>
      case "AUTH_RESET":
        return <Badge variant="destructive">Password Reset</Badge>
      default:
        return <Badge>{action}</Badge>
    }
}

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            A log of important actions performed by administrators.
          </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Actions</CardTitle>
          <CardDescription>
            This log tracks staff creation, document uploads, password resets, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[180px]">Performed By</TableHead>
                <TableHead className="w-[180px]">Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{getActionBadge(activity.action)}</TableCell>
                  <TableCell className="font-medium">{activity.details}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.userAvatar} alt={activity.user} />
                        <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{activity.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>{activity.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
