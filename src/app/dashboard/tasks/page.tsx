import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Assign and Track Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The task assignment and tracking system will be available here. Admins will be able to create tasks, assign them to staff members, set due dates, and monitor progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
