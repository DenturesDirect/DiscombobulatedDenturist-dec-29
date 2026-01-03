import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import TopNav from "@/components/TopNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus } from "lucide-react";
import PatientTimelineCard from "@/components/PatientTimelineCard";
import NewPatientDialog from "@/components/NewPatientDialog";
import OfficeSelector from "@/components/OfficeSelector";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

export default function ActivePatients() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const { user } = useAuth();

  const canViewAllOffices = user?.canViewAllOffices ?? false;

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

  // Fetch offices for name lookup
  const { data: offices = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['/api/offices'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/offices');
      return response.json();
    },
    enabled: canViewAllOffices,
  });

  const getOfficeName = (officeId: string | null) => {
    if (!officeId) return null;
    return offices.find(o => o.id === officeId)?.name || null;
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-semibold">Active Patients</h1>
          <div className="flex items-center gap-3">
            {canViewAllOffices && (
              <OfficeSelector
                selectedOfficeId={selectedOfficeId}
                onOfficeChange={setSelectedOfficeId}
                canViewAllOffices={canViewAllOffices}
              />
            )}
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
            {filteredPatients.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {searchQuery ? "No patients match your search" : "No active patients"}
              </div>
            ) : (
              filteredPatients.map(patient => {
                const currentStep = patient.lastStepCompleted || 
                  (patient.isCDCP && !patient.copayDiscussed ? 'CDCP Copay Discussion' : 'New Patient');
                const assignee = patient.assignedTo || 
                  (patient.isCDCP && !patient.copayDiscussed ? 'Damien' : 'Unassigned');
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
                    assignee={assignee}
                    eta={eta}
                    officeName={getOfficeName(patient.officeId)}
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
