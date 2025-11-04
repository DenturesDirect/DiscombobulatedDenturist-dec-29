import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PhotoUploadZoneProps {
  onPhotosChange?: (photos: File[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploadZone({ onPhotosChange, maxPhotos = 10 }: PhotoUploadZoneProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files].slice(0, maxPhotos);
    
    setPhotos(newPhotos);
    
    newPhotos.forEach((file, index) => {
      if (index >= photos.length) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string].slice(0, maxPhotos));
        };
        reader.readAsDataURL(file);
      }
    });

    if (onPhotosChange) {
      onPhotosChange(newPhotos);
    }
  }, [photos, maxPhotos, onPhotosChange]);

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPreviews(newPreviews);
    if (onPhotosChange) {
      onPhotosChange(newPhotos);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
          data-testid="input-photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer block">
          <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <div className="text-base font-medium mb-1">Upload Clinical Photos</div>
          <div className="text-sm text-muted-foreground">Click to browse or drag and drop</div>
          <div className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each</div>
        </label>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <Card key={index} className="relative aspect-square overflow-hidden group p-0">
              <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
                data-testid={`button-remove-photo-${index}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
