import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock, Loader2, User, RefreshCw, Package } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import TopNav from "@/components/TopNav";
import OfficeSelector from "@/components/OfficeSelector";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, Patient } from "@shared/schema";

const DENTURES_DIRECT_STAFF = ['Damien', 'Caroline', 'Michael', 'Luisa'];
const TORONTO_SMILE_CENTRE_STAFF = ['Admin', 'Dr. Priyanka Chowdhury'];

export default function StaffToDo() {
  const [, setLocation] = useLocation();
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [isDark, setIsDark] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { user } = useAuth();

  const canViewAllOffices = user?.canViewAllOffices ?? false;
  const isAdmin = user?.role === 'admin' || canViewAllOffices;

  // Determine if user is from Dentures Direct or Toronto Smile Centre
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
  const staffMembers = useMemo(() => {
    const base = ['All'];
    if (isDenturesDirectUser) {
      // All Dentures Direct staff can see all staff (both offices)
      return [...base, ...DENTURES_DIRECT_STAFF, ...TORONTO_SMILE_CENTRE_STAFF];
    }
    
    if (isTorontoSmileCentreUser) {
      // Toronto Smile Centre staff can only see their own staff
      return [...base, ...TORONTO_SMILE_CENTRE_STAFF];
    }
    
    // Default: show Dentures Direct staff (for backward compatibility)
    return [...base, ...DENTURES_DIRECT_STAFF];
  }, [isDenturesDirectUser, isTorontoSmileCentreUser]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);

  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ['/api/tasks', selectedOfficeId],
    queryFn: async () => {
      const url = selectedOfficeId 
        ? `/api/tasks?officeId=${selectedOfficeId}`
        : '/api/tasks';
      const response = await apiRequest('GET', url);
      return response.json();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000, // Consider data stale after 30 seconds
    enabled: !showArchived,
  });

  const { data: archivedTasks = [], isLoading: isLoadingArchived } = useQuery<Task[]>({
    queryKey: ['/api/tasks/archived', selectedOfficeId],
    queryFn: async () => {
      const url = selectedOfficeId 
        ? `/api/tasks/archived?officeId=${selectedOfficeId}`
        : '/api/tasks/archived';
      const response = await apiRequest('GET', url);
      return response.json();
    },
    enabled: showArchived && isAdmin,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients', selectedOfficeId],
    queryFn: async () => {
      const url = selectedOfficeId 
        ? `/api/patients?officeId=${selectedOfficeId}`
        : '/api/patients';
      const response = await apiRequest('GET', url);
      return response.json();
    }
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

  // Check if a task is related to castings (specific workflow tasks only)
  const isCastingTask = useCallback((task: Task): boolean => {
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    const searchText = `${title} ${description}`;
    
    // Check for "send" + "casting/cast" (flexible matching - words can be separated)
    const hasSendAndCasting = (searchText.includes('send') || searchText.includes('mail') || searchText.includes('ship') || searchText.includes('dispatch')) &&
                              (searchText.includes('casting') || searchText.includes('cast'));
    
    // Check for specific phrases
    const specificPhrases = [
      'casting back from lab',
      'cast back from lab',
      'casting eta',
      'cast eta',
      'casting et a',
      'cast et a',
      'metal framework tryin',
      'metal framework try-in',
      'metal framework try in'
    ];
    
    const hasSpecificPhrase = specificPhrases.some(phrase => searchText.includes(phrase));
    
    return hasSendAndCasting || hasSpecificPhrase;
  }, []);

  // Sort tasks by due date (earliest first), then filter by staff
  const sortedTasks = showArchived 
    ? [...archivedTasks].sort((a, b) => {
        // Sort archived tasks by completedAt (most recent first)
        const aDate = a.completedAt || a.createdAt;
        const bDate = b.completedAt || b.createdAt;
        return bDate.getTime() - aDate.getTime();
      })
    : [...tasks].sort((a, b) => {
        // Tasks without due dates go to the end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

  // Filter tasks by selected staff member or casting filter
  // For archived tasks, don't filter by staff
  const filteredTasks = useMemo(() => {
    if (showArchived) return sortedTasks;
    
    if (selectedStaff === 'Casting Tasks') {
      // Show only casting-related tasks that are not completed
      return sortedTasks.filter(t => t.status !== 'completed' && isCastingTask(t));
    }
    
    if (selectedStaff === 'All') {
      return sortedTasks;
    }
    
    // Filter by staff member (case-insensitive matching)
    return sortedTasks.filter(t => t.assignee?.toLowerCase() === selectedStaff.toLowerCase());
  }, [sortedTasks, selectedStaff, showArchived, isCastingTask]);

  const toggleTask = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({ id, status: newStatus });
  };

  const handlePatientClick = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click if there is one
    setLocation(`/patient/${patientId}`);
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

  // Get casting tasks count
  const castingTasksCount = useMemo(() => {
    if (showArchived) return 0;
    return tasks.filter(t => t.status !== 'completed' && isCastingTask(t)).length;
  }, [tasks, showArchived, isCastingTask]);

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
          <h1 className="text-3xl font-semibold">
            {showArchived ? 'Archived Tasks' : 'Staff To-Do List'}
          </h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="gap-2"
              >
                {showArchived ? 'View Active' : 'View Archived'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => showArchived ? queryClient.invalidateQueries({ queryKey: ['/api/tasks/archived'] }) : refetch()}
              disabled={showArchived ? isLoadingArchived : isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${(showArchived ? isLoadingArchived : isLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          {canViewAllOffices && (
            <OfficeSelector
              selectedOfficeId={selectedOfficeId}
              onOfficeChange={setSelectedOfficeId}
              canViewAllOffices={canViewAllOffices}
            />
          )}
        </div>
        
        {!showArchived && (
          <div className="flex gap-2 flex-wrap">
            {/* Casting Tasks Filter Button */}
            <button
              onClick={() => setSelectedStaff('Casting Tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover-elevate active-elevate-2 ${
                selectedStaff === 'Casting Tasks' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border border-primary/20'
              }`}
              data-testid="filter-casting-tasks"
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Casting Tasks</span>
              {castingTasksCount > 0 && (
                <Badge className={`ml-1 ${selectedStaff === 'Casting Tasks' ? 'bg-background/20 text-inherit' : 'bg-primary text-primary-foreground'}`}>
                  {castingTasksCount}
                </Badge>
              )}
            </button>
            
            {/* Staff Member Filter Buttons */}
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
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {(showArchived ? isLoadingArchived : isLoading) ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 max-w-5xl">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  {showArchived 
                    ? 'No archived tasks yet' 
                    : selectedStaff === 'Casting Tasks'
                      ? 'No casting tasks to send out'
                      : `No tasks assigned to ${selectedStaff}`
                  }
                </p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const isCasting = isCastingTask(task);
                return (
                <Card 
                  key={task.id} 
                  className={`p-4 ${showArchived ? 'bg-muted/30' : task.status === 'completed' ? 'opacity-60' : ''} ${
                    isCasting && !showArchived && task.status !== 'completed' ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                  data-testid={`task-${task.id}`}
                >
                  <div className="flex items-start gap-4">
                    {!showArchived && (
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => toggleTask(task.id, task.status)}
                        className="mt-1"
                        data-testid={`checkbox-${task.id}`}
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          {task.patientId && patientMap[task.patientId] && (
                            <div 
                              className="flex items-center gap-1 text-sm text-primary font-medium mb-1 cursor-pointer hover:underline transition-all" 
                              onClick={(e) => handlePatientClick(task.patientId!, e)}
                              data-testid={`text-patient-${task.id}`}
                              title="Click to open patient chart"
                            >
                              <User className="w-3 h-3" />
                              {patientMap[task.patientId]}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className={`font-medium ${showArchived || task.status === 'completed' ? 'line-through' : ''}`}>
                              {task.title}
                            </div>
                            {isAdmin && (
                              <Badge variant="outline" className="text-xs font-medium" data-testid={`badge-assignee-${task.id}`}>
                                <Avatar className="w-3 h-3 mr-1">
                                  <AvatarFallback className="text-[8px] p-0">
                                    {task.assignee.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                Assigned: {task.assignee}
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground">
                              {task.description}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isCasting && !showArchived && task.status !== 'completed' && (
                            <Badge variant="outline" className="border-primary text-primary bg-primary/10" data-testid={`badge-casting-${task.id}`}>
                              <Package className="w-3 h-3 mr-1" />
                              Casting
                            </Badge>
                          )}
                          <Badge className={getPriorityColor(task.priority)} data-testid={`badge-priority-${task.id}`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {task.assignee.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground font-medium">Assigned to: <strong>{task.assignee}</strong></span>
                          </div>
                        )}

                        {showArchived && task.completedBy && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>Completed by: <strong>{task.completedBy}</strong></span>
                            {task.completedAt && (
                              <span>on {format(new Date(task.completedAt), 'MMM d, yyyy h:mm a')}</span>
                            )}
                          </div>
                        )}

                        {!showArchived && task.dueDate && (
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
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
