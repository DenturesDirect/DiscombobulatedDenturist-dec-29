import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { z } from "zod";

interface ClinicalDetailsCardProps {
  patient: Patient;
}

const DENTURE_TYPES = [
  "None",
  "Complete",
  "Acrylic Partial",
  "Cast Partial",
  "Repair",
  "Tooth Addition",
  "Reline",
  "Rebase",
  "Implant Retained"
];

const clinicalDetailsSchema = z.object({
  dateOfBirth: z.string().optional(),
  currentToothShade: z.string().optional(),
  requestedToothShade: z.string().optional(),
  upperDentureType: z.string().optional(),
  lowerDentureType: z.string().optional(),
  isCDCP: z.boolean().optional(),
  workInsurance: z.boolean().optional(),
  lastStepCompleted: z.string().optional(),
  nextStep: z.string().optional(),
  examPaid: z.enum(["yes", "no", "not applicable"]).nullable().optional(),
  repairPaid: z.enum(["yes", "no", "not applicable"]).nullable().optional(),
  newDenturePaid: z.enum(["yes", "no", "not applicable"]).nullable().optional(),
  predeterminationStatus: z.enum(["not applicable", "pending", "predesent", "approved", "not approved", "predeterminate"]).nullable().optional(),
  treatmentInitiationDate: z.string().optional(),
});

type ClinicalDetailsFormData = z.infer<typeof clinicalDetailsSchema>;

export default function ClinicalDetailsCard({ patient }: ClinicalDetailsCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ClinicalDetailsFormData>({
    resolver: zodResolver(clinicalDetailsSchema),
    defaultValues: (() => {
      // #region agent log
      const initDateValue = patient.treatmentInitiationDate;
      const initDateType = typeof initDateValue;
      const initDateIsDate = initDateValue instanceof Date;
      const initDateStr = String(initDateValue);
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:69',message:'Form defaultValues - treatmentInitiationDate analysis',data:{hasValue:!!initDateValue,type:initDateType,isDate:initDateIsDate,value:initDateStr,valueLength:initDateStr?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      let formattedDate = "";
      if (initDateValue) {
        try {
          if (initDateValue instanceof Date) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:77',message:'Form defaultValues - Date path',data:{dateValue:initDateValue.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            formattedDate = initDateValue.toISOString().split('T')[0];
          } else if (typeof initDateValue === 'string') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:81',message:'Form defaultValues - string path',data:{stringValue:initDateValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            formattedDate = initDateValue.split('T')[0];
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:85',message:'Form defaultValues - other type, attempting Date conversion',data:{type:typeof initDateValue,value:String(initDateValue)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            const dateObj = new Date(initDateValue as any);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().split('T')[0];
            }
          }
        } catch (error: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:92',message:'Form defaultValues - ERROR formatting date',data:{errorMessage:error?.message,errorStack:error?.stack,originalValue:initDateValue,originalType:typeof initDateValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          formattedDate = "";
        }
      }
      return {
        dateOfBirth: patient.dateOfBirth || "",
        currentToothShade: patient.currentToothShade || "",
        requestedToothShade: patient.requestedToothShade || "",
        upperDentureType: patient.upperDentureType || "None",
        lowerDentureType: patient.lowerDentureType || "None",
        isCDCP: patient.isCDCP || false,
        workInsurance: patient.workInsurance || false,
        lastStepCompleted: patient.lastStepCompleted || "",
        nextStep: patient.nextStep || "",
        examPaid: (patient.examPaid as "yes" | "no" | "not applicable" | null) || null,
        repairPaid: (patient.repairPaid as "yes" | "no" | "not applicable" | null) || null,
        newDenturePaid: (patient.newDenturePaid as "yes" | "no" | "not applicable" | null) || null,
        predeterminationStatus: (patient.predeterminationStatus as "not applicable" | "pending" | "predesent" | "approved" | "not approved" | "predeterminate" | null) || null,
        treatmentInitiationDate: formattedDate,
      };
    })(),
  });

  // Reset form when patient data changes (e.g., after save) - but only when NOT editing
  useEffect(() => {
    if (!isEditing) {
      // #region agent log
      const resetDateValue = patient.treatmentInitiationDate;
      const resetDateType = typeof resetDateValue;
      const resetDateIsDate = resetDateValue instanceof Date;
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:120',message:'useEffect form.reset - treatmentInitiationDate analysis',data:{hasValue:!!resetDateValue,type:resetDateType,isDate:resetDateIsDate,value:String(resetDateValue)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      let formattedDate = "";
      if (resetDateValue) {
        try {
          if (resetDateValue instanceof Date) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:127',message:'useEffect form.reset - Date path',data:{dateValue:resetDateValue.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            formattedDate = resetDateValue.toISOString().split('T')[0];
          } else if (typeof resetDateValue === 'string') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:131',message:'useEffect form.reset - string path',data:{stringValue:resetDateValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            formattedDate = resetDateValue.split('T')[0];
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:135',message:'useEffect form.reset - other type, attempting Date conversion',data:{type:typeof resetDateValue,value:String(resetDateValue)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            const dateObj = new Date(resetDateValue as any);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().split('T')[0];
            }
          }
        } catch (error: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:142',message:'useEffect form.reset - ERROR formatting date',data:{errorMessage:error?.message,errorStack:error?.stack,originalValue:resetDateValue,originalType:typeof resetDateValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          formattedDate = "";
        }
      }
      form.reset({
        dateOfBirth: patient.dateOfBirth || "",
        currentToothShade: patient.currentToothShade || "",
        requestedToothShade: patient.requestedToothShade || "",
        upperDentureType: patient.upperDentureType || "None",
        lowerDentureType: patient.lowerDentureType || "None",
        isCDCP: patient.isCDCP || false,
        workInsurance: patient.workInsurance || false,
        lastStepCompleted: patient.lastStepCompleted || "",
        nextStep: patient.nextStep || "",
        examPaid: (patient.examPaid as "yes" | "no" | "not applicable" | null) || null,
        repairPaid: (patient.repairPaid as "yes" | "no" | "not applicable" | null) || null,
        newDenturePaid: (patient.newDenturePaid as "yes" | "no" | "not applicable" | null) || null,
        predeterminationStatus: (patient.predeterminationStatus as "not applicable" | "pending" | "predesent" | "approved" | "not approved" | "predeterminate" | null) || null,
        treatmentInitiationDate: formattedDate,
      });
    }
  }, [patient, form, isEditing]);

  const updateClinicalDetailsMutation = useMutation({
    mutationFn: async (data: ClinicalDetailsFormData) => {
      const response = await apiRequest('PATCH', `/api/patients/${patient.id}`, data);
      return response.json();
    },
    onSuccess: (updatedPatient) => {
      // #region agent log
      const successDateValue = updatedPatient.treatmentInitiationDate;
      const successDateType = typeof successDateValue;
      const successDateIsDate = successDateValue instanceof Date;
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:164',message:'onSuccess form.reset - treatmentInitiationDate analysis',data:{hasValue:!!successDateValue,type:successDateType,isDate:successDateIsDate,value:String(successDateValue)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Reset form with the fresh data from the mutation response
      let formattedDate = "";
      if (successDateValue) {
        try {
          if (successDateValue instanceof Date) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:171',message:'onSuccess form.reset - Date path',data:{dateValue:successDateValue.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            formattedDate = successDateValue.toISOString().split('T')[0];
          } else if (typeof successDateValue === 'string') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:175',message:'onSuccess form.reset - string path',data:{stringValue:successDateValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            formattedDate = successDateValue.split('T')[0];
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:179',message:'onSuccess form.reset - other type, attempting Date conversion',data:{type:typeof successDateValue,value:String(successDateValue)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            const dateObj = new Date(successDateValue as any);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().split('T')[0];
            }
          }
        } catch (error: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:186',message:'onSuccess form.reset - ERROR formatting date',data:{errorMessage:error?.message,errorStack:error?.stack,originalValue:successDateValue,originalType:typeof successDateValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          formattedDate = "";
        }
      }
      form.reset({
        dateOfBirth: updatedPatient.dateOfBirth || "",
        currentToothShade: updatedPatient.currentToothShade || "",
        requestedToothShade: updatedPatient.requestedToothShade || "",
        upperDentureType: updatedPatient.upperDentureType || "None",
        lowerDentureType: updatedPatient.lowerDentureType || "None",
        isCDCP: updatedPatient.isCDCP || false,
        workInsurance: updatedPatient.workInsurance || false,
        lastStepCompleted: updatedPatient.lastStepCompleted || "",
        nextStep: updatedPatient.nextStep || "",
        examPaid: (updatedPatient.examPaid as "yes" | "no" | "not applicable" | null) || null,
        repairPaid: (updatedPatient.repairPaid as "yes" | "no" | "not applicable" | null) || null,
        newDenturePaid: (updatedPatient.newDenturePaid as "yes" | "no" | "not applicable" | null) || null,
        predeterminationStatus: (updatedPatient.predeterminationStatus as "not applicable" | "pending" | "approved" | "not approved" | null) || null,
        treatmentInitiationDate: formattedDate,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Clinical Details Updated",
        description: "Patient information has been saved.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update clinical details",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClinicalDetailsFormData) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:166',message:'onSubmit entry',data:{hasTreatmentInitiationDate:!!data.treatmentInitiationDate,treatmentInitiationDate:data.treatmentInitiationDate||null,treatmentInitiationDateType:typeof data.treatmentInitiationDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Clean up the data before sending - convert empty strings to null/undefined for optional fields
    const cleanedData = {
      ...data,
      // Convert empty string dates to null
      treatmentInitiationDate: data.treatmentInitiationDate && data.treatmentInitiationDate.trim() 
        ? data.treatmentInitiationDate.trim() 
        : undefined,
      dateOfBirth: data.dateOfBirth && data.dateOfBirth.trim() 
        ? data.dateOfBirth.trim() 
        : undefined,
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalDetailsCard.tsx:178',message:'onSubmit before mutate',data:{cleanedTreatmentInitiationDate:cleanedData.treatmentInitiationDate||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    updateClinicalDetailsMutation.mutate(cleanedData);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Clinical Details</CardTitle>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            data-testid="button-edit-clinical"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-3 text-sm">
            <div className="pb-2 border-b">
              <p className="text-muted-foreground mb-2">Predetermination Status</p>
              <p className="font-medium" data-testid="text-predetermination-status">
                {patient.predeterminationStatus 
                  ? patient.predeterminationStatus === "not applicable" 
                    ? "Not Applicable"
                    : patient.predeterminationStatus === "pending"
                    ? "Pre-D Pending"
                    : patient.predeterminationStatus === "predesent"
                    ? "Pre-D Sent"
                    : patient.predeterminationStatus === "approved"
                    ? "Pre-D Approved"
                    : patient.predeterminationStatus === "not approved"
                    ? "Pre-D Not Approved"
                    : patient.predeterminationStatus === "predeterminate"
                    ? "Predeterminate"
                    : patient.predeterminationStatus
                  : "Not set"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium" data-testid="text-dob">
                  {patient.dateOfBirth || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Treatment Initiation</p>
                <p className="font-medium" data-testid="text-treatment-initiation">
                  {(() => {
                    if (!patient.treatmentInitiationDate) return "Not set";
                    try {
                      // Handle different date formats from database
                      let date: Date;
                      if (patient.treatmentInitiationDate instanceof Date) {
                        date = patient.treatmentInitiationDate;
                      } else if (typeof patient.treatmentInitiationDate === 'string') {
                        date = new Date(patient.treatmentInitiationDate);
                      } else {
                        date = new Date(String(patient.treatmentInitiationDate));
                      }
                      
                      // Check if date is valid
                      if (!date || isNaN(date.getTime())) {
                        return "Invalid date";
                      }
                      
                      // Ensure toLocaleDateString exists (should always exist on Date objects)
                      if (typeof date.toLocaleDateString === 'function') {
                        return date.toLocaleDateString();
                      } else {
                        // Fallback formatting
                        return date.toISOString().split('T')[0];
                      }
                    } catch (error) {
                      // If anything fails, try to display the raw value
                      return String(patient.treatmentInitiationDate || "Invalid date");
                    }
                  })()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Insurance</p>
                <div className="flex gap-2">
                  {patient.isCDCP && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded" data-testid="badge-cdcp">
                      CDCP
                    </span>
                  )}
                  {patient.workInsurance && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded" data-testid="badge-work-insurance">
                      Work
                    </span>
                  )}
                  {!patient.isCDCP && !patient.workInsurance && (
                    <p className="font-medium">None</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Current Shade</p>
                <p className="font-medium" data-testid="text-current-shade">
                  {patient.currentToothShade || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Requested Shade</p>
                <p className="font-medium" data-testid="text-requested-shade">
                  {patient.requestedToothShade || "Not set"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Upper Denture</p>
                <p className="font-medium" data-testid="text-upper-denture">
                  {patient.upperDentureType || "None"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lower Denture</p>
                <p className="font-medium" data-testid="text-lower-denture">
                  {patient.lowerDentureType || "None"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Current Step</p>
                <p className="font-medium" data-testid="text-current-step">
                  {patient.lastStepCompleted || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Next Step</p>
                <p className="font-medium" data-testid="text-next-step">
                  {patient.nextStep || "Not set"}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div>
                <p className="text-muted-foreground mb-2">Exam Paid</p>
                <p className="font-medium" data-testid="text-exam-paid">
                  {patient.examPaid ? patient.examPaid.charAt(0).toUpperCase() + patient.examPaid.slice(1) : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Repair Paid</p>
                <p className="font-medium" data-testid="text-repair-paid">
                  {patient.repairPaid ? patient.repairPaid.charAt(0).toUpperCase() + patient.repairPaid.slice(1) : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">New Denture Paid</p>
                <p className="font-medium" data-testid="text-new-denture-paid">
                  {patient.newDenturePaid ? patient.newDenturePaid.charAt(0).toUpperCase() + patient.newDenturePaid.slice(1) : "Not set"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="predeterminationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Predetermination Status</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={field.value === "not applicable" ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange("not applicable")}
                          data-testid="button-predetermination-na"
                        >
                          Not Applicable
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "pending" ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange("pending")}
                          data-testid="button-predetermination-pending"
                        >
                          Pre-D Pending
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "predesent" ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange("predesent")}
                          data-testid="button-predetermination-predesent"
                        >
                          Pre-D Sent
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "approved" ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange("approved")}
                          data-testid="button-predetermination-approved"
                        >
                          Pre-D Approved
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "not approved" ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange("not approved")}
                          data-testid="button-predetermination-not-approved"
                        >
                          Pre-D Not Approved
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "predeterminate" ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange("predeterminate")}
                          data-testid="button-predetermination-predeterminate"
                        >
                          Predeterminate
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          disabled={false}
                          data-testid="input-edit-dob"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="treatmentInitiationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Initiation Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          disabled={false}
                          data-testid="input-edit-treatment-initiation"
                          placeholder="Date treatment started"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        For imported charts, this should be the upload date or actual treatment start date
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Insurance</FormLabel>
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="isCDCP"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-edit-cdcp"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">CDCP</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workInsurance"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-edit-work-insurance"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Work Insurance</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentToothShade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Shade</FormLabel>
                      <FormControl>
                        <Input
                          placeholder=""
                          {...field}
                          value={field.value || ""}
                          disabled={false}
                          data-testid="input-edit-current-shade"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestedToothShade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Shade</FormLabel>
                      <FormControl>
                        <Input
                          placeholder=""
                          {...field}
                          value={field.value || ""}
                          disabled={false}
                          data-testid="input-edit-requested-shade"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="upperDentureType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upper Denture</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "None"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-upper-denture">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DENTURE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lowerDentureType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lower Denture</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "None"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-lower-denture">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DENTURE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastStepCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Step</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Impressions Complete"
                          {...field}
                          value={field.value || ""}
                          disabled={false}
                          data-testid="input-edit-current-step"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextStep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Step</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Bite Blocks"
                          {...field}
                          value={field.value || ""}
                          disabled={false}
                          data-testid="input-edit-next-step"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-2 border-t">
                <FormField
                  control={form.control}
                  name="examPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Paid</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={field.value === "yes" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("yes")}
                            data-testid="button-exam-paid-yes"
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "no" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("no")}
                            data-testid="button-exam-paid-no"
                          >
                            No
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "not applicable" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("not applicable")}
                            data-testid="button-exam-paid-na"
                          >
                            Not Applicable
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Paid</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={field.value === "yes" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("yes")}
                            data-testid="button-repair-paid-yes"
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "no" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("no")}
                            data-testid="button-repair-paid-no"
                          >
                            No
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "not applicable" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("not applicable")}
                            data-testid="button-repair-paid-na"
                          >
                            Not Applicable
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newDenturePaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Denture Paid</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={field.value === "yes" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("yes")}
                            data-testid="button-new-denture-paid-yes"
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "no" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("no")}
                            data-testid="button-new-denture-paid-no"
                          >
                            No
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "not applicable" ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange("not applicable")}
                            data-testid="button-new-denture-paid-na"
                          >
                            Not Applicable
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateClinicalDetailsMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateClinicalDetailsMutation.isPending}
                  data-testid="button-save-clinical"
                >
                  {updateClinicalDetailsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
