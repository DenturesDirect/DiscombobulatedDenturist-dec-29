import { useState } from 'react';
import ShadeReminderModal from '../ShadeReminderModal';
import { Button } from '@/components/ui/button';

export default function ShadeReminderModalExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Shade Reminder</Button>
      <ShadeReminderModal 
        open={open}
        onClose={() => setOpen(false)}
        onSave={(current, requested) => console.log('Saved:', { current, requested })}
        patientName="Sarah Johnson"
      />
    </div>
  );
}
