import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
       <Card>
        <CardHeader>
          <CardTitle>Broadcast Notices to All Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A system for creating and sending announcements to all staff via the mobile app will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
