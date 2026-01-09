import { useState } from "react";
import { Upload } from "lucide-react";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadZoneProps {
  patientId: string;
  onUploadComplete?: () => void;
}

export default function DocumentUploadZone({ patientId, onUploadComplete }: DocumentUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFile = result.successful[0];
      const rawUrl = uploadedFile.uploadURL as string;
      
      // Convert GCS URL to our API endpoint
      const gcsUrl = new URL(rawUrl);
      const pathParts = gcsUrl.pathname.split('/');
      const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
      const objectId = uploadsIndex >= 0 ? pathParts.slice(uploadsIndex).join('/') : pathParts.slice(-2).join('/');
      const fileUrl = `/api/objects/${objectId}`;
      
      // Get file metadata
      const fileName = uploadedFile.name as string || 'document';
      const fileType = uploadedFile.type as string || 'application/pdf';
      
      // Create patient file record
      await apiRequest('POST', `/api/patients/${patientId}/files`, {
        filename: fileName,
        fileUrl: fileUrl,
        fileType: fileType,
        description: null
      });

      toast({
        title: "Document Uploaded",
        description: "The document has been added to the patient's chart."
      });

      onUploadComplete?.();
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save document to patient chart.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={50 * 1024 * 1024} // 50MB limit for documents
          onGetUploadParameters={async () => {
            const response = await apiRequest('POST', '/api/objects/upload', {});
            const data = await response.json();
            return {
              method: "PUT" as const,
              url: data.uploadURL,
            };
          }}
          onComplete={handleUploadComplete}
          buttonClassName="w-full"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div>
              <div className="text-base font-medium">Upload Document</div>
              <div className="text-sm text-muted-foreground">PDF, DOC, DOCX, and other document types</div>
              <div className="text-xs text-muted-foreground mt-1">Up to 50MB</div>
            </div>
          </div>
        </ObjectUploader>
      </div>
      {isUploading && (
        <div className="text-sm text-muted-foreground text-center">
          Saving document to patient chart...
        </div>
      )}
    </div>
  );
}
