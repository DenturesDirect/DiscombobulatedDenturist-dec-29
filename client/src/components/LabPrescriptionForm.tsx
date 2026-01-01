import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Send, FileText, AlertTriangle } from "lucide-react";

interface LabPrescriptionFormProps {
  patientName: string;
  onSubmit: (prescription: LabPrescriptionData) => void;
  disabled?: boolean;
}

export interface LabPrescriptionData {
  labName: string;
  caseType: string;
  arch: string;
  fabricationStage: string;
  deadline?: Date;
  digitalFiles?: string[];
  designInstructions?: string;
  existingDentureReference?: string;
  biteNotes?: string;
  shippingInstructions?: string;
  specialNotes?: string;
}

const LABS = [
  { value: "vivi_labs", label: "Vivi Labs (Hong Kong)" },
  { value: "vital_lab", label: "Vital Lab (Ottawa)" },
  { value: "aesthetic_minds", label: "Aesthetic Minds (Mississauga)" }
];

const CASE_TYPES = [
  { value: "cast_partial", label: "Cast Partial" },
  { value: "complete_denture", label: "Complete Denture" },
  { value: "implant_retained", label: "Implant-Retained Denture" },
  { value: "repair", label: "Repair" },
  { value: "tooth_addition", label: "Tooth Addition" },
  { value: "reline", label: "Reline" }
];

const ARCHES = [
  { value: "upper", label: "Upper" },
  { value: "lower", label: "Lower" },
  { value: "both", label: "Both" }
];

const FABRICATION_STAGES = [
  { value: "framework_only", label: "Framework Only" },
  { value: "try_in", label: "Try-In" },
  { value: "finish", label: "Finish" },
  { value: "repair", label: "Repair" }
];

const DIGITAL_FILE_OPTIONS = [
  "Maxillary Scan",
  "Mandibular Scan",
  "Vestibular Scan",
  "Intraoral Scan",
  "CBCT"
];

const EXISTING_DENTURE_OPTIONS = [
  { value: "closely_followed", label: "Closely Followed" },
  { value: "loose_reference", label: "Loose Reference" },
  { value: "intentionally_modified", label: "Intentionally Modified" },
  { value: "not_applicable", label: "N/A - New Case" }
];

const SHIPPING_OPTIONS = [
  { value: "digital_only", label: "Digital Only Return" },
  { value: "physical_model", label: "Physical Model Return" },
  { value: "framework_and_model", label: "Framework + Model Return" },
  { value: "finished_case", label: "Finished Case Return" }
];

export default function LabPrescriptionForm({ patientName, onSubmit, disabled }: LabPrescriptionFormProps) {
  const [labName, setLabName] = useState("");
  const [caseType, setCaseType] = useState("");
  const [arch, setArch] = useState("");
  const [fabricationStage, setFabricationStage] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [designInstructions, setDesignInstructions] = useState("");
  const [existingDentureReference, setExistingDentureReference] = useState("");
  const [biteNotes, setBiteNotes] = useState("");
  const [shippingInstructions, setShippingInstructions] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  const toggleFile = (file: string) => {
    setSelectedFiles(prev => 
      prev.includes(file) 
        ? prev.filter(f => f !== file)
        : [...prev, file]
    );
  };

  const handleSubmit = () => {
    const prescription: LabPrescriptionData = {
      labName,
      caseType,
      arch,
      fabricationStage,
      deadline: deadline ? new Date(deadline) : undefined,
      digitalFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
      designInstructions: designInstructions || undefined,
      existingDentureReference: existingDentureReference || undefined,
      biteNotes: biteNotes || undefined,
      shippingInstructions: shippingInstructions || undefined,
      specialNotes: specialNotes || undefined
    };
    onSubmit(prescription);
    
    setLabName("");
    setCaseType("");
    setArch("");
    setFabricationStage("");
    setDeadline("");
    setSelectedFiles([]);
    setDesignInstructions("");
    setExistingDentureReference("");
    setBiteNotes("");
    setShippingInstructions("");
    setSpecialNotes("");
  };

  const isValid = labName && caseType && arch && fabricationStage;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Lab Prescription Rules</p>
            <p className="text-muted-foreground">
              Labs fabricate only what is explicitly written. If a design element is not stated, it will not be assumed, inferred, or added.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lab-name">Lab Name *</Label>
            <Select value={labName} onValueChange={setLabName}>
              <SelectTrigger id="lab-name" data-testid="select-lab-name">
                <SelectValue placeholder="Select lab..." />
              </SelectTrigger>
              <SelectContent>
                {LABS.map(lab => (
                  <SelectItem key={lab.value} value={lab.value}>{lab.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case-type">Case Type *</Label>
            <Select value={caseType} onValueChange={setCaseType}>
              <SelectTrigger id="case-type" data-testid="select-case-type">
                <SelectValue placeholder="Select case type..." />
              </SelectTrigger>
              <SelectContent>
                {CASE_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="arch">Arch *</Label>
            <Select value={arch} onValueChange={setArch}>
              <SelectTrigger id="arch" data-testid="select-arch">
                <SelectValue placeholder="Select arch..." />
              </SelectTrigger>
              <SelectContent>
                {ARCHES.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabrication-stage">Fabrication Stage *</Label>
            <Select value={fabricationStage} onValueChange={setFabricationStage}>
              <SelectTrigger id="fabrication-stage" data-testid="select-fabrication-stage">
                <SelectValue placeholder="Select stage..." />
              </SelectTrigger>
              <SelectContent>
                {FABRICATION_STAGES.map(fs => (
                  <SelectItem key={fs.value} value={fs.value}>{fs.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline / Required Arrival Date</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            data-testid="input-deadline"
          />
        </div>

        <div className="space-y-2">
          <Label>Digital Files Provided</Label>
          <div className="flex flex-wrap gap-2">
            {DIGITAL_FILE_OPTIONS.map(file => (
              <Badge 
                key={file}
                variant={selectedFiles.includes(file) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFile(file)}
                data-testid={`badge-file-${file.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {file}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="existing-denture">Existing Denture Reference</Label>
          <Select value={existingDentureReference} onValueChange={setExistingDentureReference}>
            <SelectTrigger id="existing-denture" data-testid="select-existing-denture">
              <SelectValue placeholder="Select reference type..." />
            </SelectTrigger>
            <SelectContent>
              {EXISTING_DENTURE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="design-instructions">Design Instructions</Label>
          <Textarea
            id="design-instructions"
            placeholder="Specify major connector type, rests, clasps, finish lines, coverage, occlusal scheme, relief areas, etc. Labs will NOT assume any design elements not explicitly stated."
            value={designInstructions}
            onChange={(e) => setDesignInstructions(e.target.value)}
            className="min-h-[100px]"
            data-testid="input-design-instructions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bite-notes">Bite / Occlusion Notes</Label>
          <Textarea
            id="bite-notes"
            placeholder="If bite information is provisional, limited, or incomplete, state this explicitly. Labs may only alter occlusion when explicitly authorized."
            value={biteNotes}
            onChange={(e) => setBiteNotes(e.target.value)}
            className="min-h-[80px]"
            data-testid="input-bite-notes"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shipping">Shipping / Return Instructions</Label>
          <Select value={shippingInstructions} onValueChange={setShippingInstructions}>
            <SelectTrigger id="shipping" data-testid="select-shipping">
              <SelectValue placeholder="Select shipping instructions..." />
            </SelectTrigger>
            <SelectContent>
              {SHIPPING_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="special-notes">Special Notes / Additional Instructions</Label>
          <Textarea
            id="special-notes"
            placeholder="Any additional instructions, rush requests, or special requirements..."
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            className="min-h-[80px]"
            data-testid="input-special-notes"
          />
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">Default Safety Clause (Auto-included):</p>
        <p>"No unstated design decisions are authorized. Please confirm any uncertainty prior to fabrication."</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid || disabled}
        className="w-full h-11"
        data-testid="button-submit-prescription"
      >
        <FileText className="w-4 h-4 mr-2" />
        Create Lab Prescription
      </Button>
    </div>
  );
}
