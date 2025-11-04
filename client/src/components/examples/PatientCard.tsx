import PatientCard from '../PatientCard';

export default function PatientCardExample() {
  return (
    <div className="space-y-2 w-80">
      <PatientCard 
        id="1"
        name="Sarah Johnson" 
        lastVisit={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)} 
        status="active"
        isActive
      />
      <PatientCard 
        id="2"
        name="Michael Chen" 
        lastVisit={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)} 
        status="pending"
      />
      <PatientCard 
        id="3"
        name="Emily Rodriguez" 
        lastVisit={new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)} 
        status="completed"
      />
    </div>
  );
}
