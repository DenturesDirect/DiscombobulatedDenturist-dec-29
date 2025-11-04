import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TopNav from "@/components/TopNav";
import ToothShadeCard from "@/components/ToothShadeCard";
import VoicePromptInput from "@/components/VoicePromptInput";
import PhotoUploadZone from "@/components/PhotoUploadZone";
import DocumentPreview from "@/components/DocumentPreview";
import TreatmentMilestoneTimeline from "@/components/TreatmentMilestoneTimeline";
import ClinicalPhotoGrid from "@/components/ClinicalPhotoGrid";
import ShadeReminderModal from "@/components/ShadeReminderModal";
import { FileText, Camera, Clock, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

//todo: remove mock functionality

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
  const [match, params] = useRoute("/patient/:id");
  const patientId = params?.id || '1';
  const { toast } = useToast();
  
  const [isDark, setIsDark] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState("");
  const [showShadeReminder, setShowShadeReminder] = useState(false);
  const [toothShade, setToothShade] = useState({ current: 'A2', requested: 'B1' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState<string>("");
  const [currentClinicalNote, setCurrentClinicalNote] = useState("");

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleNavigate = (page: 'patients' | 'canvas' | 'todos') => {
    if (page === 'patients') {
      setLocation('/');
    } else if (page === 'todos') {
      setLocation('/todos');
    }
  };

  const handleClinicalNoteSubmit = async (plainText: string) => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/clinical-notes/process', {
        plainTextNote: plainText,
        patientId: patientId
      });

      const data = await response.json();
      setGeneratedDocument(data.formattedNote);
      setCurrentClinicalNote(data.formattedNote);
      
      if (data.followUpPrompt) {
        setFollowUpPrompt(data.followUpPrompt);
      }

      if (data.suggestedTasks && data.suggestedTasks.length > 0) {
        toast({
          title: "Tasks Created",
          description: `${data.suggestedTasks.length} task(s) have been assigned to staff.`
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process clinical note",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateReferralLetter = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/referral-letters/generate', {
        patientName: 'Sarah Johnson',
        clinicalNote: currentClinicalNote
      });

      const data = await response.json();
      setGeneratedDocument(prev => `${prev}\n\n---\n\nREFERRAL LETTER\n\n${data.letter}`);
      setFollowUpPrompt("");
      
      toast({
        title: "Referral Letter Generated",
        description: "The letter has been added to the document."
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral letter",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
        currentPage="canvas"
      />

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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Add New Clinical Note</h2>
                  {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
                <VoicePromptInput 
                  onSubmit={handleClinicalNoteSubmit}
                  disabled={isProcessing}
                />
                {followUpPrompt && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm mb-3">{followUpPrompt}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleGenerateReferralLetter}
                        disabled={isProcessing}
                        data-testid="button-accept-followup"
                      >
                        Yes, Generate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setFollowUpPrompt("")}
                        disabled={isProcessing}
                        data-testid="button-decline-followup"
                      >
                        No, Thanks
                      </Button>
                    </div>
                  </div>
                )}
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
