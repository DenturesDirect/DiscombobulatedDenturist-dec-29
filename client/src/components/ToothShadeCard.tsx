import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface ToothShadeCardProps {
  currentShade?: string;
  requestedShade?: string;
  showAlert?: boolean;
}

export default function ToothShadeCard({ currentShade, requestedShade, showAlert }: ToothShadeCardProps) {
  const isIncomplete = !currentShade || !requestedShade;

  return (
    <Card className={`p-4 ${isIncomplete && showAlert ? 'border-warning border-2 animate-pulse' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Current Shade</div>
            <div className="text-2xl font-bold">
              {currentShade || (
                <span className="text-muted-foreground text-lg">Not recorded</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Requested Shade</div>
            <div className="text-2xl font-bold">
              {requestedShade || (
                <span className="text-muted-foreground text-lg">Not recorded</span>
              )}
            </div>
          </div>
        </div>
        {isIncomplete && showAlert && (
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Missing</span>
          </div>
        )}
      </div>
    </Card>
  );
}
