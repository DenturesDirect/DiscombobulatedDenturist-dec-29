import PatientSidebar from '../PatientSidebar';

const samplePatients = [
  { id: '1', name: 'Alice Brown', lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'active' as const },
  { id: '2', name: 'Bob Anderson', lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'pending' as const },
  { id: '3', name: 'Carol Davis', lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: 'completed' as const },
  { id: '4', name: 'David Miller', lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'active' as const },
  { id: '5', name: 'Emma Wilson', lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), status: 'completed' as const },
  { id: '6', name: 'Frank Martinez', lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'pending' as const },
  { id: '7', name: 'Grace Taylor', lastVisit: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'active' as const },
];

export default function PatientSidebarExample() {
  return (
    <div className="h-screen">
      <PatientSidebar 
        patients={samplePatients}
        activePatientId="1"
        onPatientSelect={(id) => console.log('Selected patient:', id)}
        onNewPatient={() => console.log('New patient clicked')}
      />
    </div>
  );
}
