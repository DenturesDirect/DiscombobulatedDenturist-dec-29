import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  filename: string;
  fileUrl: string;
  fileType?: string | null;
  description?: string | null;
  uploadedAt: Date;
}

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => void;
}

// Convert GCS URLs to our API endpoint for authenticated access
function normalizeDocumentUrl(url: string): string {
  // Already an API URL
  if (url.startsWith('/api/objects/')) {
    return url;
  }
  
  // Convert GCS URL to API endpoint
  if (url.startsWith('https://storage.googleapis.com/')) {
    try {
      const gcsUrl = new URL(url);
      const pathParts = gcsUrl.pathname.split('/');
      const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
      if (uploadsIndex >= 0) {
        const objectId = pathParts.slice(uploadsIndex).join('/');
        return `/api/objects/${objectId}`;
      }
      // Fallback: use last two path segments
      return `/api/objects/${pathParts.slice(-2).join('/')}`;
    } catch {
      return url;
    }
  }
  
  return url;
}

function getFileIcon(fileType?: string | null) {
  if (!fileType) return FileText;
  
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('word') || fileType.includes('document')) return FileText;
  if (fileType.includes('image')) return FileText;
  
  return FileText;
}

function getFileTypeLabel(fileType?: string | null): string {
  if (!fileType) return 'Document';
  
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('word') || fileType.includes('document')) {
    if (fileType.includes('openxml') || fileType.includes('docx')) return 'Word';
    if (fileType.includes('msword') || fileType.includes('doc')) return 'Word';
  }
  if (fileType.includes('image')) return 'Image';
  
  // Extract extension from mimetype
  const parts = fileType.split('/');
  if (parts.length > 1) {
    return parts[1].toUpperCase();
  }
  
  return 'Document';
}

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No documents uploaded yet</p>
        <p className="text-sm mt-1">Upload documents to begin</p>
      </div>
    );
  }

  const handleDownload = (document: Document) => {
    const url = normalizeDocumentUrl(document.fileUrl);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const FileIcon = getFileIcon(doc.fileType);
        const fileTypeLabel = getFileTypeLabel(doc.fileType);
        
        return (
          <Card 
            key={doc.id} 
            className="p-4 group hover-elevate transition-all"
            data-testid={`card-document-${doc.id}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <FileIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{doc.filename}</p>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                    {fileTypeLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{format(doc.uploadedAt, 'MMM d, yyyy')}</span>
                  {doc.description && (
                    <>
                      <span>•</span>
                      <span className="truncate">{doc.description}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  onClick={() => handleDownload(doc)}
                  data-testid={`button-download-${doc.id}`}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {onDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(doc.id)}
                    data-testid={`button-delete-${doc.id}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
