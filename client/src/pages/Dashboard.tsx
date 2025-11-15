import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TopNav from "@/components/TopNav";
import ClinicalDetailsCard from "@/components/ClinicalDetailsCard";
import VoicePromptInput from "@/components/VoicePromptInput";
import PhotoUploadZone from "@/components/PhotoUploadZone";
import DocumentPreview from "@/components/DocumentPreview";
import TreatmentMilestoneTimeline from "@/components/TreatmentMilestoneTimeline";
import { Checkbox } from "@/components/ui/checkbox";
import ClinicalPhotoGrid from "@/components/ClinicalPhotoGrid";
import ShadeReminderModal from "@/components/ShadeReminderModal";
import { FileText, Camera, Clock, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, ClinicalNote, PatientFile, Task } from "@shared/schema";


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

  const { data: patientFiles = [], isLoading: isLoadingFiles } = useQuery<PatientFile[]>({
    queryKey: ['/api/patients', patientId, 'files'],
    enabled: !!patientId
  });

  const { data: patientTasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks', { patientId }],
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
      
      if (!data.formattedNote || data.formattedNote.trim() === '') {
        throw new Error('AI returned an empty note. Please try again or contact support.');
      }
      
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
                  {patient.phone && `Phone: ${patient.phone}`}
                  {patient.email && ` • Email: ${patient.email}`}
                </div>
                <ClinicalDetailsCard patient={patient} />
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
                <PhotoUploadZone onPhotosChange={(photos) => console.log('Selected photos:', photos.length)} />
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
                {isLoadingFiles ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ClinicalPhotoGrid
                    photos={patientFiles.map(file => ({
                      id: file.id,
                      url: file.fileUrl,
                      date: new Date(file.uploadedAt),
                      description: file.description || undefined
                    }))}
                    onDelete={async (fileId) => {
                      try {
                        await apiRequest('DELETE', `/api/patients/${patientId}/files/${fileId}`);
                        queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'files'] });
                        toast({ title: "Photo deleted successfully" });
                      } catch (error) {
                        toast({ title: "Failed to delete photo", variant: "destructive" });
                      }
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="timeline" className="flex-1 overflow-y-auto">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : patientTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Clock className="w-12 h-12 mb-4 opacity-50" />
                    <p>No tasks yet. Add clinical notes to generate tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientTasks.map((task) => (
                      <Card key={task.id} className="p-4" data-testid={`card-task-${task.id}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === "completed"}
                            onCheckedChange={async (checked) => {
                              try {
                                await apiRequest('PATCH', `/api/tasks/${task.id}`, {
                                  status: checked ? "completed" : "pending"
                                });
                                queryClient.invalidateQueries({ queryKey: ['/api/tasks', { patientId }] });
                                toast({ 
                                  title: checked ? "Task completed" : "Task reopened"
                                });
                              } catch (error) {
                                toast({ 
                                  title: "Failed to update task", 
                                  variant: "destructive" 
                                });
                              }
                            }}
                            data-testid={`checkbox-task-${task.id}`}
                          />
                          <div className="flex-1">
                            <div className="font-medium mb-1" data-testid={`text-task-title-${task.id}`}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Assigned to: {task.assignee}</span>
                              {task.priority && (
                                <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                                  {task.priority}
                                </Badge>
                              )}
                              {task.dueDate && (
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
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
