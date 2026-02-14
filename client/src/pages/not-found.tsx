import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
      <Card className="w-full max-w-md mx-4 shadow-xl border-card-border bg-card/95 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div className="inline-block p-4 bg-destructive/10 rounded-full">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">404 Page Not Found</h1>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            <Button
              onClick={() => setLocation('/')}
              className="shadow-md hover:shadow-lg transition-all"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
