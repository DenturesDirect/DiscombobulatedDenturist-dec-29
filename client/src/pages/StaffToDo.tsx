import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock, Loader2, User, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import TopNav from "@/components/TopNav";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, Patient } from "@shared/schema";

const staffMembers = ['All', 'Damien', 'Caroline', 'Michael', 'Luisa'];

export default function StaffToDo() {
  const [, setLocation] = useLocation();
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();

  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });

  const patientMap = patients.reduce((acc, p) => {
    acc[p.id] = p.name;
    return acc;
  }, {} as Record<string, string>);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigate = (page: 'patients' | 'canvas' | 'todos') => {
    if (page === 'patients') {
      setLocation('/');
    } else if (page === 'canvas') {
      if (tasks.length > 0 && tasks[0].patientId) {
        setLocation(`/patient/${tasks[0].patientId}`);
      } else {
        setLocation('/');
      }
    }
  };

  // Sort tasks by due date (earliest first), then filter by staff
  const sortedTasks = [...tasks].sort((a, b) => {
    // Tasks without due dates go to the end
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Filter tasks by selected staff member (case-insensitive matching)
  const filteredTasks = selectedStaff === 'All' 
    ? sortedTasks 
    : sortedTasks.filter(t => t.assignee?.toLowerCase() === selectedStaff.toLowerCase());

  const toggleTask = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({ id, status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'normal': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isOverdue = (dueDate: Date | null) => dueDate && new Date(dueDate) < new Date();
  const isDueToday = (dueDate: Date | null) => {
    if (!dueDate) return false;
    const today = new Date();
    return new Date(dueDate).toDateString() === today.toDateString();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        userName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User' : 'User'}
        userRole="Denturist"
        notificationCount={3}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onSettings={() => setLocation('/settings')}
        currentPage="todos"
      />
      
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold">Staff To-Do List</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {staffMembers.map(staff => {
            const taskCount = staff === 'All' 
              ? tasks.filter(t => t.status !== 'completed').length
              : tasks.filter(t => t.assignee === staff && t.status !== 'completed').length;
            const initials = staff === 'All' ? 'All' : staff.split(' ').map(n => n[0]).join('').toUpperCase();

            return (
              <button
                key={staff}
                onClick={() => setSelectedStaff(staff)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover-elevate active-elevate-2 ${
                  selectedStaff === staff 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border'
                }`}
                data-testid={`filter-${staff.toLowerCase()}`}
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{staff}</span>
                {taskCount > 0 && (
                  <Badge className="ml-1 bg-background/20 text-inherit">
                    {taskCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 max-w-5xl">
            {filteredTasks.map(task => (
              <Card 
                key={task.id} 
                className={`p-4 ${task.status === 'completed' ? 'opacity-60' : ''}`}
                data-testid={`task-${task.id}`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => toggleTask(task.id, task.status)}
                    className="mt-1"
                    data-testid={`checkbox-${task.id}`}
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        {task.patientId && patientMap[task.patientId] && (
                          <div className="flex items-center gap-1 text-sm text-primary font-medium mb-1" data-testid={`text-patient-${task.id}`}>
                            <User className="w-3 h-3" />
                            {patientMap[task.patientId]}
                          </div>
                        )}
                        <div className={`font-medium mb-1 ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground">
                            {task.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)} data-testid={`badge-priority-${task.id}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {task.assignee.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{task.assignee}</span>
                      </div>

                      {task.dueDate && (
                        <div className={`flex items-center gap-2 ${isOverdue(task.dueDate) ? 'text-destructive font-medium' : isDueToday(task.dueDate) ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                          <Clock className="w-4 h-4" />
                          <span>
                            Due {format(new Date(task.dueDate), 'MMM d, h:mm a')}
                            {isOverdue(task.dueDate) && ' (Overdue)'}
                            {isDueToday(task.dueDate) && !isOverdue(task.dueDate) && ' (Today)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tasks assigned to {selectedStaff}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
