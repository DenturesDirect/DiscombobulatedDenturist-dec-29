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
import SimpleNoteInput from "@/components/SimpleNoteInput";
import LabPrescriptionForm, { type LabPrescriptionData } from "@/components/LabPrescriptionForm";
import PhotoUploadZone from "@/components/PhotoUploadZone";
import DocumentPreview from "@/components/DocumentPreview";
import TreatmentMilestoneTimeline from "@/components/TreatmentMilestoneTimeline";
import { Checkbox } from "@/components/ui/checkbox";
import ClinicalPhotoGrid from "@/components/ClinicalPhotoGrid";
import ShadeReminderModal from "@/components/ShadeReminderModal";
import { FileText, Camera, Clock, Loader2, Mail, MailX, FlaskConical, ClipboardList, Pill } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, ClinicalNote, PatientFile, Task, LabNote, AdminNote, LabPrescription } from "@shared/schema";


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

  const { data: labNotes = [], isLoading: isLoadingLabNotes } = useQuery<LabNote[]>({
    queryKey: ['/api/lab-notes', patientId],
    enabled: !!patientId
  });

  const { data: adminNotes = [], isLoading: isLoadingAdminNotes } = useQuery<AdminNote[]>({
    queryKey: ['/api/admin-notes', patientId],
    enabled: !!patientId
  });

  const { data: labPrescriptions = [], isLoading: isLoadingPrescriptions } = useQuery<LabPrescription[]>({
    queryKey: ['/api/lab-prescriptions', patientId],
    enabled: !!patientId
  });

  const [activeInputTab, setActiveInputTab] = useState<'clinical' | 'lab' | 'admin' | 'prescription'>('clinical');

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
    if (page === 'patients') {
      setLocation('/');
    } else if (page === 'todos') {
      setLocation('/todos');
    }
  };

  const handleClinicalNoteSubmit = async (plainText: string, noteDate?: Date) => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/clinical-notes/process', {
        plainTextNote: plainText,
        patientId: patientId,
        noteDate: noteDate?.toISOString() || new Date().toISOString()
      });

      const data = await response.json();
      
      // Check if server returned an error
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Server error processing clinical note');
      }
      
      if (!data.formattedNote || data.formattedNote.trim() === '') {
        throw new Error('AI returned an empty note. Please try again.');
      }
      
      setGeneratedDocument(data.formattedNote);
      setCurrentClinicalNote(data.formattedNote);
      
      // Invalidate clinical notes cache to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
      
      // Also invalidate tasks since AI may have created new tasks
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', { patientId }] });
      
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
      console.error("Clinical note processing error:", error);
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
      
      // Check if server returned an error
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Server error generating referral letter');
      }
      
      setGeneratedDocument(prev => `${prev}\n\n---\n\nREFERRAL LETTER\n\n${data.letter}`);
      setFollowUpPrompt("");
      
      toast({
        title: "Referral Letter Generated",
        description: "The letter has been added to the document."
      });

    } catch (error: any) {
      console.error("Referral letter error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral letter",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLabNoteSubmit = async (content: string) => {
    setIsProcessing(true);
    try {
      await apiRequest('POST', '/api/lab-notes', {
        patientId,
        content
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/lab-notes', patientId] });
      
      toast({
        title: "Lab Note Added",
        description: "The lab note has been saved to the patient's record."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save lab note",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdminNoteSubmit = async (content: string) => {
    setIsProcessing(true);
    try {
      await apiRequest('POST', '/api/admin-notes', {
        patientId,
        content
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/admin-notes', patientId] });
      
      toast({
        title: "Admin Note Added",
        description: "The admin note has been saved to the patient's record."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save admin note",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLabPrescriptionSubmit = async (data: LabPrescriptionData) => {
    setIsProcessing(true);
    try {
      await apiRequest('POST', '/api/lab-prescriptions', {
        patientId,
        ...data
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/lab-prescriptions', patientId] });
      
      toast({
        title: "Lab Prescription Created",
        description: "The prescription has been saved as a draft."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
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
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onSettings={() => setLocation('/settings')}
        currentPage="canvas"
      />

      <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 min-w-[500px] max-w-2xl p-6 overflow-y-auto border-r">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2">{patient.name}</h1>
                <div className="text-sm text-muted-foreground mb-2">
                  {patient.phone && `Phone: ${patient.phone}`}
                  {patient.email && ` • Email: ${patient.email}`}
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      id="email-notifications"
                      checked={patient.emailNotifications}
                      onCheckedChange={async (checked) => {
                        try {
                          await apiRequest('PATCH', `/api/patients/${patientId}/email-notifications`, { enabled: checked });
                          queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId] });
                          toast({
                            title: checked ? "Email Notifications Enabled" : "Email Notifications Disabled",
                            description: checked 
                              ? `${patient.name} will now receive email notifications.`
                              : `${patient.name} will no longer receive email notifications.`
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to update notification preference",
                            variant: "destructive"
                          });
                        }
                      }}
                      data-testid="switch-email-notifications"
                    />
                    <label htmlFor="email-notifications" className="text-sm cursor-pointer flex items-center gap-1">
                      {patient.emailNotifications ? (
                        <>
                          <Mail className="w-4 h-4 text-primary" />
                          Email notifications enabled
                        </>
                      ) : (
                        <>
                          <MailX className="w-4 h-4 text-muted-foreground" />
                          Email notifications disabled
                        </>
                      )}
                    </label>
                  </div>
                )}
                <ClinicalDetailsCard patient={patient} />
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Add Notes / Prescriptions</h2>
                  {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
                
                <Tabs value={activeInputTab} onValueChange={(v) => setActiveInputTab(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full mb-4">
                    <TabsTrigger value="clinical" className="text-xs gap-1" data-testid="tab-input-clinical">
                      <FileText className="w-3 h-3" />
                      Clinical
                    </TabsTrigger>
                    <TabsTrigger value="lab" className="text-xs gap-1" data-testid="tab-input-lab">
                      <FlaskConical className="w-3 h-3" />
                      Lab
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="text-xs gap-1" data-testid="tab-input-admin">
                      <ClipboardList className="w-3 h-3" />
                      Admin
                    </TabsTrigger>
                    <TabsTrigger value="prescription" className="text-xs gap-1" data-testid="tab-input-prescription">
                      <Pill className="w-3 h-3" />
                      Lab Rx
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="clinical" className="mt-0">
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
                  </TabsContent>

                  <TabsContent value="lab" className="mt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      Add notes for in-house lab work. These are plain text notes without AI processing.
                    </p>
                    <SimpleNoteInput
                      onSubmit={handleLabNoteSubmit}
                      disabled={isProcessing}
                      placeholder="Enter lab notes (fabrication details, adjustments, materials used...)"
                      buttonLabel="Add Lab Note"
                    />
                  </TabsContent>

                  <TabsContent value="admin" className="mt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      Add administrative notes (scheduling, billing, insurance follow-ups, etc.)
                    </p>
                    <SimpleNoteInput
                      onSubmit={handleAdminNoteSubmit}
                      disabled={isProcessing}
                      placeholder="Enter admin notes (billing, insurance, appointments...)"
                      buttonLabel="Add Admin Note"
                    />
                  </TabsContent>

                  <TabsContent value="prescription" className="mt-0">
                    <LabPrescriptionForm
                      patientName={patient.name}
                      onSubmit={handleLabPrescriptionSubmit}
                      disabled={isProcessing}
                    />
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Clinical Photos</h2>
                <PhotoUploadZone 
                  onPhotosChange={async (photos) => {
                    if (photos.length === 0) return;
                    
                    for (const photo of photos) {
                      try {
                        // Get upload URL
                        const urlResponse = await apiRequest('POST', '/api/objects/upload', {});
                        const { uploadURL } = await urlResponse.json();
                        
                        // Upload the file
                        await fetch(uploadURL, {
                          method: 'PUT',
                          body: photo,
                          headers: { 'Content-Type': photo.type }
                        });
                        
                        // Extract the object path from the GCS URL for our API
                        // URL format: https://storage.googleapis.com/bucket/.private/uploads/uuid?params
                        const gcsUrl = new URL(uploadURL);
                        const pathParts = gcsUrl.pathname.split('/');
                        // Find the "uploads" part and take everything after the bucket
                        const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                        const objectId = uploadsIndex >= 0 ? pathParts.slice(uploadsIndex).join('/') : pathParts.slice(-2).join('/');
                        const fileUrl = `/api/objects/${objectId}`;
                        
                        // Save file record to database
                        await apiRequest('POST', `/api/patients/${patientId}/files`, {
                          filename: photo.name,
                          fileUrl,
                          fileType: photo.type,
                          description: ''
                        });
                        
                        // Refresh file list
                        queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'files'] });
                        
                        toast({
                          title: "Photo Uploaded",
                          description: `${photo.name} has been saved to the patient record.`
                        });
                      } catch (error: any) {
                        toast({
                          title: "Upload Failed",
                          description: error.message || "Failed to upload photo",
                          variant: "destructive"
                        });
                      }
                    }
                  }} 
                />
              </Card>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <Tabs defaultValue="clinical" className="h-full flex flex-col">
              <TabsList className="mb-4 flex-wrap gap-1">
                <TabsTrigger value="clinical" className="gap-1 text-xs" data-testid="tab-clinical-notes">
                  <FileText className="w-3 h-3" />
                  Clinical
                </TabsTrigger>
                <TabsTrigger value="lab" className="gap-1 text-xs" data-testid="tab-lab-notes">
                  <FlaskConical className="w-3 h-3" />
                  Lab
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-1 text-xs" data-testid="tab-admin-notes">
                  <ClipboardList className="w-3 h-3" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="gap-1 text-xs" data-testid="tab-prescriptions">
                  <Pill className="w-3 h-3" />
                  Lab Rx
                </TabsTrigger>
                <TabsTrigger value="photos" className="gap-1 text-xs" data-testid="tab-photos">
                  <Camera className="w-3 h-3" />
                  Photos
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-1 text-xs" data-testid="tab-tasks">
                  <Clock className="w-3 h-3" />
                  Tasks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clinical" className="flex-1 overflow-y-auto">
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : clinicalNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p>No clinical notes yet.</p>
                    <p className="text-sm">Use the Clinical tab on the left to add notes.</p>
                  </div>
                ) : (
                  <DocumentPreview 
                    content={generatedDocument || clinicalNotes.map(note => note.content).join('\n\n---\n\n')}
                    onRewrite={(text) => console.log('Rewrite:', text)}
                  />
                )}
              </TabsContent>

              <TabsContent value="lab" className="flex-1 overflow-y-auto">
                {isLoadingLabNotes ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : labNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <FlaskConical className="w-12 h-12 mb-4 opacity-50" />
                    <p>No lab notes yet.</p>
                    <p className="text-sm">Use the Lab tab on the left to add notes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {labNotes.map((note) => (
                      <Card key={note.id} className="p-4" data-testid={`card-lab-note-${note.id}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            <FlaskConical className="w-3 h-3 mr-1" />
                            Lab Note
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()} by {note.createdBy}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="admin" className="flex-1 overflow-y-auto">
                {isLoadingAdminNotes ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : adminNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mb-4 opacity-50" />
                    <p>No admin notes yet.</p>
                    <p className="text-sm">Use the Admin tab on the left to add notes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminNotes.map((note) => (
                      <Card key={note.id} className="p-4" data-testid={`card-admin-note-${note.id}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            <ClipboardList className="w-3 h-3 mr-1" />
                            Admin Note
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()} by {note.createdBy}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="prescriptions" className="flex-1 overflow-y-auto">
                {isLoadingPrescriptions ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : labPrescriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Pill className="w-12 h-12 mb-4 opacity-50" />
                    <p>No lab prescriptions yet.</p>
                    <p className="text-sm">Use the Lab Rx tab on the left to create prescriptions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {labPrescriptions.map((rx) => (
                      <Card key={rx.id} className="p-4" data-testid={`card-prescription-${rx.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={rx.status === 'sent' ? 'default' : rx.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
                              {rx.status}
                            </Badge>
                            <span className="font-medium">{rx.labName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div><span className="text-muted-foreground">Case Type:</span> {rx.caseType.replace(/_/g, ' ')}</div>
                          <div><span className="text-muted-foreground">Arch:</span> {rx.arch}</div>
                          <div><span className="text-muted-foreground">Stage:</span> {rx.fabricationStage.replace(/_/g, ' ')}</div>
                          {rx.deadline && <div><span className="text-muted-foreground">Deadline:</span> {new Date(rx.deadline).toLocaleDateString()}</div>}
                        </div>
                        {rx.designInstructions && (
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Design:</span> {rx.designInstructions}
                          </div>
                        )}
                        {rx.status === 'draft' && (
                          <Button 
                            size="sm" 
                            onClick={async () => {
                              try {
                                await apiRequest('PATCH', `/api/lab-prescriptions/${rx.id}`, { status: 'sent' });
                                queryClient.invalidateQueries({ queryKey: ['/api/lab-prescriptions', patientId] });
                                toast({ title: "Prescription marked as sent" });
                              } catch (error) {
                                toast({ title: "Failed to update", variant: "destructive" });
                              }
                            }}
                            data-testid={`button-send-prescription-${rx.id}`}
                          >
                            Mark as Sent
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>
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

              <TabsContent value="tasks" className="flex-1 overflow-y-auto">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : patientTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Clock className="w-12 h-12 mb-4 opacity-50" />
                    <p>No tasks yet.</p>
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
