import { useState } from "react";
import { useLocation } from "wouter";
import TopNav from "@/components/TopNav";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PatientTimelineCard from "@/components/PatientTimelineCard";

const mockPatientsTimeline = [
  { 
    id: '1', 
    name: 'Sarah Johnson', 
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    currentStep: 'Setup Assigned',
    lastAction: 'Metal ETA received',
    nextStep: 'Setup Complete',
    assignee: 'Michael',
    eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },
  { 
    id: '2', 
    name: 'Michael Chen', 
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    currentStep: 'Insurance Estimate',
    lastAction: 'CDCP estimate sent',
    nextStep: 'Insurance Answer',
    assignee: 'Caroline',
    eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  { 
    id: '3', 
    name: 'Emily Rodriguez', 
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    currentStep: 'Processing',
    lastAction: 'Setup completed',
    nextStep: 'Processing Complete',
    assignee: 'Luisa',
    eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
  },
  { 
    id: '4', 
    name: 'David Thompson', 
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    currentStep: 'Scan Import',
    lastAction: 'Initial consultation',
    nextStep: 'Metal Design',
    assignee: 'Luisa',
    eta: new Date(Date.now() + 6 * 60 * 60 * 1000)
  },
  { 
    id: '5', 
    name: 'Amanda Martinez', 
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    currentStep: 'Biteblock',
    lastAction: 'Impressions taken',
    nextStep: 'Biteblock Complete',
    assignee: 'Damien',
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  },
];

export default function ActivePatients() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(false);

  const filteredPatients = mockPatientsTimeline.filter(p =>
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
      setLocation('/patient/1');
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
        <div className="space-y-3 max-w-7xl">
          {filteredPatients.map(patient => (
            <PatientTimelineCard
              key={patient.id}
              {...patient}
              onClick={() => handlePatientClick(patient.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
