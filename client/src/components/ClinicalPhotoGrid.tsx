import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";

interface ClinicalPhoto {
  id: string;
  url: string;
  date: Date;
  description?: string;
}

interface ClinicalPhotoGridProps {
  photos: ClinicalPhoto[];
  onDelete?: (id: string) => void;
}

export default function ClinicalPhotoGrid({ photos, onDelete }: ClinicalPhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ClinicalPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No clinical photos yet</p>
        <p className="text-sm mt-1">Upload photos to begin</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <Card 
            key={photo.id} 
            className="aspect-square overflow-hidden group relative p-0 cursor-pointer hover-elevate"
            onClick={() => setSelectedPhoto(photo)}
            data-testid={`card-photo-${photo.id}`}
          >
            <img 
              src={photo.url} 
              alt={photo.description || 'Clinical photo'} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Download photo:', photo.id);
                  }}
                  data-testid={`button-download-${photo.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="w-8 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(photo.id);
                  }}
                  data-testid={`button-delete-${photo.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {format(photo.date, 'MMM d, yyyy')}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.description || 'Clinical photo'} 
                className="w-full rounded-lg"
              />
              <div className="text-sm text-muted-foreground">
                {format(selectedPhoto.date, 'MMMM d, yyyy')}
                {selectedPhoto.description && ` • ${selectedPhoto.description}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
