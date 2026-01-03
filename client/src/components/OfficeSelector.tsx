import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Office {
  id: string;
  name: string;
}

interface OfficeSelectorProps {
  selectedOfficeId: string | null;
  onOfficeChange: (officeId: string | null) => void;
  canViewAllOffices: boolean;
}

export default function OfficeSelector({ selectedOfficeId, onOfficeChange, canViewAllOffices }: OfficeSelectorProps) {
  const [offices, setOffices] = useState<Office[]>([]);

  // Fetch offices
  const { data: officesData } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/offices');
      return response.json();
    },
    enabled: canViewAllOffices,
  });

  useEffect(() => {
    if (officesData) {
      setOffices(officesData);
    }
  }, [officesData]);

  if (!canViewAllOffices) {
    return null; // Don't show selector if user can't view all offices
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="office-selector" className="text-sm text-muted-foreground">
        Office:
      </Label>
      <Select
        value={selectedOfficeId || "all"}
        onValueChange={(value) => onOfficeChange(value === "all" ? null : value)}
      >
        <SelectTrigger id="office-selector" className="w-[200px]">
          <SelectValue placeholder="Select office..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Offices</SelectItem>
          {offices.map((office) => (
            <SelectItem key={office.id} value={office.id}>
              {office.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
