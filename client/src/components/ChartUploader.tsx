import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartUploaderProps {
  patientId: string;
  patientName: string;
  onSummaryReady?: (summary: string) => void;
  onCancel?: () => void;
}

export default function ChartUploader({ patientId, patientName, onSummaryReady, onCancel }: ChartUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a PDF file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setSummary(""); // Clear previous summary
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("chart", file);

      // Use fetch directly for file uploads (apiRequest always sets Content-Type to JSON)
      const response = await fetch(`/api/patients/${patientId}/chart-upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
        // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process chart");
      }

      const data = await response.json();
      setSummary(data.summary || "");
      
      if (onSummaryReady && data.summary) {
        onSummaryReady(data.summary);
      }

      toast({
        title: "Chart Processed",
        description: "The chart has been summarized. Please review and edit the note below.",
      });
    } catch (error: any) {
      console.error("Chart upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process chart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!summary.trim()) {
      toast({
        title: "No Summary",
        description: "Please wait for the chart to be processed first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Use the existing clinical note save endpoint
      await apiRequest("POST", "/api/clinical-notes/save", {
        patientId,
        content: summary,
        noteDate: new Date().toISOString(),
      });

      // Invalidate queries to refresh the UI
      await queryClient.invalidateQueries({ queryKey: ["/api/clinical-notes", patientId] });
      await queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });

      toast({
        title: "Clinical Note Saved",
        description: "The chart summary has been saved as a clinical note.",
      });

      // Reset state
      setFile(null);
      setSummary("");
      if (onCancel) {
        onCancel();
      }
    } catch (error: any) {
      console.error("Save note error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save clinical note.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Patient Chart</CardTitle>
        <CardDescription>
          Upload a PDF chart from the old system to create a summarized clinical note for {patientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select PDF Chart</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              disabled={isUploading || isProcessing}
              className="flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFile(null);
                  setSummary("");
                }}
                disabled={isUploading || isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {file && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {file && !summary && (
          <Button
            onClick={handleUpload}
            disabled={isUploading || isProcessing}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Chart...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload and Summarize Chart
              </>
            )}
          </Button>
        )}

        {summary && (
          <div className="space-y-2">
            <label className="text-sm font-medium">AI-Generated Summary (Review and Edit)</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={15}
              className="font-mono text-sm"
              placeholder="Summary will appear here..."
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveNote}
                disabled={isProcessing || !summary.trim()}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Clinical Note"
                )}
              </Button>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setSummary("");
                    onCancel();
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="text-sm text-muted-foreground">
            <p>Extracting text from PDF and generating summary... This may take a moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
