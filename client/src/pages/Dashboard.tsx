import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, ClinicalNote } from "@shared/schema";


export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/patient/:id");
  const patientId = params?.id || '';
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isDark, setIsDark] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState("");
  const [showShadeReminder, setShowShadeReminder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState<string>("");
  const [currentClinicalNote, setCurrentClinicalNote] = useState("");

  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: ['/api/patients', patientId],
    enabled: !!patientId
  });

  const { data: clinicalNotes = [], isLoading: isLoadingNotes } = useQuery<ClinicalNote[]>({
    queryKey: ['/api/clinical-notes', patientId],
    enabled: !!patientId
  });

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
      
      // Invalidate clinical notes cache to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
      
      if (data.followUpPrompt) {
        setFollowUpPrompt(data.followUpPrompt);
      }

      if (data.suggestedTasks && data.suggestedTasks.length > 0) {
        toast({
          title: "Tasks Created",
          description: `${data.suggestedTasks.length} task(s) have been assigned to staff.`
        });
      }

      toast({
        title: "Clinical Note Saved",
        description: "The note has been added to the patient's record."
      });

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
        patientName: patient?.name || 'Unknown Patient',
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

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No patient selected</p>
      </div>
    );
  }

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNav 
        userName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User' : 'User'}
        userRole="Denturist"
        notificationCount={3}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onLogout={() => window.location.href = '/api/logout'}
        onNavigate={handleNavigate}
        currentPage="canvas"
      />

      <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 min-w-[500px] max-w-2xl p-6 overflow-y-auto border-r">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2">{patient.name}</h1>
                <div className="text-sm text-muted-foreground mb-4">
                  {patient.dateOfBirth && `DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}`}
                  {patient.phone && ` • Phone: ${patient.phone}`}
                  {patient.isCDCP && (
                    <span className="ml-2 px-2 py-0.5 bg-destructive/10 text-destructive rounded text-xs font-medium">
                      CDCP {!patient.copayDiscussed && '- Copay Not Discussed'}
                    </span>
                  )}
                </div>
                <ToothShadeCard 
                  currentShade={patient.currentToothShade || 'Not Set'}
                  requestedShade={patient.requestedToothShade || 'Not Set'}
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
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <DocumentPreview 
                    content={generatedDocument || clinicalNotes.map(note => note.content).join('\n\n---\n\n') || 'No clinical notes yet. Add one using the form on the left.'}
                    onRewrite={(text) => console.log('Rewrite:', text)}
                  />
                )}
              </TabsContent>

              <TabsContent value="photos" className="flex-1 overflow-y-auto">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Camera className="w-12 h-12 mb-4 opacity-50" />
                  <p>Photos will appear here once uploaded</p>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="flex-1 overflow-y-auto">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="w-12 h-12 mb-4 opacity-50" />
                  <p>Treatment timeline will appear here based on tasks</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

      <ShadeReminderModal 
        open={showShadeReminder}
        onClose={() => setShowShadeReminder(false)}
        onSave={(current, requested) => {
          console.log('Shades saved:', { current, requested });
        }}
        patientName={patient.name}
      />
    </div>
  );
}
