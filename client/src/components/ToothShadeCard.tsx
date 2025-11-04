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
    <Card className={`p-3 ${isIncomplete && showAlert ? 'border-warning border-2 animate-pulse' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Current</div>
            <div className="text-lg font-semibold">
              {currentShade || (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Requested</div>
            <div className="text-lg font-semibold">
              {requestedShade || (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </div>
          </div>
        </div>
        {isIncomplete && showAlert && (
          <div className="flex items-center gap-1 text-warning">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
