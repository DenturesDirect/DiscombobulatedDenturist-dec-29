import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PatientAvatarProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
}

export function PatientAvatar({ name, photoUrl, className }: PatientAvatarProps) {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Avatar className={className} data-testid="avatar-patient">
      {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
      <AvatarFallback data-testid="avatar-fallback">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
