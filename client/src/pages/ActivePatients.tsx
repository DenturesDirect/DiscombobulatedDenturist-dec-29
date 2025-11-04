import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import TopNav from "@/components/TopNav";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import PatientTimelineCard from "@/components/PatientTimelineCard";
import type { Patient } from "@shared/schema";

export default function ActivePatients() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(false);

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });

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
        currentPage="patients"
      />
      <div className="p-6 border-b bg-background">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-semibold">Active Patients</h1>
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
              filteredPatients.map(patient => (
                <PatientTimelineCard
                  key={patient.id}
                  id={patient.id}
                  name={patient.name}
                  date={new Date(patient.createdAt)}
                  currentStep={patient.isCDCP && !patient.copayDiscussed ? 'CDCP Copay Discussion' : 'Active Treatment'}
                  lastAction={`Created ${new Date(patient.createdAt).toLocaleDateString()}`}
                  nextStep="Clinical Note"
                  assignee={patient.isCDCP && !patient.copayDiscussed ? 'Damien' : 'TBD'}
                  eta={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
                  onClick={() => handlePatientClick(patient.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
