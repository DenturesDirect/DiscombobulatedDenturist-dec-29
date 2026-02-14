import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoUrl from "@assets/dentureflow-pro-logo.png";

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
          <div className="rounded-3xl border border-primary/20 bg-black/90 p-6 shadow-2xl ring-4 ring-primary/10">
            <img 
              src={logoUrl}
              alt="DentureFlow Pro 2.0"
              className="w-full max-w-md h-auto object-contain mx-auto lg:mx-0 transition-transform hover:scale-[1.02] duration-300"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              DentureFlow Pro 2.0
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Voice-powered AI workflow software for modern denturist practices.
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
            <div className="inline-block px-4 py-3 bg-black rounded-2xl shadow-lg border border-card-border">
              <img src={logoUrl} alt="DentureFlow Pro 2.0" className="h-24 w-auto object-contain mx-auto" />
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
                  placeholder="you@yourclinic.com"
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
                  Access restricted to authorized clinic staff
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
