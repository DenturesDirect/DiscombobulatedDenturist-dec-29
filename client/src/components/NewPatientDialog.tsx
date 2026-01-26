import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPatientSchema } from "@shared/schema";
import type { InsertPatient } from "@shared/schema";
import { Loader2, Camera } from "lucide-react";
import { z } from "zod";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface Office {
  id: string;
  name: string;
}

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (patientId: string) => void;
  selectedOfficeId?: string | null;
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

export default function NewPatientDialog({ open, onOpenChange, onSuccess, selectedOfficeId }: NewPatientDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canViewAllOffices = user?.canViewAllOffices ?? false;
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [uploadedPatientId, setUploadedPatientId] = useState<string | undefined>(undefined);

  // Fetch offices if user can view all offices
  const { data: offices = [] } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/offices');
      return response.json();
    },
    enabled: canViewAllOffices,
  });

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema.extend({
      phone: z.string().optional(),
      email: z.string().optional(),
      officeId: canViewAllOffices ? z.string().min(1, "Office selection is required") : z.string().optional(),
    })),
    defaultValues: {
      name: "",
      phone: undefined,
      email: undefined,
      officeId: selectedOfficeId || undefined,
    },
  });

  // Update form when selectedOfficeId prop changes
  useEffect(() => {
    if (canViewAllOffices && selectedOfficeId) {
      form.setValue("officeId", selectedOfficeId);
    }
  }, [selectedOfficeId, canViewAllOffices]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        phone: undefined,
        email: undefined,
        officeId: selectedOfficeId || undefined,
      });
      setPhotoUrl(undefined);
    }
  }, [open, selectedOfficeId]);


  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest('POST', '/api/patients', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      
      if (photoUrl) {
        setUploadedPatientId(data.id);
      } else {
        toast({
          title: "Patient Created",
          description: `${data.name} has been added to your patient list.`,
        });
        form.reset();
        setPhotoUrl(undefined);
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(data.id);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create patient",
        variant: "destructive",
      });
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ patientId, photoUrl }: { patientId: string; photoUrl: string }) => {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/photo`, { photoUrl });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Patient Created",
        description: `${data.name} has been added with photo.`,
      });
      form.reset();
      setPhotoUrl(undefined);
      setUploadedPatientId(undefined);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Warning",
        description: "Patient created but photo upload failed.",
        variant: "destructive",
      });
      form.reset();
      setPhotoUrl(undefined);
      setUploadedPatientId(undefined);
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (uploadedPatientId && photoUrl) {
      updatePhotoMutation.mutate({ patientId: uploadedPatientId, photoUrl });
    }
  }, [uploadedPatientId, photoUrl]);

  const onSubmit = (data: InsertPatient) => {
    // For multi-office users, officeId is required
    if (canViewAllOffices && !data.officeId) {
      toast({
        title: "Office Required",
        description: "Please select an office before creating a patient.",
        variant: "destructive",
      });
      return;
    }

    const submissionData: InsertPatient = {
      name: data.name,
      phone: data.phone && typeof data.phone === 'string' ? data.phone.trim() : undefined,
      email: data.email && typeof data.email === 'string' ? data.email.trim() : undefined,
      officeId: data.officeId || undefined,
    };
    createPatientMutation.mutate(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-new-patient">
        <DialogHeader>
          <DialogTitle>New Patient</DialogTitle>
          <DialogDescription>
            Add basic contact information. Clinical details can be added after the first consultation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Smith" 
                      {...field} 
                      data-testid="input-patient-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(555) 123-4567" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-patient-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-patient-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canViewAllOffices && (
              <FormField
                control={form.control}
                name="officeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office *</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an office..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div>
              <FormLabel>Patient Photo (Optional)</FormLabel>
              <div className="mt-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={async () => {
                    const response = await apiRequest('POST', '/api/objects/upload', {});
                    const data = await response.json();
                    return {
                      method: "PUT" as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadedFile = result.successful[0];
                      const rawUrl = uploadedFile.uploadURL as string;
                      // Convert GCS URL to our API endpoint
                      const gcsUrl = new URL(rawUrl);
                      const pathParts = gcsUrl.pathname.split('/');
                      const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                      const objectId = uploadsIndex >= 0 ? pathParts.slice(uploadsIndex).join('/') : pathParts.slice(-2).join('/');
                      const url = `/api/objects/${objectId}`;
                      setPhotoUrl(url);
                      toast({
                        title: "Photo Ready",
                        description: "Photo will be saved when you create the patient.",
                      });
                    }
                  }}
                  buttonClassName="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {photoUrl ? "Change Photo" : "Upload Photo"}
                </ObjectUploader>
                {photoUrl && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Photo uploaded and ready to save
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createPatientMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPatientMutation.isPending || (canViewAllOffices && !form.watch('officeId'))}
                data-testid="button-create-patient"
              >
                {createPatientMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Patient
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
