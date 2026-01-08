import { Badge } from "@/components/ui/badge";
import type { Patient } from "@shared/schema";

interface PatientStatusCardProps {
  patient: Patient;
}

export default function PatientStatusCard({ patient }: PatientStatusCardProps) {
  const formatPredeterminationStatus = (status: string | null) => {
    if (!status) return "Not set";
    switch (status) {
      case "not applicable":
        return "Not Applicable";
      case "pending":
        return "Pre-D Pending";
      case "approved":
        return "Pre-D Approved";
      case "not approved":
        return "Pre-D Not Approved";
      case "predeterminate":
        return "Predeterminate";
      case "predescent":
        return "Predescent";
      default:
        return status;
    }
  };

  const formatPaymentStatus = (status: string | null) => {
    if (!status) return "Not set";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPredeterminationBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";
    switch (status) {
      case "pending":
        return "default";
      case "approved":
        return "default";
      case "not approved":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPaymentBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";
    switch (status) {
      case "yes":
        return "default";
      case "no":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex items-center gap-3 flex-nowrap shrink-0">
      <div className="flex items-center gap-1.5 flex-nowrap">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Pre-D:</span>
        <Badge 
          variant={getPredeterminationBadgeVariant(patient.predeterminationStatus)} 
          className="text-xs whitespace-nowrap"
          data-testid="badge-predetermination-status"
        >
          {formatPredeterminationStatus(patient.predeterminationStatus)}
        </Badge>
      </div>
      
      <div className="h-4 w-px bg-border flex-shrink-0"></div>
      
      <div className="flex items-center gap-2 flex-nowrap">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Payment:</span>
        <div className="flex items-center gap-2 flex-nowrap">
          <div className="flex items-center gap-1 flex-nowrap">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Exam</span>
            <Badge 
              variant={getPaymentBadgeVariant(patient.examPaid)} 
              className="text-xs px-1.5 py-0 whitespace-nowrap"
              data-testid="badge-exam-paid"
            >
              {formatPaymentStatus(patient.examPaid)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-nowrap">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Repair</span>
            <Badge 
              variant={getPaymentBadgeVariant(patient.repairPaid)} 
              className="text-xs px-1.5 py-0 whitespace-nowrap"
              data-testid="badge-repair-paid"
            >
              {formatPaymentStatus(patient.repairPaid)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-nowrap">
            <span className="text-xs text-muted-foreground whitespace-nowrap">New Denture</span>
            <Badge 
              variant={getPaymentBadgeVariant(patient.newDenturePaid)} 
              className="text-xs px-1.5 py-0 whitespace-nowrap"
              data-testid="badge-new-denture-paid"
            >
              {formatPaymentStatus(patient.newDenturePaid)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}