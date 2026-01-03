import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientAvatar } from "./PatientAvatar";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

interface PatientTimelineCardProps {
  id: string;
  name: string;
  photoUrl?: string | null;
  date: Date;
  dentureType?: string | null;
  currentStep: string;
  lastAction: string;
  nextStep: string;
  assignee: string;
  eta?: Date;
  isActive?: boolean;
  officeName?: string | null;
  onClick?: () => void;
}

export default function PatientTimelineCard({
  id,
  name,
  photoUrl,
  date,
  dentureType,
  currentStep,
  lastAction,
  nextStep,
  assignee,
  eta,
  isActive,
  officeName,
  onClick
}: PatientTimelineCardProps) {
  const assigneeInitials = assignee?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA';

  return (
    <Card
      className={`p-3 cursor-pointer hover-elevate active-elevate-2 transition-all ${isActive ? 'border-l-4 border-l-primary' : ''}`}
      onClick={onClick}
      data-testid={`card-patient-timeline-${id}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <PatientAvatar name={name} photoUrl={photoUrl} className="w-9 h-9 flex-shrink-0" />

        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium text-sm" data-testid={`text-name-${id}`}>{name}</div>
            {officeName && (
              <Badge variant="secondary" className="text-xs" data-testid={`badge-office-${id}`}>
                {officeName}
              </Badge>
            )}
            {dentureType && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-denture-type-${id}`}>
                {dentureType}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{format(date, 'MMM d')}</div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex-1 min-w-[120px]">
          <div className="text-xs text-muted-foreground mb-0.5">Current Step</div>
          <div className="text-sm font-medium" data-testid={`text-current-step-${id}`}>{currentStep}</div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex-1 min-w-[120px]">
          <div className="text-xs text-muted-foreground mb-0.5">Last Action</div>
          <div className="text-sm" data-testid={`text-last-action-${id}`}>{lastAction}</div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex-1 min-w-[120px]">
          <div className="text-xs text-muted-foreground mb-0.5">Next Step</div>
          <div className="text-sm font-medium" data-testid={`text-next-step-${id}`}>{nextStep}</div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex items-center gap-2 min-w-[100px]">
          <Avatar className="w-7 h-7 cursor-pointer hover-elevate" data-testid={`avatar-assignee-${id}`}>
            <AvatarFallback className="text-xs">{assigneeInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Assigned</div>
            <div className="text-sm font-medium">{assignee}</div>
          </div>
        </div>

        {eta && (
          <div className="min-w-[90px]">
            <div className="text-xs text-muted-foreground mb-0.5">ETA</div>
            <div className="text-sm font-medium">{format(eta, 'MMM d')}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
