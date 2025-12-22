import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoUrl from "@assets/DenturesDirect Logo Design_1762294635743.png";
import heroImage from "@assets/4dbde174-cea7-4870-9e8b-e390986a9b22-md_1766378992180.jpeg";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('POST', '/api/auth/login', { email, password });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div className="lg:flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-md text-center lg:text-left space-y-6">
          <img 
            src={heroImage} 
            alt="The Discombobulated Denturist" 
            className="w-64 h-64 lg:w-80 lg:h-80 object-cover rounded-2xl shadow-2xl mx-auto lg:mx-0 border-4 border-background"
          />
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">The Discombobulated Denturist</h1>
            <p className="text-lg text-muted-foreground">
              Finally, a clinical workflow assistant that understands the chaos.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <img src={logoUrl} alt="Dentures Direct" className="h-16 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Voice-powered AI for denturist practices
            </p>
          </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Staff Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@denturesdirect.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Access restricted to @denturesdirect.ca staff only
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
