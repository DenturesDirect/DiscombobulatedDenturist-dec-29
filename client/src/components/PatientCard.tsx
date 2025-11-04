import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface PatientCardProps {
  id: string;
  name: string;
  lastVisit: Date;
  status: 'active' | 'pending' | 'completed';
  isActive?: boolean;
  onClick?: () => void;
}

export default function PatientCard({ id, name, lastVisit, status, isActive, onClick }: PatientCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const statusColors = {
    active: 'bg-primary text-primary-foreground',
    pending: 'bg-warning text-warning-foreground',
    completed: 'bg-success text-success-foreground'
  };

  return (
    <Card 
      className={`p-3 cursor-pointer transition-all hover-elevate active-elevate-2 ${isActive ? 'border-l-4 border-l-primary' : ''}`}
      onClick={onClick}
      data-testid={`card-patient-${id}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate" data-testid={`text-patient-name-${id}`}>{name}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(lastVisit, { addSuffix: true })}
          </div>
        </div>
        <Badge className={`${statusColors[status]} text-xs px-2 py-0.5`} data-testid={`badge-status-${id}`}>
          {status}
        </Badge>
      </div>
    </Card>
  );
}
