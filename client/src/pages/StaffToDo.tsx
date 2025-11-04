import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import TopNav from "@/components/TopNav";

interface Task {
  id: string;
  title: string;
  patientName: string;
  assignedTo: string;
  dueDate: Date;
  priority: 'high' | 'normal' | 'low';
  completed: boolean;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Send CDCP estimate',
    patientName: 'Sarah Johnson',
    assignedTo: 'Caroline',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    priority: 'high',
    completed: false
  },
  {
    id: '2',
    title: 'Create treatment plan',
    patientName: 'Sarah Johnson',
    assignedTo: 'Damien',
    dueDate: new Date(),
    priority: 'high',
    completed: false
  },
  {
    id: '3',
    title: 'Make bite block',
    patientName: 'Michael Chen',
    assignedTo: 'Michael',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    priority: 'normal',
    completed: false
  },
  {
    id: '4',
    title: 'Import scans',
    patientName: 'Emily Rodriguez',
    assignedTo: 'Luisa',
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
    priority: 'high',
    completed: false
  },
  {
    id: '5',
    title: 'Process denture setup',
    patientName: 'David Thompson',
    assignedTo: 'Michael',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    priority: 'normal',
    completed: true
  },
];

const staffMembers = ['All', 'Damien', 'Caroline', 'Michael', 'Luisa'];

export default function StaffToDo() {
  const [, setLocation] = useLocation();
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [tasks, setTasks] = useState(mockTasks);
  const [isDark, setIsDark] = useState(false);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleNavigate = (page: 'dashboard' | 'todos') => {
    if (page === 'dashboard') {
      setLocation('/');
    }
  };

  const filteredTasks = selectedStaff === 'All' 
    ? tasks 
    : tasks.filter(t => t.assignedTo === selectedStaff);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'normal': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
    }
  };

  const isOverdue = (dueDate: Date) => dueDate < new Date();
  const isDueToday = (dueDate: Date) => {
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        userName="Damien"
        userRole="Denturist"
        notificationCount={3}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onLogout={() => console.log('Logout')}
        onNavigate={handleNavigate}
        currentPage="todos"
      />
      
      <div className="p-6 border-b">
        <h1 className="text-3xl font-semibold mb-4">Staff To-Do List</h1>
        
        <div className="flex gap-2 flex-wrap">
          {staffMembers.map(staff => {
            const taskCount = staff === 'All' 
              ? tasks.filter(t => !t.completed).length
              : tasks.filter(t => t.assignedTo === staff && !t.completed).length;
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
        <div className="space-y-3 max-w-5xl">
          {filteredTasks.map(task => (
            <Card 
              key={task.id} 
              className={`p-4 ${task.completed ? 'opacity-60' : ''}`}
              data-testid={`task-${task.id}`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                  data-testid={`checkbox-${task.id}`}
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className={`font-medium mb-1 ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Patient: {task.patientName}
                      </div>
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
                          {task.assignedTo.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">{task.assignedTo}</span>
                    </div>

                    <div className={`flex items-center gap-2 ${isOverdue(task.dueDate) ? 'text-destructive font-medium' : isDueToday(task.dueDate) ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        Due {format(task.dueDate, 'MMM d, h:mm a')}
                        {isOverdue(task.dueDate) && ' (Overdue)'}
                        {isDueToday(task.dueDate) && !isOverdue(task.dueDate) && ' (Today)'}
                      </span>
                    </div>
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
      </div>
    </div>
  );
}
