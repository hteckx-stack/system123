"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

export default function ActivityTypePage() {

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/activity" passHref>
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Details</h1>
          <p className="text-muted-foreground">
            This feature is under construction.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-10 text-center">
          <p className="text-muted-foreground">
            Detailed activity logs will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
