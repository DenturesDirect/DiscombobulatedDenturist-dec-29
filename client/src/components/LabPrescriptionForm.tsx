import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Send, FileText, AlertTriangle, Mic, MicOff, Upload, X, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";

interface LabPrescriptionFormProps {
  patientName: string;
  onSubmit: (prescription: LabPrescriptionData) => void;
  disabled?: boolean;
}

export interface LabPrescriptionData {
  labName: string;
  caseTypeUpper?: string;
  caseTypeLower?: string;
  fabricationStageUpper?: string;
  fabricationStageLower?: string;
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
  const [caseTypeUpper, setCaseTypeUpper] = useState("");
  const [caseTypeLower, setCaseTypeLower] = useState("");
  const [fabricationStageUpper, setFabricationStageUpper] = useState("");
  const [fabricationStageLower, setFabricationStageLower] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [designInstructions, setDesignInstructions] = useState("");
  const [interimDesignText, setInterimDesignText] = useState("");
  const [isListeningDesign, setIsListeningDesign] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [existingDentureReference, setExistingDentureReference] = useState("");
  const [biteNotes, setBiteNotes] = useState("");
  const [shippingInstructions, setShippingInstructions] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [radiographImages, setRadiographImages] = useState<Array<{ url: string; type: "radiograph" | "cbct"; interpretation?: string; analyzing?: boolean }>>([]);
  const recognitionRef = useRef<any>(null);
  const designTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Voice input setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsVoiceSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setDesignInstructions(prev => prev + finalTranscript);
            setInterimDesignText('');
          }
          if (interimTranscript) {
            setInterimDesignText(interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListeningDesign(false);
          toast({
            title: "Voice input error",
            description: "Please check your microphone permissions and try again.",
            variant: "destructive"
          });
        };

        recognition.onend = () => {
          setIsListeningDesign(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    if (isListeningDesign) {
      recognitionRef.current.stop();
      setIsListeningDesign(false);
      setInterimDesignText('');
    } else {
      recognitionRef.current.start();
      setIsListeningDesign(true);
    }
  };

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
      caseTypeUpper: caseTypeUpper && caseTypeUpper.trim() ? caseTypeUpper.trim() : undefined,
      caseTypeLower: caseTypeLower && caseTypeLower.trim() ? caseTypeLower.trim() : undefined,
      fabricationStageUpper: caseTypeUpper && fabricationStageUpper && fabricationStageUpper.trim() ? fabricationStageUpper.trim() : undefined,
      fabricationStageLower: caseTypeLower && fabricationStageLower && fabricationStageLower.trim() ? fabricationStageLower.trim() : undefined,
      deadline: deadline && deadline.trim() ? new Date(deadline) : undefined,
      digitalFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
      designInstructions: designInstructions && designInstructions.trim() ? designInstructions.trim() : undefined,
      existingDentureReference: existingDentureReference && existingDentureReference.trim() ? existingDentureReference.trim() : undefined,
      biteNotes: biteNotes && biteNotes.trim() ? biteNotes.trim() : undefined,
      shippingInstructions: shippingInstructions && shippingInstructions.trim() ? shippingInstructions.trim() : undefined,
      specialNotes: specialNotes && specialNotes.trim() ? specialNotes.trim() : undefined
    };
    onSubmit(prescription);
    
    setLabName("");
    setCaseTypeUpper("");
    setCaseTypeLower("");
    setFabricationStageUpper("");
    setFabricationStageLower("");
    setDeadline("");
    setSelectedFiles([]);
    setDesignInstructions("");
    setExistingDentureReference("");
    setBiteNotes("");
    setShippingInstructions("");
    setSpecialNotes("");
  };

  const isValid = labName && 
    (caseTypeUpper || caseTypeLower) && 
    (!caseTypeUpper || fabricationStageUpper) && 
    (!caseTypeLower || fabricationStageLower);

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case-type-upper">Case Type - Upper (Max/Maxillary)</Label>
              <Select value={caseTypeUpper || "none"} onValueChange={(val) => setCaseTypeUpper(val === "none" ? "" : val)}>
                <SelectTrigger id="case-type-upper" data-testid="select-case-type-upper">
                  <SelectValue placeholder="Select upper case type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">N/A</SelectItem>
                  {CASE_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {caseTypeUpper && (
              <div className="space-y-2">
                <Label htmlFor="fabrication-stage-upper">Fabrication Stage - Upper *</Label>
                <Select value={fabricationStageUpper || undefined} onValueChange={(val) => setFabricationStageUpper(val || "")}>
                  <SelectTrigger id="fabrication-stage-upper" data-testid="select-fabrication-stage-upper">
                    <SelectValue placeholder="Select stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRICATION_STAGES.map(fs => (
                      <SelectItem key={fs.value} value={fs.value}>{fs.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case-type-lower">Case Type - Lower (Mand)</Label>
              <Select value={caseTypeLower || "none"} onValueChange={(val) => setCaseTypeLower(val === "none" ? "" : val)}>
                <SelectTrigger id="case-type-lower" data-testid="select-case-type-lower">
                  <SelectValue placeholder="Select lower case type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">N/A</SelectItem>
                  {CASE_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {caseTypeLower && (
              <div className="space-y-2">
                <Label htmlFor="fabrication-stage-lower">Fabrication Stage - Lower *</Label>
                <Select value={fabricationStageLower || undefined} onValueChange={(val) => setFabricationStageLower(val || "")}>
                  <SelectTrigger id="fabrication-stage-lower" data-testid="select-fabrication-stage-lower">
                    <SelectValue placeholder="Select stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRICATION_STAGES.map(fs => (
                      <SelectItem key={fs.value} value={fs.value}>{fs.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        {!caseTypeUpper && !caseTypeLower && (
          <p className="text-sm text-destructive">At least one case type (Upper or Lower) is required</p>
        )}
        {caseTypeUpper && !fabricationStageUpper && (
          <p className="text-sm text-destructive">Fabrication Stage - Upper is required when Upper case type is selected</p>
        )}
        {caseTypeLower && !fabricationStageLower && (
          <p className="text-sm text-destructive">Fabrication Stage - Lower is required when Lower case type is selected</p>
        )}

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
          <div className="relative">
            <Textarea
              ref={designTextareaRef}
              id="design-instructions"
              placeholder="Specify major connector type, rests, clasps, finish lines, coverage, occlusal scheme, relief areas, etc. Labs will NOT assume any design elements not explicitly stated."
              value={designInstructions + interimDesignText}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length < designInstructions.length) {
                  setDesignInstructions(newValue);
                  setInterimDesignText("");
                } else {
                  setDesignInstructions(newValue);
                }
              }}
              className="min-h-[100px] pr-14"
              data-testid="input-design-instructions"
            />
            <Button
              type="button"
              size="icon"
              variant={isListeningDesign ? "default" : "ghost"}
              className={`absolute top-3 right-3 w-10 h-10 ${isListeningDesign ? 'animate-pulse bg-destructive hover:bg-destructive' : ''}`}
              onClick={toggleVoiceInput}
              disabled={disabled || !isVoiceSupported}
              title={isListeningDesign ? "Stop recording" : "Start voice input"}
            >
              {isListeningDesign ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>
          {isListeningDesign && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span>Recording - Click the red mic button again to stop</span>
            </div>
          )}
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

      <div className="space-y-4 border-t pt-4">
        <div className="space-y-2">
          <Label>Radiograph / CBCT Scan Analysis</Label>
          <p className="text-sm text-muted-foreground">
            Upload radiographs or CBCT scans for AI-assisted interpretation. The analysis will include a disclaimer that it is for interpretation only and not for diagnostic purposes.
          </p>
          
          <ObjectUploader
            maxNumberOfFiles={5}
            maxFileSize={10 * 1024 * 1024} // 10MB
            onGetUploadParameters={async () => {
              const response = await apiRequest('POST', '/api/objects/upload', {});
              const data = await response.json();
              return {
                method: "PUT" as const,
                url: data.uploadURL,
              };
            }}
            onComplete={(result) => {
              if (result.successful && result.successful.length > 0) {
                const uploadedFiles = result.successful.map((file: any) => {
                  // Extract URL from upload result (similar to NewPatientDialog)
                  const rawUrl = file.uploadURL as string;
                  let url = rawUrl;
                  
                  // Convert GCS URL to our API endpoint format
                  if (rawUrl && rawUrl.includes('uploads')) {
                    try {
                      const gcsUrl = new URL(rawUrl);
                      const pathParts = gcsUrl.pathname.split('/');
                      const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
                      const objectId = uploadsIndex >= 0 ? pathParts.slice(uploadsIndex).join('/') : pathParts.slice(-2).join('/');
                      url = `/api/objects/${objectId}`;
                    } catch (e) {
                      // If URL parsing fails, use the raw URL
                      console.error("Error parsing upload URL:", e);
                    }
                  }
                  
                  return {
                    url,
                    type: "radiograph" as const,
                  };
                });
                setRadiographImages(prev => [...prev, ...uploadedFiles]);
                toast({
                  title: "Images Uploaded",
                  description: `${uploadedFiles.length} image(s) uploaded successfully.`,
                });
              }
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Radiograph/CBCT
          </ObjectUploader>
        </div>

        {radiographImages.length > 0 && (
          <div className="space-y-3">
            {radiographImages.map((image, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={image.type}
                        onValueChange={(value: "radiograph" | "cbct") => {
                          setRadiographImages(prev => 
                            prev.map((img, i) => i === index ? { ...img, type: value } : img)
                          );
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="radiograph">Radiograph</SelectItem>
                          <SelectItem value="cbct">CBCT Scan</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const imageUrl = image.url.startsWith('http') 
                            ? image.url 
                            : image.url.startsWith('/api/objects/')
                            ? `${window.location.origin}${image.url}`
                            : `${window.location.origin}${image.url}`;
                          window.open(imageUrl, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setRadiographImages(prev => 
                            prev.map((img, i) => i === index ? { ...img, analyzing: true } : img)
                          );
                          
                          try {
                            // Send the URL as-is (backend will handle conversion)
                            const response = await apiRequest('POST', '/api/analyze-radiograph', {
                              imageUrl: image.url,
                              imageType: image.type,
                            });
                            const data = await response.json();
                            
                            setRadiographImages(prev => 
                              prev.map((img, i) => 
                                i === index 
                                  ? { ...img, interpretation: data.interpretation, analyzing: false }
                                  : img
                              )
                            );
                            
                            toast({
                              title: "Analysis Complete",
                              description: "AI interpretation has been generated.",
                            });
                          } catch (error: any) {
                            setRadiographImages(prev => 
                              prev.map((img, i) => i === index ? { ...img, analyzing: false } : img)
                            );
                            toast({
                              title: "Analysis Failed",
                              description: error.message || "Failed to analyze image. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={image.analyzing}
                      >
                        {image.analyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          "Analyze with AI"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRadiographImages(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {image.interpretation && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-semibold mb-2 block">AI Interpretation:</Label>
                        <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {image.interpretation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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
