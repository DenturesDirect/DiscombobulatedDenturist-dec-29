import { storage } from "./storage";

export async function seedData() {
  // Create some test patients
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

  console.log("✅ Seed data created:", { patient1: patient1.id, patient2: patient2.id, patient3: patient3.id });
}
