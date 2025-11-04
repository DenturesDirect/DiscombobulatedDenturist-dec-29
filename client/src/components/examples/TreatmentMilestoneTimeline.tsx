import TreatmentMilestoneTimeline from '../TreatmentMilestoneTimeline';

const sampleMilestones = [
  {
    id: '1',
    name: 'Metal Design Out',
    status: 'completed' as const,
    completedBy: 'Damien',
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Metal ETA',
    status: 'completed' as const,
    completedBy: 'Caroline',
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'Setup Assigned',
    status: 'in-progress' as const,
    assignedTo: 'Michael'
  },
  {
    id: '4',
    name: 'Setup Complete',
    status: 'pending' as const,
    assignedTo: 'Michael'
  },
  {
    id: '5',
    name: 'Processing Assigned',
    status: 'pending' as const,
    assignedTo: 'Luisa'
  },
  {
    id: '6',
    name: 'Processing Complete',
    status: 'pending' as const,
  },
  {
    id: '7',
    name: 'Insurance Estimate Submitted',
    status: 'pending' as const,
    assignedTo: 'Caroline'
  },
  {
    id: '8',
    name: 'Insurance Estimate Answer',
    status: 'pending' as const,
  }
];

export default function TreatmentMilestoneTimelineExample() {
  return <TreatmentMilestoneTimeline milestones={sampleMilestones} />;
}
