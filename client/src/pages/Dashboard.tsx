import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import TopNav from "@/components/TopNav";
import PatientTimelineCard from "@/components/PatientTimelineCard";
import ToothShadeCard from "@/components/ToothShadeCard";
import VoicePromptInput from "@/components/VoicePromptInput";
import PhotoUploadZone from "@/components/PhotoUploadZone";
import DocumentPreview from "@/components/DocumentPreview";
import TreatmentMilestoneTimeline from "@/components/TreatmentMilestoneTimeline";
import ClinicalPhotoGrid from "@/components/ClinicalPhotoGrid";
import ShadeReminderModal from "@/components/ShadeReminderModal";
import { Button } from "@/components/ui/button";
import { FileText, Camera, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

//todo: remove mock functionality
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
];

const mockMilestones = [
  { id: '1', name: 'Metal Design Out', status: 'completed' as const, completedBy: 'Damien', completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: '2', name: 'Metal ETA', status: 'completed' as const, completedBy: 'Caroline', completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: '3', name: 'Setup Assigned', status: 'in-progress' as const, assignedTo: 'Michael' },
  { id: '4', name: 'Setup Complete', status: 'pending' as const, assignedTo: 'Michael' },
  { id: '5', name: 'Processing Assigned', status: 'pending' as const, assignedTo: 'Luisa' },
  { id: '6', name: 'Biteblock Assigned', status: 'pending' as const, assignedTo: 'Damien' },
  { id: '7', name: 'Insurance Estimate Submitted', status: 'pending' as const, assignedTo: 'Caroline' },
];

const mockPhotos = [
  { id: '1', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: 'Initial impression' },
  { id: '2', url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: 'Bite registration' },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activePatientId, setActivePatientId] = useState('1');
  const [isDark, setIsDark] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState("");
  const [showShadeReminder, setShowShadeReminder] = useState(false);
  const [toothShade, setToothShade] = useState({ current: 'A2', requested: 'B1' });
  const [searchQuery, setSearchQuery] = useState("");

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleNavigate = (page: 'dashboard' | 'todos') => {
    if (page === 'todos') {
      setLocation('/todos');
    }
  };

  const filteredPatients = mockPatientsTimeline.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNav 
        userName="Damien"
        userRole="Denturist"
        notificationCount={3}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onLogout={() => console.log('Logout')}
        onNavigate={handleNavigate}
        currentPage="dashboard"
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6 border-b bg-background">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-semibold">Active Patients</h2>
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
          
          <ScrollArea className="h-48">
            <div className="space-y-2 pr-4">
              {filteredPatients.map(patient => (
                <PatientTimelineCard
                  key={patient.id}
                  {...patient}
                  isActive={patient.id === activePatientId}
                  onClick={() => setActivePatientId(patient.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 min-w-[500px] max-w-2xl p-6 overflow-y-auto border-r">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2">Sarah Johnson</h1>
                <div className="text-sm text-muted-foreground mb-4">
                  DOB: 05/12/1968 • Phone: (555) 123-4567
                </div>
                <ToothShadeCard 
                  currentShade={toothShade.current}
                  requestedShade={toothShade.requested}
                />
              </div>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Add New Clinical Note</h2>
                <VoicePromptInput onSubmit={(text) => console.log('Clinical note:', text)} />
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Clinical Photos</h2>
                <PhotoUploadZone onPhotosChange={(photos) => console.log('Photos:', photos.length)} />
              </Card>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <Tabs defaultValue="document" className="h-full flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="document" className="gap-2" data-testid="tab-document">
                  <FileText className="w-4 h-4" />
                  Document
                </TabsTrigger>
                <TabsTrigger value="photos" className="gap-2" data-testid="tab-photos">
                  <Camera className="w-4 h-4" />
                  Photos
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2" data-testid="tab-timeline">
                  <Clock className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="document" className="flex-1 overflow-y-auto">
                <DocumentPreview 
                  content={generatedDocument}
                  onRewrite={(text) => console.log('Rewrite:', text)}
                />
              </TabsContent>

              <TabsContent value="photos" className="flex-1 overflow-y-auto">
                <ClinicalPhotoGrid 
                  photos={mockPhotos}
                  onDelete={(id) => console.log('Delete photo:', id)}
                />
              </TabsContent>

              <TabsContent value="timeline" className="flex-1 overflow-y-auto">
                <TreatmentMilestoneTimeline milestones={mockMilestones} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <ShadeReminderModal 
        open={showShadeReminder}
        onClose={() => setShowShadeReminder(false)}
        onSave={(current, requested) => {
          setToothShade({ current, requested });
          console.log('Shades saved:', { current, requested });
        }}
        patientName="Sarah Johnson"
      />
    </div>
  );
}
