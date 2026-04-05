import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bus } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Bus className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold mt-2 text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Please check the URL or navigate back to the dashboard.
          </p>
        </div>
        <Link href="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
