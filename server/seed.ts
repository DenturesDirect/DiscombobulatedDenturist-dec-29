import { storage } from "./storage";

export async function seedData() {
  const patient1 = await storage.createPatient({
    name: "Sarah Johnson",
    dateOfBirth: "1968-05-12",
    phone: "(555) 123-4567",
    email: "sarah.j@email.com",
    isCDCP: false,
    copayDiscussed: false,
    currentToothShade: "A2",
    requestedToothShade: "B1"
  });

  const patient2 = await storage.createPatient({
    name: "Robert Miller",
    dateOfBirth: "1975-08-23",
    phone: "(555) 234-5678",
    email: "rmiller@email.com",
    isCDCP: true,
    copayDiscussed: false,
    currentToothShade: null,
    requestedToothShade: null
  });

  const patient3 = await storage.createPatient({
    name: "Margaret Chen",
    dateOfBirth: "1952-11-30",
    phone: "(555) 345-6789",
    email: "mchen@email.com",
    isCDCP: true,
    copayDiscussed: true,
    currentToothShade: "A3",
    requestedToothShade: "A2"
  });

  await storage.createClinicalNote({
    patientId: patient1.id,
    content: "Chief Complaint: Patient seeking replacement of failing upper denture.\n\nHistory: Current denture is 8 years old, reports poor retention and difficulty eating.\n\nClinical Findings: Moderate bone resorption in maxilla. Existing denture shows wear on occlusal surfaces.\n\nTreatment Plan: Fabricate new complete upper denture. Discussed conventional vs. immediate options. Patient opted for conventional approach.\n\nConsent obtained by patient for complete upper denture fabrication.\n\nUpdated medical/dental history: no changes",
    createdBy: "Damien"
  });

  await storage.createClinicalNote({
    patientId: patient2.id,
    content: "Chief Complaint: Missing multiple lower teeth, difficulty chewing.\n\nCDCP Coverage: Patient is CDCP eligible. Copay discussion required.\n\nClinical Findings: Missing teeth 36, 37, 46, 47. Adequate bone support for partial denture.\n\nTreatment Plan: Fabricate cast partial denture for mandibular arch. Estimated copay $450.\n\nConsent obtained by patient for partial denture fabrication.\n\nUpdated medical/dental history: no changes",
    createdBy: "Damien"
  });

  await storage.createTask({
    patientId: patient2.id,
    title: "Discuss CDCP copay with Robert Miller",
    description: "CDCP patient requires copay discussion. Estimated copay: $450 for lower partial denture.",
    assignee: "Damien",
    priority: "high",
    status: "pending",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await storage.createTask({
    patientId: patient1.id,
    title: "Schedule preliminary impression for Sarah Johnson",
    description: "Patient approved for new upper denture. Schedule preliminary impression appointment.",
    assignee: "Caroline",
    priority: "normal",
    status: "pending",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });

  await storage.createTask({
    patientId: patient3.id,
    title: "Finalize denture setup for Margaret Chen",
    description: "Patient ready for try-in appointment. Complete tooth setup in wax.",
    assignee: "Michael",
    priority: "high",
    status: "pending",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  });

  console.log("✅ Seed data created:", { 
    patients: 3,
    notes: 2,
    tasks: 3,
    patient1: patient1.id, 
    patient2: patient2.id, 
    patient3: patient3.id 
  });
}
