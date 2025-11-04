import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ShadeReminderModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (currentShade: string, requestedShade: string) => void;
  patientName: string;
}

export default function ShadeReminderModal({ open, onClose, onSave, patientName }: ShadeReminderModalProps) {
  const [currentShade, setCurrentShade] = useState("");
  const [requestedShade, setRequestedShade] = useState("");

  const handleSave = () => {
    if (onSave && currentShade && requestedShade) {
      onSave(currentShade, requestedShade);
    }
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="modal-shade-reminder">
        <DialogHeader>
          <DialogTitle>Record Tooth Shade</DialogTitle>
          <DialogDescription>
            Please record the current and requested tooth shade for {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="current-shade" className="mb-2 block">Current Shade</Label>
            <Input
              id="current-shade"
              placeholder="e.g., A2"
              value={currentShade}
              onChange={(e) => setCurrentShade(e.target.value)}
              data-testid="input-current-shade"
            />
          </div>
          <div>
            <Label htmlFor="requested-shade" className="mb-2 block">Requested Shade</Label>
            <Input
              id="requested-shade"
              placeholder="e.g., B1"
              value={requestedShade}
              onChange={(e) => setRequestedShade(e.target.value)}
              data-testid="input-requested-shade"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} data-testid="button-skip">
            Skip for Now
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!currentShade || !requestedShade}
            data-testid="button-save-shade"
          >
            Save Shades
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
