import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PatientAvatarProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
}

// Convert GCS URLs to our API endpoint for authenticated access
function normalizePhotoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // Already an API URL
  if (url.startsWith('/api/objects/')) {
    return url;
  }
  
  // Legacy normalized path
  if (url.startsWith('/objects/')) {
    return `/api${url}`;
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
      return undefined;
    }
  }
  
  // Convert Supabase Storage URLs to our API endpoint
  if (url.includes('/storage/v1/object/')) {
    try {
      const supabaseUrl = new URL(url);
      const pathParts = supabaseUrl.pathname.split('/').filter(Boolean);
      const objectIndex = pathParts.findIndex(p => p === 'object');
      if (objectIndex >= 0) {
        let bucketIndex = objectIndex + 1;
        const bucketMarker = pathParts[bucketIndex];
        if (bucketMarker === 'public' || bucketMarker === 'sign') {
          bucketIndex += 1;
        }
        const objectPath = pathParts.slice(bucketIndex + 1).join('/');
        if (objectPath) {
          return `/api/objects/${objectPath}`;
        }
      }
    } catch {
      return undefined;
    }
  }
  
  // Return as-is for other URLs (e.g., external URLs)
  return url;
}

export function PatientAvatar({ name, photoUrl, className }: PatientAvatarProps) {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const normalizedUrl = normalizePhotoUrl(photoUrl);

  return (
    <Avatar className={className} data-testid="avatar-patient">
      {normalizedUrl && <AvatarImage src={normalizedUrl} alt={name} />}
      <AvatarFallback data-testid="avatar-fallback">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
