import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, Eye, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";

interface RadiographAnalysisProps {
  patientId: string;
  onSaveAsClinicalNote?: (content: string, label: string) => void;
  disabled?: boolean;
}

export default function RadiographAnalysis({ patientId, onSaveAsClinicalNote, disabled }: RadiographAnalysisProps) {
  const [radiographImages, setRadiographImages] = useState<Array<{ 
    url: string; 
    type: "radiograph" | "cbct"; 
    interpretation?: string; 
    analyzing?: boolean;
    saving?: boolean;
  }>>([]);
  const { toast } = useToast();

  const handleSaveAsNote = async (image: { url: string; type: "radiograph" | "cbct"; interpretation?: string }, index: number) => {
    if (!image.interpretation) {
      toast({
        title: "No Interpretation",
        description: "Please analyze the image first before saving as a clinical note.",
        variant: "destructive",
      });
      return;
    }

    setRadiographImages(prev => 
      prev.map((img, i) => i === index ? { ...img, saving: true } : img)
    );

    try {
      const label = image.type === "cbct" ? "AI analysis of CBCT" : "AI analysis of radiographs";
      const noteContent = `${label}\n\n${image.interpretation}`;

      if (onSaveAsClinicalNote) {
        onSaveAsClinicalNote(noteContent, label);
      } else {
        // Fallback: save directly via API
        await apiRequest('POST', '/api/clinical-notes/save', {
          patientId,
          content: noteContent,
          noteDate: new Date().toISOString(),
        });
      }

      toast({
        title: "Clinical Note Saved",
        description: `The ${image.type === "cbct" ? "CBCT" : "radiograph"} analysis has been saved as a clinical note.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save clinical note.",
        variant: "destructive",
      });
    } finally {
      setRadiographImages(prev => 
        prev.map((img, i) => i === index ? { ...img, saving: false } : img)
      );
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Radiograph / CBCT Scan Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Upload radiographs or CBCT scans for AI-assisted interpretation. After analysis, you can save the interpretation as a clinical note.
          </p>
        </div>

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
                // Extract URL from upload result
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

        {radiographImages.length > 0 && (
          <div className="space-y-3">
            {radiographImages.map((image, index) => (
              <Card key={index} className="p-4 border">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={image.type}
                      onValueChange={(value: "radiograph" | "cbct") => {
                        setRadiographImages(prev => 
                          prev.map((img, i) => i === index ? { ...img, type: value } : img)
                        );
                      }}
                      disabled={disabled}
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
                      disabled={disabled}
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
                      disabled={image.analyzing || disabled}
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
                      disabled={disabled}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {image.interpretation && (
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-semibold mb-2 block">AI Interpretation:</Label>
                        <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {image.interpretation}
                        </div>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveAsNote(image, index)}
                        disabled={image.saving || disabled}
                        className="w-full"
                      >
                        {image.saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save as Clinical Note ({image.type === "cbct" ? "AI analysis of CBCT" : "AI analysis of radiographs"})
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
