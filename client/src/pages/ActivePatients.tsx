import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import TopNav from "@/components/TopNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, ArrowUpDown, Calendar, User, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PatientTimelineCard from "@/components/PatientTimelineCard";
import NewPatientDialog from "@/components/NewPatientDialog";
import OfficeSelector from "@/components/OfficeSelector";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient, Task } from "@shared/schema";

const STORAGE_KEY = 'activePatients_selectedOfficeId';

export default function ActivePatients() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'alphabetical' | 'lastAppointment' | 'treatmentInitiation'>('alphabetical');
  const [isDark, setIsDark] = useState(false);
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false);
  const { user } = useAuth();
  const canViewAllOffices = user?.canViewAllOffices ?? false;

  // Load persisted office selection from localStorage
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || null;
    }
    return null;
  });

  // Persist office selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedOfficeId !== null) {
      localStorage.setItem(STORAGE_KEY, selectedOfficeId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedOfficeId]);

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients', selectedOfficeId],
    queryFn: async () => {
      const url = selectedOfficeId 
        ? `/api/patients?officeId=${selectedOfficeId}`
        : '/api/patients';
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });

  // Fetch all tasks to get assignees for each patient
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks', selectedOfficeId],
    queryFn: async () => {
      const url = selectedOfficeId 
        ? `/api/tasks?officeId=${selectedOfficeId}`
        : '/api/tasks';
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  // Fetch appointments to get last appointment dates
  const { data: appointments = [] } = useQuery<Array<{ patientId: string; appointmentDate: Date }>>({
    queryKey: ['/api/appointments', selectedOfficeId],
    queryFn: async () => {
      try {
        const url = selectedOfficeId 
          ? `/api/appointments?officeId=${selectedOfficeId}`
          : '/api/appointments';
        const response = await apiRequest('GET', url);
        return response.json();
      } catch {
        // If appointments endpoint doesn't exist yet, return empty array
        return [];
      }
    },
  });

  // Create a map of patientId -> unique assignees from pending tasks
  const patientAssigneesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    
    if (!tasks || tasks.length === 0) {
      return map;
    }
    
    // Filter tasks that have a patientId and are pending (not completed)
    const pendingTasksWithPatients = tasks.filter(task => {
      // Must have both patientId and assignee
      if (!task.patientId || !task.assignee) {
        return false;
      }
      
      // Check if task is completed (case-insensitive)
      const status = (task.status || '').toLowerCase().trim();
      // Include all tasks that are not explicitly completed
      return status !== 'completed';
    });
    
    // Build the map of patientId -> unique assignees
    pendingTasksWithPatients.forEach(task => {
      if (task.patientId && task.assignee) {
        const patientId = String(task.patientId).trim();
        const assignee = String(task.assignee).trim();
        const existing = map.get(patientId) || [];
        // Only add if assignee name is not already in the list
        if (!existing.includes(assignee)) {
          map.set(patientId, [...existing, assignee]);
        }
      }
    });
    
    return map;
  }, [tasks]);

  // Create a map of patientId -> last appointment date
  const lastAppointmentMap = useMemo(() => {
    const map = new Map<string, Date>();
    appointments.forEach(apt => {
      const existing = map.get(apt.patientId);
      const aptDate = new Date(apt.appointmentDate);
      if (!existing || aptDate > existing) {
        map.set(apt.patientId, aptDate);
      }
    });
    return map;
  }, [appointments]);

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        
        case 'lastAppointment': {
          const aDate = lastAppointmentMap.get(a.id);
          const bDate = lastAppointmentMap.get(b.id);
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1; // Patients without appointments go to end
          if (!bDate) return -1;
          return bDate.getTime() - aDate.getTime(); // Most recent first
        }
        
        case 'treatmentInitiation': {
          const aDate = a.treatmentInitiationDate ? new Date(a.treatmentInitiationDate) : null;
          const bDate = b.treatmentInitiationDate ? new Date(b.treatmentInitiationDate) : null;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1; // Patients without initiation date go to end
          if (!bDate) return -1;
          return bDate.getTime() - aDate.getTime(); // Most recent first
        }
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchQuery, sortBy, lastAppointmentMap]);

  const handlePatientClick = (id: string) => {
    setLocation(`/patient/${id}`);
  };

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
    if (page === 'canvas') {
      const firstPatient = patients[0];
      if (firstPatient) {
        setLocation(`/patient/${firstPatient.id}`);
      }
    } else if (page === 'todos') {
      setLocation('/todos');
    }
  };

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User' : 'User';

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        userName={userName}
        userRole="Denturist"
        notificationCount={3}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onSettings={() => setLocation('/settings')}
        currentPage="patients"
      />
      <div className="p-6 border-b bg-background">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h1 className="text-3xl font-semibold">Active Patients</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {canViewAllOffices && (
              <OfficeSelector
                selectedOfficeId={selectedOfficeId}
                onOfficeChange={setSelectedOfficeId}
                canViewAllOffices={canViewAllOffices}
              />
            )}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[220px]" data-testid="select-sort">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Alphabetical</span>
                  </div>
                </SelectItem>
                <SelectItem value="lastAppointment">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Last Appointment</span>
                  </div>
                </SelectItem>
                <SelectItem value="treatmentInitiation">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Treatment Initiation</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-patients"
              />
            </div>
            <Button
              onClick={() => setIsNewPatientDialogOpen(true)}
              data-testid="button-new-patient"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Patient
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 max-w-7xl">
            {filteredAndSortedPatients.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {searchQuery ? "No patients match your search" : "No active patients"}
              </div>
            ) : (
              filteredAndSortedPatients.map(patient => {
                const currentStep = patient.lastStepCompleted || 
                  (patient.isCDCP && !patient.copayDiscussed ? 'CDCP Copay Discussion' : 'New Patient');
                const assignees = patientAssigneesMap.get(patient.id) || [];
                const nextStep = patient.nextStep || 'Clinical Note';
                const eta = patient.dueDate ? new Date(patient.dueDate) : undefined;
                const lastActionDate = patient.lastStepDate ? new Date(patient.lastStepDate) : new Date(patient.createdAt);
                const lastAction = patient.lastStepCompleted 
                  ? `${patient.lastStepCompleted} (${lastActionDate.toLocaleDateString()})`
                  : `Created ${lastActionDate.toLocaleDateString()}`;
                
                const dentureType = [
                  patient.upperDentureType && patient.upperDentureType !== 'None' ? `Upper: ${patient.upperDentureType}` : null,
                  patient.lowerDentureType && patient.lowerDentureType !== 'None' ? `Lower: ${patient.lowerDentureType}` : null
                ].filter(Boolean).join(' / ') || undefined;
                
                return (
                  <PatientTimelineCard
                    key={patient.id}
                    id={patient.id}
                    name={patient.name}
                    photoUrl={patient.photoUrl}
                    dentureType={dentureType}
                    date={lastActionDate}
                    currentStep={currentStep}
                    lastAction={lastAction}
                    nextStep={nextStep}
                    assignees={assignees}
                    eta={eta}
                    onClick={() => handlePatientClick(patient.id)}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      <NewPatientDialog
        open={isNewPatientDialogOpen}
        onOpenChange={setIsNewPatientDialogOpen}
        onSuccess={(patientId) => setLocation(`/patient/${patientId}`)}
      />
    </div>
  );
}
