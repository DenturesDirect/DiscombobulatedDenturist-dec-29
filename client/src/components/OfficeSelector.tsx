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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfficeSelector.tsx:24',message:'OfficeSelector queryFn entry',data:{canViewAllOffices},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const response = await apiRequest('GET', '/api/offices');
      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfficeSelector.tsx:27',message:'OfficeSelector queryFn response',data:{dataLength:data?.length||0,data:JSON.stringify(data||[])},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return data;
    },
    enabled: canViewAllOffices,
  });

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfficeSelector.tsx:31',message:'OfficeSelector useEffect',data:{hasOfficesData:!!officesData,officesDataLength:officesData?.length||0,officesData:JSON.stringify(officesData||[]),canViewAllOffices},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (officesData) {
      setOffices(officesData);
    }
  }, [officesData, canViewAllOffices]);

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
