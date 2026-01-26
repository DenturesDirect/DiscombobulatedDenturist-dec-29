import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TopNav from "@/components/TopNav";
import ClinicalDetailsCard from "@/components/ClinicalDetailsCard";
import PatientStatusCard from "@/components/PatientStatusCard";
import VoicePromptInput from "@/components/VoicePromptInput";
import SimpleNoteInput from "@/components/SimpleNoteInput";
import LabPrescriptionForm, { type LabPrescriptionData } from "@/components/LabPrescriptionForm";
import PhotoUploadZone from "@/components/PhotoUploadZone";
import DocumentPreview from "@/components/DocumentPreview";
import TreatmentMilestoneTimeline from "@/components/TreatmentMilestoneTimeline";
import { Checkbox } from "@/components/ui/checkbox";
import ClinicalPhotoGrid from "@/components/ClinicalPhotoGrid";
import ShadeReminderModal from "@/components/ShadeReminderModal";
import TaskForm from "@/components/TaskForm";
import ChartUploader from "@/components/ChartUploader";
import DocumentUploadZone from "@/components/DocumentUploadZone";
import DocumentList from "@/components/DocumentList";
import RadiographAnalysis from "@/components/RadiographAnalysis";
import { FileText, Camera, Clock, Loader2, Mail, MailX, FlaskConical, ClipboardList, Pill, Save, X, Edit3, CheckSquare, Trash2, Upload, Pencil, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  const [pendingNoteDate, setPendingNoteDate] = useState<Date>(new Date());
  const [isReviewingNote, setIsReviewingNote] = useState(false);
  const [pendingSuggestedTasks, setPendingSuggestedTasks] = useState<Array<{
    title: string;
    assignee: string;
    dueDate: string;
    priority: 'high' | 'normal' | 'low';
  }> | null>(null);
  const [editingClinicalNoteId, setEditingClinicalNoteId] = useState<string | null>(null);
  const [editingClinicalNoteContent, setEditingClinicalNoteContent] = useState<string>("");
  const [editingLabNoteId, setEditingLabNoteId] = useState<string | null>(null);
  const [editingLabNoteContent, setEditingLabNoteContent] = useState<string>("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showChartUpload, setShowChartUpload] = useState(false);
  const [isEditingPatientName, setIsEditingPatientName] = useState(false);
  const [editedPatientName, setEditedPatientName] = useState("");

  const canViewAllOffices = user?.canViewAllOffices ?? false;
  const isAdmin = user?.role === 'admin' || canViewAllOffices;

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
    queryFn: async () => {
      if (!patientId) return [];
      const response = await apiRequest('GET', `/api/patients/${patientId}/files`);
      return response.json();
    },
    enabled: !!patientId
  });

  const { data: patientTasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks', { patientId }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tasks?patientId=${patientId}`);
      return response.json();
    },
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

  const [activeInputTab, setActiveInputTab] = useState<'clinical' | 'lab' | 'admin' | 'prescription' | 'task'>('clinical');

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

  const handleSavePatientName = async () => {
    if (!editedPatientName.trim()) {
      toast({
        title: "Error",
        description: "Patient name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (editedPatientName.trim() === patient.name) {
      setIsEditingPatientName(false);
      return;
    }

    setIsProcessing(true);
    try {
      await apiRequest('PATCH', `/api/patients/${patientId}`, {
        name: editedPatientName.trim()
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      
      toast({
        title: "Patient Name Updated",
        description: "The patient's name has been updated successfully."
      });
      
      setIsEditingPatientName(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient name",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClinicalNoteSubmit = async (plainText: string, noteDate?: Date) => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/clinical-notes/process', {
        plainTextNote: plainText,
        patientId: patientId
      });

      const data = await response.json();
      
      // Check if server returned an error
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Server error processing clinical note');
      }
      
      if (!data.formattedNote || data.formattedNote.trim() === '') {
        throw new Error('AI returned an empty note. Please try again.');
      }
      
      // Show the formatted note for REVIEW - not saved yet
      setGeneratedDocument(data.formattedNote);
      setCurrentClinicalNote(data.formattedNote);
      setPendingNoteDate(noteDate || new Date());
      setIsReviewingNote(true);
      
      // Store suggested tasks if any were extracted
      if (data.suggestedTasks && data.suggestedTasks.length > 0) {
        setPendingSuggestedTasks(data.suggestedTasks);
      } else {
        setPendingSuggestedTasks(null);
      }
      
      if (data.followUpPrompt) {
        setFollowUpPrompt(data.followUpPrompt);
      }

      toast({
        title: "Ready for Review",
        description: "Please review and edit the formatted note, then click Save to add it to the record."
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
  
  // Save the clinical note after review/edit
  const handleSaveClinicalNote = async () => {
    if (!currentClinicalNote.trim()) {
      toast({
        title: "Error",
        description: "Cannot save an empty note",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/clinical-notes/save', {
        patientId: patientId,
        content: currentClinicalNote,
        noteDate: pendingNoteDate.toISOString(),
        suggestedTasks: pendingSuggestedTasks
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Server error saving clinical note');
      }
      
      // Invalidate clinical notes cache to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
      
      // Also invalidate tasks since Caroline's insurance task may have been created
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', { patientId }] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Clear all review state so next note starts fresh
      setIsReviewingNote(false);
      setGeneratedDocument("");
      setCurrentClinicalNote("");
      setFollowUpPrompt("");
      setPendingNoteDate(new Date()); // Reset to today for next note
      setPendingSuggestedTasks(null);
      
      toast({
        title: "Clinical Note Saved",
        description: "The note has been added to the patient's record."
      });

    } catch (error: any) {
      console.error("Clinical note save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save clinical note",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Discard the pending note
  const handleDiscardNote = () => {
    setGeneratedDocument("");
    setCurrentClinicalNote("");
    setFollowUpPrompt("");
    setPendingSuggestedTasks(null);
    setIsReviewingNote(false);
    toast({
      title: "Note Discarded",
      description: "The formatted note was discarded without saving."
    });
  };

  // Check if note can be edited (same day)
  const canEditNote = (note: ClinicalNote | LabNote) => {
    const noteDate = 'noteDate' in note && note.noteDate 
      ? new Date(note.noteDate) 
      : new Date(note.createdAt);
    const today = new Date();
    return noteDate.toDateString() === today.toDateString();
  };

  // Handle edit clinical note
  const handleEditClinicalNote = (note: ClinicalNote) => {
    if (!canEditNote(note)) {
      toast({
        title: "Cannot Edit",
        description: "Notes can only be edited on the same day they were created.",
        variant: "destructive"
      });
      return;
    }
    setEditingClinicalNoteId(note.id);
    setEditingClinicalNoteContent(note.content);
  };

  const handleSaveClinicalNoteEdit = async () => {
    if (!editingClinicalNoteId) return;
    
    try {
      await apiRequest('PATCH', `/api/clinical-notes/${editingClinicalNoteId}`, {
        content: editingClinicalNoteContent
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
      setEditingClinicalNoteId(null);
      setEditingClinicalNoteContent("");
      
      toast({
        title: "Note Updated",
        description: "Clinical note has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const handleCancelClinicalNoteEdit = () => {
    setEditingClinicalNoteId(null);
    setEditingClinicalNoteContent("");
  };

  // Handle edit lab note
  const handleEditLabNote = (note: LabNote) => {
    if (!canEditNote(note)) {
      toast({
        title: "Cannot Edit",
        description: "Notes can only be edited on the same day they were created.",
        variant: "destructive"
      });
      return;
    }
    setEditingLabNoteId(note.id);
    setEditingLabNoteContent(note.content);
  };

  const handleSaveLabNoteEdit = async () => {
    if (!editingLabNoteId) return;
    
    try {
      await apiRequest('PATCH', `/api/lab-notes/${editingLabNoteId}`, {
        content: editingLabNoteContent
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/lab-notes', patientId] });
      setEditingLabNoteId(null);
      setEditingLabNoteContent("");
      
      toast({
        title: "Note Updated",
        description: "Lab note has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const handleCancelLabNoteEdit = () => {
    setEditingLabNoteId(null);
    setEditingLabNoteContent("");
  };

  // Handle delete clinical note
  const handleDeleteClinicalNote = async () => {
    if (!deleteNoteId) return;
    
    try {
      await apiRequest('DELETE', `/api/clinical-notes/${deleteNoteId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
      setDeleteNoteId(null);
      setShowDeleteDialog(false);
      
      toast({
        title: "Note Deleted",
        description: "Clinical note has been deleted successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive"
      });
      setShowDeleteDialog(false);
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
    if (!patientId) {
      toast({
        title: "Error",
        description: "No patient selected. Please select a patient first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!content || content.trim() === "") {
      toast({
        title: "Error",
        description: "Lab note cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await apiRequest('POST', '/api/lab-notes', {
        patientId,
        content: content.trim()
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/lab-notes', patientId] });
      
      toast({
        title: "Lab Note Added",
        description: "The lab note has been saved to the patient's record."
      });
    } catch (error: any) {
      console.error("Lab note error:", error);
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

  const handleTaskSubmit = async (taskData: {
    title: string;
    description?: string;
    assignee: string;
    priority: "high" | "normal" | "low";
    dueDate?: Date;
  }) => {
    setIsProcessing(true);
    try {
      await apiRequest('POST', '/api/tasks', {
        patientId,
        title: taskData.title,
        description: taskData.description,
        assignee: taskData.assignee,
        priority: taskData.priority,
        dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
        status: "pending"
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', { patientId }] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Task Created",
        description: `Task assigned to ${taskData.assignee}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
          <div className="flex-1 min-w-[500px] max-w-2xl p-6 overflow-y-auto border-r bg-card/50 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-card to-card/80 rounded-xl p-6 shadow-md border border-card-border">
                <div className="flex items-center gap-2 mb-3">
                  {isEditingPatientName ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editedPatientName}
                        onChange={(e) => setEditedPatientName(e.target.value)}
                        className="text-3xl font-semibold h-auto py-1 bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSavePatientName();
                          } else if (e.key === 'Escape') {
                            setIsEditingPatientName(false);
                            setEditedPatientName(patient.name);
                          }
                        }}
                        autoFocus
                        data-testid="input-edit-patient-name"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSavePatientName}
                        disabled={isProcessing}
                        className="hover:bg-primary/10"
                        data-testid="button-save-patient-name"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingPatientName(false);
                          setEditedPatientName(patient.name);
                        }}
                        disabled={isProcessing}
                        className="hover:bg-destructive/10"
                        data-testid="button-cancel-edit-name"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{patient.name}</h1>
                      {isAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-primary/10"
                          onClick={() => {
                            setEditedPatientName(patient.name);
                            setIsEditingPatientName(true);
                          }}
                          data-testid="button-edit-patient-name"
                          title="Edit patient name (Admin only)"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {patient.officeId && canViewAllOffices && (
                    <Badge variant="secondary" className="text-xs shadow-sm">
                      {getOfficeName(patient.officeId) || 'Office'}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {patient.phone && `Phone: ${patient.phone}`}
                  {patient.email && ` • Email: ${patient.email}`}
                </div>
                {(patient.email || patient.phone) && (
                  <div className="space-y-3 mb-4">
                    {patient.email && (
                      <div className="flex items-center gap-2">
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
                    {patient.phone && (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="text-notifications"
                          checked={patient.textNotifications || false}
                          onCheckedChange={async (checked) => {
                            try {
                              await apiRequest('PATCH', `/api/patients/${patientId}/text-notifications`, { enabled: checked });
                              queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId] });
                              toast({
                                title: checked ? "Text Notifications Enabled" : "Text Notifications Disabled",
                                description: checked 
                                  ? `${patient.name} will now receive text notifications.`
                                  : `${patient.name} will no longer receive text notifications.`
                              });
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to update text notifications",
                                variant: "destructive"
                              });
                            }
                          }}
                          data-testid="switch-text-notifications"
                        />
                        <label htmlFor="text-notifications" className="text-sm cursor-pointer flex items-center gap-1">
                          {patient.textNotifications ? (
                            <span className="text-primary font-medium">📱 Text notifications enabled</span>
                          ) : (
                            <span className="text-muted-foreground">📱 Text notifications disabled</span>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                )}
                <ClinicalDetailsCard patient={patient} />
                
                {/* Chart Upload for Dentures Direct users */}
                {canViewAllOffices && (
                  <div className="mt-4">
                    {!showChartUpload ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowChartUpload(true)}
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Upload Patient Chart (Migrate from Old System)
                      </Button>
                    ) : (
                      <ChartUploader
                        patientId={patientId}
                        patientName={patient.name}
                        onCancel={() => setShowChartUpload(false)}
                        onSummaryReady={() => {
                          // Refresh clinical notes after summary is ready
                          queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              <Card className="p-6 shadow-lg border-card-border bg-card/95 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Add Notes / Prescriptions</h2>
                    <p className="text-sm text-muted-foreground mt-1">Create clinical notes, lab prescriptions, and tasks</p>
                  </div>
                  {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
                
                <Tabs value={activeInputTab} onValueChange={(v) => setActiveInputTab(v as any)} className="w-full">
                  <TabsList className={`grid ${canViewAllOffices ? 'grid-cols-6' : 'grid-cols-5'} w-full mb-4`}>
                    {canViewAllOffices && (
                      <TabsTrigger value="chart" className="text-xs gap-1" data-testid="tab-input-chart">
                        <Upload className="w-3 h-3" />
                        Chart
                      </TabsTrigger>
                    )}
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
                    <TabsTrigger value="task" className="text-xs gap-1" data-testid="tab-input-task">
                      <CheckSquare className="w-3 h-3" />
                      Task
                    </TabsTrigger>
                  </TabsList>

                  {canViewAllOffices && (
                    <TabsContent value="chart" className="mt-0">
                      <ChartUploader
                        patientId={patientId}
                        patientName={patient.name}
                        onSummaryReady={() => {
                          // Refresh clinical notes after summary is ready
                          queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
                        }}
                      />
                    </TabsContent>
                  )}
                  
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
                  <TabsContent value="task" className="mt-0">
                    <TaskForm
                      patientId={patientId}
                      patientName={patient.name}
                      onSubmit={handleTaskSubmit}
                      disabled={isProcessing}
                    />
                  </TabsContent>
                </Tabs>
              </Card>

              <RadiographAnalysis 
                patientId={patientId}
                onSaveAsClinicalNote={async (content, label) => {
                  try {
                    const response = await apiRequest('POST', '/api/clinical-notes/save', {
                      patientId,
                      content,
                      noteDate: new Date().toISOString(),
                    });
                    const data = await response.json();
                    if (data.error) {
                      throw new Error(data.error || data.message || 'Server error saving clinical note');
                    }
                    queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes', patientId] });
                    toast({
                      title: "Clinical Note Saved",
                      description: `The ${label} has been saved successfully.`,
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to save clinical note.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isProcessing}
              />

              <Card className="p-6 shadow-lg border-card-border bg-card/95 backdrop-blur-sm">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-1">Upload Clinical Photos</h2>
                  <p className="text-sm text-muted-foreground">Add photos to the patient's clinical record</p>
                </div>
                <PhotoUploadZone 
                  onPhotosChange={async (photos) => {
                    if (photos.length === 0) return;
                    
                    for (const photo of photos) {
                      try {
                        // Get upload URL
                        const urlResponse = await apiRequest('POST', '/api/objects/upload', {});
                        const { uploadURL } = await urlResponse.json();
                        
                        // Determine storage type by URL
                        const isSupabase = uploadURL.includes('.supabase.co');
                        const isRailway = uploadURL.includes('railway.app') || uploadURL.includes('railway-storage');
                        
                        // Upload the file
                        // Supabase uses POST, Railway uses PUT
                        const uploadResponse = await fetch(uploadURL, {
                          method: isSupabase ? 'POST' : 'PUT',
                          body: photo,
                          headers: { 'Content-Type': photo.type }
                        });
                        
                        if (!uploadResponse.ok) {
                          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
                        }
                        
                        // Extract the object path from the upload URL
                        let objectId = '';
                        
                        if (isSupabase) {
                          // Supabase URL format: https://[project].supabase.co/storage/v1/object/sign/[bucket]/uploads/[uuid]?...
                          const uploadUrlObj = new URL(uploadURL);
                          const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
                          
                          const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                          if (uploadsIndex >= 0) {
                            objectId = pathParts.slice(uploadsIndex).join('/');
                          } else {
                            objectId = pathParts[pathParts.length - 1] || 'unknown';
                          }
                        } else if (isRailway) {
                          // Railway Storage (S3-compatible) URL format: https://[endpoint]/[bucket]/uploads/[uuid]?...
                          const uploadUrlObj = new URL(uploadURL);
                          const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
                          
                          const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                          if (uploadsIndex >= 0) {
                            objectId = pathParts.slice(uploadsIndex).join('/');
                          } else {
                            objectId = pathParts[pathParts.length - 1] || 'unknown';
                          }
                        } else {
                          // Legacy/Unknown URL format - try to extract path
                          const uploadUrlObj = new URL(uploadURL);
                          const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
                          
                          const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                          if (uploadsIndex >= 0) {
                            objectId = pathParts.slice(uploadsIndex).join('/');
                          } else {
                            objectId = pathParts[pathParts.length - 1] || 'unknown';
                          }
                        }
                        
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

          <div className="flex-1 p-6 overflow-y-auto bg-background/50">
            <Tabs defaultValue="clinical" className="h-full flex flex-col">
              <div className="mb-6 space-y-4">
                {/* Tabs Row - All horizontal, can wrap to multiple rows */}
                <div className="overflow-x-auto">
                  <TabsList className="inline-flex flex-wrap gap-1 min-w-max bg-muted/50 p-1 rounded-lg shadow-sm">
                    <TabsTrigger value="clinical" className="gap-1 text-xs flex-shrink-0" data-testid="tab-clinical-notes">
                      <FileText className="w-3 h-3" />
                      Clinical
                    </TabsTrigger>
                    <TabsTrigger value="lab" className="gap-1 text-xs flex-shrink-0" data-testid="tab-lab-notes">
                      <FlaskConical className="w-3 h-3" />
                      Lab
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="gap-1 text-xs flex-shrink-0" data-testid="tab-admin-notes">
                      <ClipboardList className="w-3 h-3" />
                      Admin
                    </TabsTrigger>
                    <TabsTrigger value="prescriptions" className="gap-1 text-xs flex-shrink-0" data-testid="tab-prescriptions">
                      <Pill className="w-3 h-3" />
                      Lab Rx
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-1 text-xs flex-shrink-0" data-testid="tab-tasks">
                      <CheckSquare className="w-3 h-3" />
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger value="photos" className="gap-1 text-xs flex-shrink-0" data-testid="tab-photos">
                      <Camera className="w-3 h-3" />
                      Photos
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-1 text-xs flex-shrink-0" data-testid="tab-documents">
                      <FileText className="w-3 h-3" />
                      Documents
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Status Row - Payments and Pre-D Status */}
                <div className="flex items-center flex-wrap">
                  <PatientStatusCard patient={patient} />
                </div>
              </div>

              <TabsContent value="clinical" className="flex-1 overflow-y-auto">
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : isReviewingNote ? (
                  // Review mode: show editable note with Save/Discard buttons
                  <div className="space-y-4">
                    <Card className="p-4 border-primary/50 bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-amber-500 text-white">
                          <Edit3 className="w-3 h-3 mr-1" />
                          Review & Edit
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Review the AI-formatted note below. Edit if needed, then save or discard.
                        </span>
                      </div>
                      <Textarea
                        value={currentClinicalNote}
                        onChange={(e) => setCurrentClinicalNote(e.target.value)}
                        className="min-h-[300px] text-sm font-mono"
                        placeholder="Edit your clinical note..."
                        data-testid="textarea-review-note"
                      />
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={handleSaveClinicalNote}
                          disabled={isProcessing || !currentClinicalNote.trim()}
                          className="flex-1"
                          data-testid="button-save-note"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save to Patient Record
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDiscardNote}
                          disabled={isProcessing}
                          data-testid="button-discard-note"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Discard
                        </Button>
                      </div>
                    </Card>
                    
                    {followUpPrompt && (
                      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                        <p className="text-sm mb-3">{followUpPrompt}</p>
                        {followUpPrompt.toLowerCase().includes('referral') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateReferralLetter}
                            disabled={isProcessing}
                            data-testid="button-generate-referral"
                          >
                            Yes, Generate Referral Letter
                          </Button>
                        )}
                      </Card>
                    )}
                  </div>
                ) : clinicalNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p>No clinical notes yet.</p>
                    <p className="text-sm">Use the Clinical tab on the left to add notes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clinicalNotes.map((note) => (
                      <Card key={note.id} className="p-5 shadow-md hover:shadow-lg transition-shadow border-card-border bg-card/95 backdrop-blur-sm" data-testid={`card-clinical-note-${note.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs shadow-sm">
                              <FileText className="w-3 h-3 mr-1" />
                              Clinical Note
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {note.noteDate 
                                ? new Date(note.noteDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : new Date(note.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              } by {note.createdBy}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingClinicalNoteId === note.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleSaveClinicalNoteEdit}
                                  data-testid={`button-save-edit-${note.id}`}
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelClinicalNoteEdit}
                                  data-testid={`button-cancel-edit-${note.id}`}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                {canEditNote(note) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditClinicalNote(note)}
                                    data-testid={`button-edit-${note.id}`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                )}
                                {user?.role === 'admin' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setDeleteNoteId(note.id);
                                      setShowDeleteDialog(true);
                                    }}
                                    data-testid={`button-delete-${note.id}`}
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {editingClinicalNoteId === note.id ? (
                          <Textarea
                            value={editingClinicalNoteContent}
                            onChange={(e) => setEditingClinicalNoteContent(e.target.value)}
                            className="min-h-[100px] text-sm"
                            data-testid={`textarea-edit-${note.id}`}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        )}
                      </Card>
                    ))}
                  </div>
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <FlaskConical className="w-3 h-3 mr-1" />
                              Lab Note
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString()} by {note.createdBy}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingLabNoteId === note.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleSaveLabNoteEdit}
                                  data-testid={`button-save-edit-lab-${note.id}`}
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelLabNoteEdit}
                                  data-testid={`button-cancel-edit-lab-${note.id}`}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                {canEditNote(note) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditLabNote(note)}
                                    data-testid={`button-edit-lab-${note.id}`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {editingLabNoteId === note.id ? (
                          <Textarea
                            value={editingLabNoteContent}
                            onChange={(e) => setEditingLabNoteContent(e.target.value)}
                            className="min-h-[100px] text-sm"
                            data-testid={`textarea-edit-lab-${note.id}`}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        )}
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
                          {rx.caseTypeUpper && (
                            <>
                              <div><span className="text-muted-foreground">Case Type - Upper:</span> {rx.caseTypeUpper.replace(/_/g, ' ')}</div>
                              {rx.fabricationStageUpper && (
                                <div><span className="text-muted-foreground">Stage - Upper:</span> {rx.fabricationStageUpper.replace(/_/g, ' ')}</div>
                              )}
                            </>
                          )}
                          {rx.caseTypeLower && (
                            <>
                              <div><span className="text-muted-foreground">Case Type - Lower:</span> {rx.caseTypeLower.replace(/_/g, ' ')}</div>
                              {rx.fabricationStageLower && (
                                <div><span className="text-muted-foreground">Stage - Lower:</span> {rx.fabricationStageLower.replace(/_/g, ' ')}</div>
                              )}
                            </>
                          )}
                          {rx.caseType && !rx.caseTypeUpper && !rx.caseTypeLower && (
                            <>
                              <div><span className="text-muted-foreground">Case Type:</span> {rx.caseType.replace(/_/g, ' ')}</div>
                              {rx.fabricationStage && (
                                <div><span className="text-muted-foreground">Stage:</span> {rx.fabricationStage.replace(/_/g, ' ')}</div>
                              )}
                            </>
                          )}
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
                  <>
                    <Card className="p-4 mb-4">
                      <PhotoUploadZone
                        onPhotosChange={async (photos) => {
                          if (photos.length === 0) return;
                          
                          for (const photo of photos) {
                            try {
                              // Get upload URL
                              const urlResponse = await apiRequest('POST', '/api/objects/upload', {});
                              const { uploadURL } = await urlResponse.json();
                              
                              // Determine storage type by URL
                              const isSupabase = uploadURL.includes('.supabase.co');
                              const isRailway = uploadURL.includes('railway.app') || uploadURL.includes('railway-storage');
                              
                              // Upload the file
                              // Supabase uses POST, Railway uses PUT
                              const uploadResponse = await fetch(uploadURL, {
                                method: isSupabase ? 'POST' : 'PUT',
                                body: photo,
                                headers: { 'Content-Type': photo.type }
                              });
                              
                              if (!uploadResponse.ok) {
                                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
                              }
                              
                              // Extract the object path from the upload URL
                              let objectId = '';
                              
                              if (isSupabase) {
                                // Supabase URL format: https://[project].supabase.co/storage/v1/object/sign/[bucket]/uploads/[uuid]?...
                                const uploadUrlObj = new URL(uploadURL);
                                const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
                                
                                const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                                if (uploadsIndex >= 0) {
                                  objectId = pathParts.slice(uploadsIndex).join('/');
                                } else {
                                  objectId = pathParts[pathParts.length - 1] || 'unknown';
                                }
                              } else if (isRailway) {
                                // Railway Storage (S3-compatible) URL format: https://[endpoint]/[bucket]/uploads/[uuid]?...
                                const uploadUrlObj = new URL(uploadURL);
                                const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
                                
                                const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                                if (uploadsIndex >= 0) {
                                  objectId = pathParts.slice(uploadsIndex).join('/');
                                } else {
                                  objectId = pathParts[pathParts.length - 1] || 'unknown';
                                }
                              } else {
                                // Legacy/Unknown URL format - try to extract path
                                const uploadUrlObj = new URL(uploadURL);
                                const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
                                
                                const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                                if (uploadsIndex >= 0) {
                                  objectId = pathParts.slice(uploadsIndex).join('/');
                                } else {
                                  objectId = pathParts[pathParts.length - 1] || 'unknown';
                                }
                              }
                              
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
                    <ClinicalPhotoGrid
                      photos={patientFiles
                        .filter(file => {
                          // Filter for image files only
                          const fileType = file.fileType?.toLowerCase() || '';
                          return fileType.startsWith('image/');
                        })
                        .map(file => ({
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
                  </>
                )}
              </TabsContent>

              <TabsContent value="documents" className="flex-1 overflow-y-auto">
                {isLoadingFiles ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <Card className="p-4 mb-4">
                      <DocumentUploadZone
                        patientId={patientId}
                        onUploadComplete={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'files'] });
                        }}
                      />
                    </Card>
                    <DocumentList
                      documents={patientFiles
                        .filter(file => {
                          // Filter for non-image files (documents)
                          const fileType = file.fileType?.toLowerCase() || '';
                          return !fileType.startsWith('image/');
                        })
                        .map(file => ({
                          id: file.id,
                          filename: file.filename,
                          fileUrl: file.fileUrl,
                          fileType: file.fileType,
                          description: file.description,
                          uploadedAt: new Date(file.uploadedAt)
                        }))}
                      onDelete={async (fileId) => {
                        try {
                          await apiRequest('DELETE', `/api/patients/${patientId}/files/${fileId}`);
                          queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'files'] });
                          toast({ title: "Document deleted successfully" });
                        } catch (error) {
                          toast({ title: "Failed to delete document", variant: "destructive" });
                        }
                      }}
                    />
                  </>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinical Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this clinical note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteNoteId(null);
              setShowDeleteDialog(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClinicalNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
