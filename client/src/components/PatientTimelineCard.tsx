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
  upperDentureType?: string | null;
  lowerDentureType?: string | null;
  currentStep: string;
  lastAction: string;
  nextStep: string;
  assignees: string[];
  eta?: Date;
  isActive?: boolean;
  onClick?: () => void;
}

export default function PatientTimelineCard({
  id,
  name,
  photoUrl,
  date,
  upperDentureType,
  lowerDentureType,
  currentStep,
  lastAction,
  nextStep,
  assignees,
  eta,
  isActive,
  onClick
}: PatientTimelineCardProps) {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA';
  };

  // Color mapping for denture types
  const getDentureTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('complete')) return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200';
    if (typeLower.includes('cast')) return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200';
    if (typeLower.includes('acrylic')) return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200';
    if (typeLower.includes('repair')) return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200';
    if (typeLower.includes('reline')) return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-200';
    if (typeLower.includes('rebase')) return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900 dark:text-pink-200';
    if (typeLower.includes('implant')) return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200';
    return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
  };

  return (
    <Card
      className={`p-5 cursor-pointer hover-elevate active-elevate-2 transition-all shadow-md hover:shadow-lg border-card-border bg-card/95 backdrop-blur-sm ${isActive ? 'border-l-4 border-l-primary shadow-lg' : ''}`}
      onClick={onClick}
      data-testid={`card-patient-timeline-${id}`}
    >
      <div className="flex items-center gap-4 w-full flex-nowrap">
        <PatientAvatar name={name} photoUrl={photoUrl} className="w-10 h-10 flex-shrink-0" />

        <div className="flex-shrink-0 w-[180px]">
          <div className="font-medium text-sm mb-1" data-testid={`text-name-${id}`}>{name}</div>
          <div className="text-xs text-muted-foreground mb-2">{format(date, 'MMM d')}</div>
          {(upperDentureType || lowerDentureType) && (
            <div className="flex flex-col gap-1">
              {upperDentureType && (
                <Badge 
                  variant="outline" 
                  className={`text-xs w-fit border ${getDentureTypeColor(upperDentureType)}`}
                  data-testid={`badge-upper-denture-${id}`}
                >
                  Upper: {upperDentureType}
                </Badge>
              )}
              {lowerDentureType && (
                <Badge 
                  variant="outline" 
                  className={`text-xs w-fit border ${getDentureTypeColor(lowerDentureType)}`}
                  data-testid={`badge-lower-denture-${id}`}
                >
                  Lower: {lowerDentureType}
                </Badge>
              )}
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex-1 min-w-[150px]">
          <div className="text-xs text-muted-foreground mb-1">Current Step</div>
          <div className="text-sm font-medium text-primary" data-testid={`text-current-step-${id}`}>{currentStep}</div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex-1 min-w-[180px]">
          <div className="text-xs text-muted-foreground mb-1">Last Action</div>
          <div className="text-sm text-foreground" data-testid={`text-last-action-${id}`}>{lastAction}</div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex-1 min-w-[150px]">
          <div className="text-xs text-muted-foreground mb-1">Next Step</div>
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400" data-testid={`text-next-step-${id}`}>{nextStep}</div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex items-center gap-2 flex-shrink-0 w-[160px]">
          {assignees.length === 0 ? (
            <>
              <Avatar className="w-8 h-8 cursor-pointer hover-elevate border-2 border-muted" data-testid={`avatar-assignee-${id}`}>
                <AvatarFallback className="text-xs bg-muted">NA</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Assigned</div>
                <div className="text-sm font-medium text-muted-foreground">Unassigned</div>
              </div>
            </>
          ) : assignees.length === 1 ? (
            <>
              <Avatar className="w-8 h-8 cursor-pointer hover-elevate border-2 border-primary/20" data-testid={`avatar-assignee-${id}`}>
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(assignees[0])}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Assigned</div>
                <div className="text-sm font-medium text-primary">{assignees[0]}</div>
              </div>
            </>
          ) : (
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1.5">Assigned</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {assignees.slice(0, 3).map((assignee, idx) => (
                  <Avatar key={idx} className="w-7 h-7 cursor-pointer hover-elevate border-2 border-primary/20" data-testid={`avatar-assignee-${id}-${idx}`}>
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(assignee)}</AvatarFallback>
                  </Avatar>
                ))}
                {assignees.length > 3 && (
                  <span className="text-xs font-medium text-primary ml-1">+{assignees.length - 3}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {assignees.slice(0, 3).join(', ')}{assignees.length > 3 ? ` +${assignees.length - 3} more` : ''}
              </div>
            </div>
          )}
        </div>

        {eta && (
          <div className="min-w-[100px] max-w-[120px]">
            <div className="text-xs text-muted-foreground mb-1">ETA</div>
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">{format(eta, 'MMM d')}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
