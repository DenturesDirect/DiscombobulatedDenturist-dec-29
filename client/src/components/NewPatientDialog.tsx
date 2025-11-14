import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPatientSchema } from "@shared/schema";
import type { InsertPatient } from "@shared/schema";
import { Loader2, Camera } from "lucide-react";
import { z } from "zod";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (patientId: string) => void;
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

export default function NewPatientDialog({ open, onOpenChange, onSuccess }: NewPatientDialogProps) {
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [uploadedPatientId, setUploadedPatientId] = useState<string | undefined>(undefined);

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema.extend({
      dateOfBirth: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      currentToothShade: z.string().optional(),
      requestedToothShade: z.string().optional(),
      upperDentureType: z.string().optional(),
      lowerDentureType: z.string().optional(),
    })),
    defaultValues: {
      name: "",
      dateOfBirth: undefined,
      phone: undefined,
      email: undefined,
      isCDCP: false,
      copayDiscussed: false,
      currentToothShade: undefined,
      requestedToothShade: undefined,
      upperDentureType: undefined,
      lowerDentureType: undefined,
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "isCDCP" && !value.isCDCP) {
        form.setValue("copayDiscussed", false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
    const submissionData: InsertPatient = {
      name: data.name,
      dateOfBirth: data.dateOfBirth && typeof data.dateOfBirth === 'string' ? data.dateOfBirth.trim() : undefined,
      phone: data.phone && typeof data.phone === 'string' ? data.phone.trim() : undefined,
      email: data.email && typeof data.email === 'string' ? data.email.trim() : undefined,
      isCDCP: data.isCDCP,
      copayDiscussed: data.isCDCP ? data.copayDiscussed : false,
      currentToothShade: data.currentToothShade && typeof data.currentToothShade === 'string' ? data.currentToothShade.trim() : undefined,
      requestedToothShade: data.requestedToothShade && typeof data.requestedToothShade === 'string' ? data.requestedToothShade.trim() : undefined,
      upperDentureType: data.upperDentureType || undefined,
      lowerDentureType: data.lowerDentureType || undefined,
    };
    createPatientMutation.mutate(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-new-patient">
        <DialogHeader>
          <DialogTitle>New Patient</DialogTitle>
          <DialogDescription>
            Add a new patient to your active patient list. Required fields are marked with *.
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
                        data-testid="input-patient-dob"
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
            </div>

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

            <FormField
              control={form.control}
              name="isCDCP"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">CDCP Patient</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Canadian Dental Care Plan coverage
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-cdcp"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("isCDCP") && (
              <FormField
                control={form.control}
                name="copayDiscussed"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Copay Discussed</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Has the copay been discussed with the patient?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-copay-discussed"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentToothShade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Tooth Shade</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-current-shade"
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
                    <FormLabel>Requested Tooth Shade</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-requested-shade"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-4">Denture Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="upperDentureType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upper</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-upper-denture">
                              <SelectValue placeholder="Select type" />
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
                        <FormLabel>Lower</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lower-denture">
                              <SelectValue placeholder="Select type" />
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

                <div>
                  <FormLabel>Patient Photo</FormLabel>
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
                          const url = (uploadedFile.uploadURL as string).split('?')[0];
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
                disabled={createPatientMutation.isPending}
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
