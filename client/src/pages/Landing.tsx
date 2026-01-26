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
      window.location.href = "/";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="lg:flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="max-w-md text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div className="relative">
            <img 
              src={heroImage} 
              alt="The Discombobulated Denturist" 
              className="w-64 h-64 lg:w-80 lg:h-80 object-cover rounded-3xl shadow-2xl mx-auto lg:mx-0 border-4 border-primary/20 ring-4 ring-primary/10 transition-transform hover:scale-105 duration-300"
            />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-primary/20 to-transparent pointer-events-none"></div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              The Discombobulated Denturist
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Finally, a clinical workflow assistant that understands the chaos.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">AI-Powered</span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Voice-to-Text</span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Smart Workflow</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right duration-700">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-card rounded-2xl shadow-lg border border-card-border">
              <img src={logoUrl} alt="Dentures Direct" className="h-16 mx-auto" />
            </div>
            <p className="text-base text-muted-foreground font-medium">
              Voice-powered AI for denturist practices
            </p>
          </div>

        <Card className="shadow-xl border-card-border bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center font-bold">Staff Login</CardTitle>
            <p className="text-sm text-muted-foreground text-center">Sign in to access your workspace</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@denturesdirect.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  data-testid="input-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Signing in...</span>
                    <span className="animate-spin">⏳</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Access restricted to @denturesdirect.ca staff only
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
