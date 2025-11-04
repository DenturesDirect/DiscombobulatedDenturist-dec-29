import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PatientCard from "./PatientCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Patient {
  id: string;
  name: string;
  lastVisit: Date;
  status: 'active' | 'pending' | 'completed';
}

interface PatientSidebarProps {
  patients: Patient[];
  activePatientId?: string;
  onPatientSelect?: (id: string) => void;
  onNewPatient?: () => void;
}

export default function PatientSidebar({ patients, activePatientId, onPatientSelect, onNewPatient }: PatientSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedPatients = filteredPatients.reduce((acc, patient) => {
    const firstLetter = patient.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(patient);
    return acc;
  }, {} as Record<string, Patient[]>);

  return (
    <div className="w-80 border-r bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Patients</h2>
          <Button 
            size="icon" 
            variant="ghost" 
            className="w-9 h-9"
            onClick={onNewPatient}
            data-testid="button-new-patient"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-patients"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(groupedPatients).sort().map(([letter, pts]) => (
            <div key={letter}>
              <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground py-1 px-3 mb-2">
                {letter}
              </div>
              <div className="space-y-2">
                {pts.map(patient => (
                  <PatientCard
                    key={patient.id}
                    {...patient}
                    isActive={patient.id === activePatientId}
                    onClick={() => onPatientSelect?.(patient.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
