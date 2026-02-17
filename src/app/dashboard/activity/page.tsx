import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
       <Card>
        <CardHeader>
          <CardTitle>Track Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will display a log of important actions performed by administrators, such as staff creation, password resets, and document uploads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
