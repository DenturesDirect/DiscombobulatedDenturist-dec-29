import { useState, useRef } from "react";
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
  // Store objectPath from upload URL response to use after upload completes
  const objectPathRef = useRef<string | null>(null);

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
      objectPathRef.current = null; // Reset on failure
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFile = result.successful[0];
      
      // Use objectPath from ref (stored when upload URL was requested)
      // Otherwise fall back to parsing the upload URL (backward compatibility)
      let fileUrl: string;
      
      if (objectPathRef.current) {
        fileUrl = `/api${objectPathRef.current}`;
        console.log("✅ [DocumentUploadZone] Using objectPath from ref:", fileUrl);
        objectPathRef.current = null;
      } else {
        // Proxy upload: objectPath may be in the upload response body
        const responseBody = (uploadedFile as any).response?.body ?? (uploadedFile as any).response;
        const proxyPath = responseBody?.objectPath;
        if (proxyPath) {
          fileUrl = `/api${proxyPath}`;
          console.log("✅ [DocumentUploadZone] Using objectPath from proxy response:", fileUrl);
        } else {
          // Fallback: parse from presigned URL (legacy)
          const rawUrl = uploadedFile.uploadURL as string;
          try {
            const gcsUrl = new URL(rawUrl, window.location.origin);
            const pathParts = gcsUrl.pathname.split('/');
            const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
            const objectId = uploadsIndex >= 0 ? pathParts.slice(uploadsIndex).join('/') : pathParts.slice(-2).join('/');
            fileUrl = `/api/objects/${objectId}`;
          } catch {
            throw new Error("Failed to determine file path. Please try uploading again.");
          }
        }
      }
      
      // Get file metadata
      const fileName = uploadedFile.name as string || 'document';
      const fileType = uploadedFile.type as string || 'application/pdf';
      
      console.log("💾 [DocumentUploadZone] Creating patient file record:", {
        filename: fileName,
        fileUrl: fileUrl,
        fileType: fileType
      });
      
      // Create patient file record
      await apiRequest('POST', `/api/patients/${patientId}/files`, {
        filename: fileName,
        fileUrl: fileUrl,
        fileType: fileType,
        description: null
      });

      console.log("✅ [DocumentUploadZone] Patient file record created successfully");

      toast({
        title: "Document Uploaded",
        description: "The document has been added to the patient's chart."
      });

      onUploadComplete?.();
    } catch (error: any) {
      console.error("❌ [DocumentUploadZone] Error saving document:", error);
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
            console.log("🔍 [DocumentUploadZone] Using proxy upload (avoids CORS).");
            try {
              // Proxy upload: same origin, no presigned URL (avoids "Failed to fetch" from storage CORS)
              return {
                method: "POST" as const,
                url: "/api/objects/upload-direct",
              };
            } catch (error: any) {
              console.error("❌ [DocumentUploadZone] Error requesting upload URL:", error);
              console.error("   Error message:", error.message);
              
              // Show user-friendly error message
              const errorMessage = error.message || "Failed to get upload URL";
              let userMessage = "Unable to upload document. ";
              
              if (errorMessage.includes("Storage not configured")) {
                userMessage += "File storage is not configured. Please contact your administrator.";
              } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
                userMessage += "You are not authorized to upload files. Please log in again.";
              } else if (errorMessage.includes("Connection failed")) {
                userMessage += "Unable to connect to the server. Please check your internet connection.";
              } else {
                userMessage += errorMessage;
              }
              
              toast({
                title: "Upload Error",
                description: userMessage,
                variant: "destructive"
              });
              
              throw error;
            }
          }}
          onError={(error) => {
            const errorMessage = error.message || "Failed to upload document";
            let userMessage = "Unable to upload document. ";
            
            if (errorMessage.includes("Storage not configured")) {
              userMessage += "File storage is not configured. Please contact your administrator.";
            } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
              userMessage += "You are not authorized to upload files. Please log in again.";
            } else if (errorMessage.includes("Connection failed")) {
              userMessage += "Unable to connect to the server. Please check your internet connection.";
            } else {
              userMessage += errorMessage;
            }
            
            toast({
              title: "Upload Error",
              description: userMessage,
              variant: "destructive"
            });
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
