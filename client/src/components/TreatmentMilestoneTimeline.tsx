import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Milestone {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  assignedTo?: string;
  completedBy?: string;
  completedAt?: Date;
  dueDate?: Date;
}

interface TreatmentMilestoneTimelineProps {
  milestones: Milestone[];
}

export default function TreatmentMilestoneTimeline({ milestones }: TreatmentMilestoneTimelineProps) {
  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-warning" />;
      default:
        return <Circle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Milestone['status']) => {
    const styles = {
      completed: 'bg-success text-success-foreground',
      'in-progress': 'bg-warning text-warning-foreground',
      pending: 'bg-muted text-muted-foreground'
    };
    return <Badge className={`${styles[status]} text-xs`}>{status.replace('-', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="relative pl-8">
          {index < milestones.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
          )}
          
          <div className="absolute left-0 top-0">
            {getStatusIcon(milestone.status)}
          </div>

          <Card className="p-4" data-testid={`card-milestone-${milestone.id}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="font-medium mb-1" data-testid={`text-milestone-name-${milestone.id}`}>
                  {milestone.name}
                </div>
                {milestone.completedBy && milestone.completedAt && (
                  <div className="text-xs text-muted-foreground">
                    Completed by {milestone.completedBy} • {formatDistanceToNow(milestone.completedAt, { addSuffix: true })}
                  </div>
                )}
                {milestone.assignedTo && milestone.status !== 'completed' && (
                  <div className="text-xs text-muted-foreground">
                    Assigned to {milestone.assignedTo}
                  </div>
                )}
              </div>
              {getStatusBadge(milestone.status)}
            </div>

            {milestone.assignedTo && milestone.status !== 'completed' && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {milestone.assignedTo.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{milestone.assignedTo}</span>
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
