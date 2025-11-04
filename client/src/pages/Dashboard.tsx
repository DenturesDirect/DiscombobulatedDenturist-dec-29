import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import TopNav from "@/components/TopNav";
import PatientSidebar from "@/components/PatientSidebar";
import ToothShadeCard from "@/components/ToothShadeCard";
import PromptInput from "@/components/PromptInput";
import PhotoUploadZone from "@/components/PhotoUploadZone";
import DocumentPreview from "@/components/DocumentPreview";
import TreatmentMilestoneTimeline from "@/components/TreatmentMilestoneTimeline";
import ClinicalPhotoGrid from "@/components/ClinicalPhotoGrid";
import ShadeReminderModal from "@/components/ShadeReminderModal";
import { Button } from "@/components/ui/button";
import { FileText, Camera, Clock, CheckSquare } from "lucide-react";

//todo: remove mock functionality
const mockPatients = [
  { id: '1', name: 'Sarah Johnson', lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'active' as const },
  { id: '2', name: 'Michael Chen', lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'pending' as const },
  { id: '3', name: 'Emily Rodriguez', lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), status: 'completed' as const },
  { id: '4', name: 'David Thompson', lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'active' as const },
  { id: '5', name: 'Amanda Martinez', lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: 'pending' as const },
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
  const [activePatientId, setActivePatientId] = useState('1');
  const [isDark, setIsDark] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState("");
  const [showShadeReminder, setShowShadeReminder] = useState(false);
  const [toothShade, setToothShade] = useState({ current: 'A2', requested: 'B1' });

  const handleGenerate = (prompt: string, template: string) => {
    console.log('Generating document:', { prompt, template });
    setGeneratedDocument(`CLINICAL NOTE\n\nPatient: Sarah Johnson\nDate: ${new Date().toLocaleDateString()}\nProvider: Dr. Damien Smith\n\n${prompt}\n\n[Generated content based on your prompt would appear here...]`);
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNav 
        userName="Dr. Damien Smith"
        userRole="Dentist"
        notificationCount={3}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onLogout={() => console.log('Logout')}
      />

      <div className="flex flex-1 overflow-hidden">
        <PatientSidebar 
          patients={mockPatients}
          activePatientId={activePatientId}
          onPatientSelect={setActivePatientId}
          onNewPatient={() => console.log('New patient')}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 min-w-[500px] max-w-2xl p-6 overflow-y-auto border-r">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2">Sarah Johnson</h1>
                <div className="text-sm text-muted-foreground">
                  DOB: 05/12/1968 • Phone: (555) 123-4567
                </div>
              </div>

              <ToothShadeCard 
                currentShade={toothShade.current}
                requestedShade={toothShade.requested}
              />

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">New Clinical Note</h2>
                <PromptInput onGenerate={handleGenerate} />
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

      <div className="h-12 border-t bg-background px-6 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Auto-saved 2 minutes ago</span>
          <span>•</span>
          <span>Last edited by Damien</span>
        </div>
        <div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowShadeReminder(true)}
            data-testid="button-open-shade-modal"
          >
            Update Tooth Shade
          </Button>
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
