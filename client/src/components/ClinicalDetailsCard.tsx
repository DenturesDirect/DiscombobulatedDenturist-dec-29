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
});

type ClinicalDetailsFormData = z.infer<typeof clinicalDetailsSchema>;

export default function ClinicalDetailsCard({ patient }: ClinicalDetailsCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ClinicalDetailsFormData>({
    resolver: zodResolver(clinicalDetailsSchema),
    defaultValues: {
      dateOfBirth: patient.dateOfBirth || "",
      currentToothShade: patient.currentToothShade || "",
      requestedToothShade: patient.requestedToothShade || "",
      upperDentureType: patient.upperDentureType || "None",
      lowerDentureType: patient.lowerDentureType || "None",
      isCDCP: patient.isCDCP || false,
      workInsurance: patient.workInsurance || false,
    },
  });

  // Reset form when patient data changes (e.g., after save) - but only when NOT editing
  useEffect(() => {
    if (!isEditing) {
      form.reset({
        dateOfBirth: patient.dateOfBirth || "",
        currentToothShade: patient.currentToothShade || "",
        requestedToothShade: patient.requestedToothShade || "",
        upperDentureType: patient.upperDentureType || "None",
        lowerDentureType: patient.lowerDentureType || "None",
        isCDCP: patient.isCDCP || false,
        workInsurance: patient.workInsurance || false,
      });
    }
  }, [patient, form, isEditing]);

  const updateClinicalDetailsMutation = useMutation({
    mutationFn: async (data: ClinicalDetailsFormData) => {
      const response = await apiRequest('PATCH', `/api/patients/${patient.id}`, data);
      return response.json();
    },
    onSuccess: () => {
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
    updateClinicalDetailsMutation.mutate(data);
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium" data-testid="text-dob">
                  {patient.dateOfBirth || "Not set"}
                </p>
              </div>
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
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        data-testid="input-edit-dob"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
