import { Button } from "@/components/ui/button";
import logoUrl from "@assets/DenturesDirect Logo Design_1762294635743.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <img src={logoUrl} alt="Dentures Direct" className="h-32 mx-auto" />
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Clinical Workflow Assistant</h1>
          <p className="text-lg text-muted-foreground">
            Voice-powered AI for denturist practices. Transform your spoken notes into professional clinical documentation.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            size="lg" 
            className="w-full max-w-sm"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Log In to Continue
          </Button>
          <p className="text-sm text-muted-foreground">
            Sign in with Google, GitHub, or email to access patient records
          </p>
        </div>
      </div>
    </div>
  );
}
