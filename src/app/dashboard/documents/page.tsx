import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
       <Card>
        <CardHeader>
          <CardTitle>Upload and Manage Staff Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will allow admins to upload, view, and manage documents for each staff member. Files will be securely stored using Firebase Storage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
