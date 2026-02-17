import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The activity feed is not yet connected to a live data source.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="py-20 text-center">
            <p className="text-muted-foreground">
              Check back later for a full audit log of all admin activities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
