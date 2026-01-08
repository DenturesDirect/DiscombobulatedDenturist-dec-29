import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface TaskFormProps {
  patientId: string;
  patientName: string;
  onSubmit: (task: {
    title: string;
    description?: string;
    assignee: string;
    priority: "high" | "normal" | "low";
    dueDate?: Date;
  }) => Promise<void>;
  disabled?: boolean;
}

const DENTURES_DIRECT_STAFF = ["Damien", "Caroline", "Michael", "Luisa"];
const TORONTO_SMILE_CENTRE_STAFF = ["Admin", "Dr. Priyanka Chowdhury"];

export default function TaskForm({ patientId, patientName, onSubmit, disabled }: TaskFormProps) {
  const { user } = useAuth();
  const canViewAllOffices = user?.canViewAllOffices ?? false;

  // Determine user's office from email domain
  const isDenturesDirectUser = useMemo(() => {
    const email = user?.email?.toLowerCase() || '';
    return email.includes('denturesdirect');
  }, [user?.email]);

  const isTorontoSmileCentreUser = useMemo(() => {
    const email = user?.email?.toLowerCase() || '';
    return email.includes('torontosmile');
  }, [user?.email]);

  // Filter staff members based on office
  // Dentures Direct staff can see all staff, Toronto Smile Centre staff can only see their own
  const STAFF_MEMBERS = useMemo(() => {
    if (isDenturesDirectUser) {
      // All Dentures Direct staff can see all staff (both offices)
      return [...DENTURES_DIRECT_STAFF, ...TORONTO_SMILE_CENTRE_STAFF];
    }
    
    if (isTorontoSmileCentreUser) {
      // Toronto Smile Centre staff can only see their own staff
      return TORONTO_SMILE_CENTRE_STAFF;
    }
    
    // Default: show Dentures Direct staff (for backward compatibility)
    return DENTURES_DIRECT_STAFF;
  }, [isDenturesDirectUser, isTorontoSmileCentreUser]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string>("");
  const [priority, setPriority] = useState<"high" | "normal" | "low">("normal");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    if (!assignee) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      assignee,
      priority,
      dueDate: dueDate || undefined,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setAssignee("");
    setPriority("normal");
    setDueDate(undefined);
  };

  const isValid = title.trim() && assignee;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="task-title" className="text-sm font-medium mb-2 block">
          Task Title *
        </Label>
        <Input
          id="task-title"
          placeholder="e.g., Schedule follow-up appointment"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled}
          className="h-10"
        />
      </div>

      <div>
        <Label htmlFor="task-description" className="text-sm font-medium mb-2 block">
          Description (optional)
        </Label>
        <Textarea
          id="task-description"
          placeholder="Add any additional details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
          className="min-h-[80px] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="task-assignee" className="text-sm font-medium mb-2 block">
            Assign To *
          </Label>
          <Select value={assignee} onValueChange={setAssignee} disabled={disabled}>
            <SelectTrigger id="task-assignee" className="h-10">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {STAFF_MEMBERS.map((staff) => (
                <SelectItem key={staff} value={staff}>
                  {staff}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="task-priority" className="text-sm font-medium mb-2 block">
            Priority *
          </Label>
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as "high" | "normal" | "low")}
            disabled={disabled}
          >
            <SelectTrigger id="task-priority" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Due Date (optional)</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-10",
                !dueDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : "No date selected"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                setDueDate(date);
                setIsCalendarOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="text-xs text-muted-foreground">
        Patient: <span className="font-medium">{patientName}</span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid || disabled}
        className="w-full h-10"
      >
        <Send className="w-4 h-4 mr-2" />
        Create Task
      </Button>
    </div>
  );
}






