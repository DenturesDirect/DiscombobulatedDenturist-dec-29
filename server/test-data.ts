import { storage } from "./storage";

// ============================================
// CUSTOMIZE YOUR TEST PATIENTS HERE
// ============================================
// Edit the patients array below to customize workflows, denture types, etc.

interface TestPatientConfig {
  name: string;
  dateOfBirth: string; // Format: "YYYY-MM-DD"
  phone?: string;
  email?: string;
  isCDCP?: boolean;
  workInsurance?: boolean;
  copayDiscussed?: boolean;
  currentToothShade?: string;
  requestedToothShade?: string;
  upperDentureType?: string; // "None" | "Complete" | "Acrylic Partial" | "Cast Partial" | "Repair" | "Tooth Addition" | "Reline" | "Rebase" | "Implant Retained"
  lowerDentureType?: string;
  workflow: {
    // Clinical notes with backdated dates (days ago)
    notes: Array<{
      daysAgo: number; // How many days ago this note was created
      content: string;
    }>;
    // Tasks to create
    tasks?: Array<{
      title: string;
      description?: string;
      assignee: "Damien" | "Caroline" | "Michael" | "Luisa";
      priority: "high" | "normal" | "low";
      daysUntilDue: number; // Days from now until due
    }>;
  };
}

const TEST_PATIENTS: TestPatientConfig[] = [
  {
    name: "Sarah Johnson",
    dateOfBirth: "1968-05-12",
    phone: "(555) 123-4567",
    email: "sarah.j@email.com",
    isCDCP: false,
    currentToothShade: "A2",
    requestedToothShade: "B1",
    upperDentureType: "Complete",
    lowerDentureType: "None",
    workflow: {
      notes: [
        {
          daysAgo: 45,
          content: `Date: ${getDateString(45)} ago
Chief Complaint: Patient seeking replacement of failing upper denture.

History: Current denture is 8 years old, reports poor retention and difficulty eating. Patient states the denture feels loose and moves when speaking or eating.

Clinical Findings: Moderate bone resorption in maxilla. Existing denture shows significant wear on occlusal surfaces. Patient has adequate ridge height but some resorption noted.

Treatment Plan: Fabricate new complete upper denture. Discussed conventional vs. immediate options. Patient opted for conventional approach to allow for proper healing.

Consent obtained: Patient was informed of risks, benefits, alternatives, and costs. Patient agreed to proceed with new complete upper denture fabrication.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Schedule preliminary impression appointment.`
        },
        {
          daysAgo: 30,
          content: `Date: ${getDateString(30)} ago
Procedure: Preliminary impressions taken.

Clinical Findings: Good ridge form. Adequate border extension achieved. Patient tolerated procedure well.

Consent obtained: Patient consented to preliminary impression procedure.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Pour models and fabricate custom trays.`
        },
        {
          daysAgo: 15,
          content: `Date: ${getDateString(15)} ago
Procedure: Final impressions and bite registration.

Clinical Findings: Excellent border seal achieved. Bite registration completed at proper vertical dimension. Patient approved tooth shade B1.

Consent obtained: Patient consented to final impression and bite registration procedures.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Send to lab for framework fabrication. Schedule try-in appointment in 2 weeks.`
        }
      ],
      tasks: [
        {
          title: "Schedule try-in appointment for Sarah Johnson",
          description: "Final impressions complete. Ready for try-in in 2 weeks.",
          assignee: "Caroline",
          priority: "normal",
          daysUntilDue: 3
        }
      ]
    }
  },
  {
    name: "Robert Miller",
    dateOfBirth: "1975-08-23",
    phone: "(555) 234-5678",
    email: "rmiller@email.com",
    isCDCP: true,
    copayDiscussed: false,
    currentToothShade: null,
    requestedToothShade: "A2",
    upperDentureType: "None",
    lowerDentureType: "Cast Partial",
    workflow: {
      notes: [
        {
          daysAgo: 60,
          content: `Date: ${getDateString(60)} ago
Chief Complaint: Missing multiple lower teeth, difficulty chewing.

CDCP Coverage: Patient is CDCP eligible. Copay discussion required.

History: Patient lost teeth 36, 37, 46, 47 due to periodontal disease 2 years ago. Has been managing with remaining dentition but reports difficulty with certain foods.

Clinical Findings: Missing teeth 36, 37, 46, 47. Adequate bone support for partial denture. Remaining teeth show good periodontal health. Adequate interarch space present.

Treatment Plan: Fabricate cast partial denture for mandibular arch. Estimated CDCP copay $450. Patient needs copay discussion before proceeding.

Consent obtained: Patient was informed of risks, benefits, alternatives, and costs. Patient understands CDCP coverage and copay requirements.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Schedule copay discussion appointment.`
        },
        {
          daysAgo: 40,
          content: `Date: ${getDateString(40)} ago
Procedure: CDCP copay discussion and treatment acceptance.

CDCP Coverage: Copay of $450 discussed with patient. Patient accepted treatment plan and copay amount.

Clinical Findings: Patient ready to proceed with lower cast partial denture.

Consent obtained: Patient consented to lower cast partial denture fabrication and understands copay obligation.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Schedule preliminary impression appointment.`
        }
      ],
      tasks: [
        {
          title: "Submit CDCP estimate/predetermination for Robert Miller",
          description: "CDCP patient requires insurance estimate. Estimated copay: $450 for lower cast partial denture.",
          assignee: "Caroline",
          priority: "high",
          daysUntilDue: 1
        },
        {
          title: "Schedule preliminary impression for Robert Miller",
          description: "CDCP copay discussed and accepted. Ready for preliminary impressions.",
          assignee: "Caroline",
          priority: "normal",
          daysUntilDue: 5
        }
      ]
    }
  },
  {
    name: "Margaret Chen",
    dateOfBirth: "1952-11-30",
    phone: "(555) 345-6789",
    email: "mchen@email.com",
    isCDCP: true,
    copayDiscussed: true,
    currentToothShade: "A3",
    requestedToothShade: "A2",
    upperDentureType: "Complete",
    lowerDentureType: "Complete",
    workflow: {
      notes: [
        {
          daysAgo: 90,
          content: `Date: ${getDateString(90)} ago
Chief Complaint: Patient seeking replacement of both upper and lower complete dentures.

CDCP Coverage: Patient is CDCP eligible. Copay discussed and accepted.

History: Current dentures are 12 years old. Patient reports poor fit, difficulty eating, and aesthetic concerns.

Clinical Findings: Significant bone resorption in both arches. Existing dentures show poor retention. Patient has adequate interarch space.

Treatment Plan: Fabricate new complete upper and lower dentures. CDCP copay discussed: $900 total ($450 per arch). Patient accepted.

Consent obtained: Patient was informed of risks, benefits, alternatives, and costs. Patient agreed to proceed with new complete upper and lower dentures.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Schedule preliminary impressions for both arches.`
        },
        {
          daysAgo: 70,
          content: `Date: ${getDateString(70)} ago
Procedure: Preliminary impressions for both arches.

Clinical Findings: Good ridge form bilaterally. Adequate border extension achieved on both arches. Patient tolerated procedure well.

Consent obtained: Patient consented to preliminary impression procedures.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Pour models and fabricate custom trays for both arches.`
        },
        {
          daysAgo: 50,
          content: `Date: ${getDateString(50)} ago
Procedure: Final impressions and bite registration for both arches.

Clinical Findings: Excellent border seal achieved bilaterally. Bite registration completed at proper vertical dimension. Patient approved tooth shade A2 for both arches.

Consent obtained: Patient consented to final impressions and bite registration procedures.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Send to lab for denture fabrication. Schedule try-in appointment in 3 weeks.`
        },
        {
          daysAgo: 20,
          content: `Date: ${getDateString(20)} ago
Procedure: Try-in appointment.

Clinical Findings: Denture setup approved by patient. Minor adjustments to tooth positioning requested. Vertical dimension and centric relation verified.

Consent obtained: Patient approved denture setup and consented to final processing.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Send to lab for final processing. Schedule delivery appointment in 2 weeks.`
        }
      ],
      tasks: [
        {
          title: "Finalize denture setup for Margaret Chen",
          description: "Try-in completed. Patient approved setup. Ready for final processing.",
          assignee: "Michael",
          priority: "high",
          daysUntilDue: 2
        },
        {
          title: "Schedule delivery appointment for Margaret Chen",
          description: "Dentures ready for delivery. Schedule final appointment.",
          assignee: "Caroline",
          priority: "normal",
          daysUntilDue: 7
        }
      ]
    }
  },
  {
    name: "James Wilson",
    dateOfBirth: "1982-03-15",
    phone: "(555) 456-7890",
    email: "jwilson@email.com",
    isCDCP: false,
    workInsurance: true,
    currentToothShade: "B1",
    requestedToothShade: "A1",
    upperDentureType: "Acrylic Partial",
    lowerDentureType: "None",
    workflow: {
      notes: [
        {
          daysAgo: 30,
          content: `Date: ${getDateString(30)} ago
Chief Complaint: Patient seeking replacement of upper partial denture.

Work Insurance: Patient has work insurance coverage. Estimate required.

History: Current partial denture is 5 years old. Patient reports broken clasp and poor fit.

Clinical Findings: Missing teeth 14, 15, 16. Adequate abutment teeth present. Broken clasp on tooth 13. Good tissue health.

Treatment Plan: Fabricate new acrylic partial denture for upper arch. Work insurance estimate required.

Consent obtained: Patient was informed of risks, benefits, alternatives, and costs. Patient agreed to proceed pending insurance approval.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Submit work insurance estimate. Schedule preliminary impression after approval.`
        }
      ],
      tasks: [
        {
          title: "Submit work insurance estimate/predetermination for James Wilson",
          description: "Work insurance patient requires estimate for upper acrylic partial denture.",
          assignee: "Caroline",
          priority: "high",
          daysUntilDue: 1
        }
      ]
    }
  },
  {
    name: "Patricia Martinez",
    dateOfBirth: "1945-07-22",
    phone: "(555) 567-8901",
    email: "pmartinez@email.com",
    isCDCP: true,
    copayDiscussed: true,
    currentToothShade: "A3",
    requestedToothShade: "A2",
    upperDentureType: "Repair",
    lowerDentureType: "Reline",
    workflow: {
      notes: [
        {
          daysAgo: 10,
          content: `Date: ${getDateString(10)} ago
Chief Complaint: Upper denture repair needed, lower denture requires reline.

CDCP Coverage: Patient is CDCP eligible. Copay discussed.

History: Upper denture has a crack through the midline. Lower denture has become loose due to tissue changes.

Clinical Findings: Upper denture shows fracture through midline. Lower denture shows poor retention due to tissue resorption. Adequate border extension present.

Treatment Plan: Repair upper denture. Reline lower denture. CDCP copay discussed: $200 total ($100 repair + $100 reline). Patient accepted.

Consent obtained: Patient was informed of risks, benefits, alternatives, and costs. Patient agreed to proceed with repair and reline procedures.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Send upper denture for repair. Schedule reline appointment for lower denture.`
        }
      ],
      tasks: [
        {
          title: "Send upper denture for repair - Patricia Martinez",
          description: "Upper denture has midline fracture. Send to lab for repair.",
          assignee: "Michael",
          priority: "normal",
          daysUntilDue: 3
        },
        {
          title: "Schedule reline appointment for Patricia Martinez",
          description: "Lower denture requires reline. Schedule appointment.",
          assignee: "Caroline",
          priority: "normal",
          daysUntilDue: 5
        }
      ]
    }
  },
  {
    name: "David Thompson",
    dateOfBirth: "1960-12-05",
    phone: "(555) 678-9012",
    email: "dthompson@email.com",
    isCDCP: false,
    currentToothShade: "A2",
    requestedToothShade: "A2",
    upperDentureType: "Implant Retained",
    lowerDentureType: "None",
    workflow: {
      notes: [
        {
          daysAgo: 120,
          content: `Date: ${getDateString(120)} ago
Chief Complaint: Patient seeking implant-retained upper denture.

History: Patient has been edentulous for 3 years. Current conventional denture provides poor retention. Patient interested in implant option.

Clinical Findings: Adequate bone in maxilla for implant placement. Patient is good candidate for implant-retained denture.

Treatment Plan: Fabricate implant-retained upper denture. Discussed 2 vs 4 implant options. Patient opted for 4-implant retained denture for maximum stability.

Consent obtained: Patient was informed of risks, benefits, alternatives, and costs. Patient understands implant procedure and maintenance requirements.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Refer to oral surgeon for implant placement. Schedule consultation.`
        },
        {
          daysAgo: 60,
          content: `Date: ${getDateString(60)} ago
Procedure: Implant placement consultation follow-up.

Clinical Findings: Patient has completed implant placement with oral surgeon. Four implants placed in positions 3, 6, 11, 14. Healing caps in place. Patient healing well.

Consent obtained: Patient consented to proceed with implant-retained denture fabrication.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Wait for osseointegration (3-4 months). Schedule impression appointment after healing period.`
        },
        {
          daysAgo: 15,
          content: `Date: ${getDateString(15)} ago
Procedure: Final impressions for implant-retained denture.

Clinical Findings: Implants fully osseointegrated. Healing caps removed. Impressions taken with implant analogs. Excellent fit achieved.

Consent obtained: Patient consented to final impression procedure.

Medical and dental history reviewed and updated with no significant changes unless otherwise stated.

Next Steps: Send to lab for framework fabrication. Schedule try-in appointment in 3 weeks.`
        }
      ],
      tasks: [
        {
          title: "Schedule try-in for implant-retained denture - David Thompson",
          description: "Final impressions complete. Framework ready for try-in.",
          assignee: "Caroline",
          priority: "high",
          daysUntilDue: 7
        }
      ]
    }
  }
];

// Helper function to get date string
function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Main function to seed test data
export async function seedTestData() {
  console.log("🌱 Starting test data seeding...");
  
  const createdPatients: string[] = [];
  let totalNotes = 0;
  let totalTasks = 0;

  for (const config of TEST_PATIENTS) {
    try {
      // Create patient
      const patient = await storage.createPatient({
        name: config.name,
        dateOfBirth: config.dateOfBirth,
        phone: config.phone,
        email: config.email,
        isCDCP: config.isCDCP || false,
        workInsurance: config.workInsurance || false,
        copayDiscussed: config.copayDiscussed || false,
        currentToothShade: config.currentToothShade,
        requestedToothShade: config.requestedToothShade,
        upperDentureType: config.upperDentureType,
        lowerDentureType: config.lowerDentureType,
      });

      createdPatients.push(patient.name);

      // Create clinical notes with backdated dates
      for (const noteConfig of config.workflow.notes) {
        const noteDate = new Date();
        noteDate.setDate(noteDate.getDate() - noteConfig.daysAgo);
        
        await storage.createClinicalNote({
          patientId: patient.id,
          content: noteConfig.content,
          noteDate: noteDate,
          createdBy: "Damien"
        });
        totalNotes++;
      }

      // Create tasks
      if (config.workflow.tasks) {
        for (const taskConfig of config.workflow.tasks) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + taskConfig.daysUntilDue);
          
          await storage.createTask({
            patientId: patient.id,
            title: taskConfig.title,
            description: taskConfig.description,
            assignee: taskConfig.assignee,
            priority: taskConfig.priority,
            status: "pending",
            dueDate: dueDate
          });
          totalTasks++;
        }
      }

      console.log(`✅ Created patient: ${patient.name} (${config.workflow.notes.length} notes, ${config.workflow.tasks?.length || 0} tasks)`);
    } catch (error: any) {
      console.error(`❌ Error creating patient ${config.name}:`, error.message);
    }
  }

  console.log("\n🎉 Test data seeding complete!");
  console.log(`📊 Summary:`);
  console.log(`   - Patients: ${createdPatients.length}`);
  console.log(`   - Clinical Notes: ${totalNotes}`);
  console.log(`   - Tasks: ${totalTasks}`);
  console.log(`\n📝 Created patients: ${createdPatients.join(", ")}`);
}




