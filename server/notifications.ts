// Patient Notification Service
// Handles both email and text notifications

import { storage } from "./storage";
import { sendCustomNotification } from "./gmail";

export type NotificationEvent = 
  | "casting_sent"
  | "bite_blocks_complete"
  | "cdcp_estimate_set"
  | "insurance_approval_received"
  | "insurance_denial_received"
  | "insurance_info_requested"
  | "insurance_info_submitted";

interface NotificationMessage {
  email: {
    subject: string;
    body: string;
  };
  text: string; // Shorter version for SMS
}

const NOTIFICATION_MESSAGES: Record<NotificationEvent, NotificationMessage> = {
  casting_sent: {
    email: {
      subject: "Your Case Has Been Sent to the Lab",
      body: "Your dental case has been sent to the lab for fabrication. We'll notify you when it's ready for your next appointment."
    },
    text: "Your case has been sent to the lab. We'll notify you when it's ready."
  },
  bite_blocks_complete: {
    email: {
      subject: "Bite Blocks Are Complete",
      body: "Your bite blocks are complete and ready for your next appointment. Please contact us to schedule your try-in appointment."
    },
    text: "Your bite blocks are complete. Please contact us to schedule your try-in appointment."
  },
  cdcp_estimate_set: {
    email: {
      subject: "CDCP Estimate Ready",
      body: "Your CDCP estimate has been prepared. We'll contact you soon to discuss the details and next steps."
    },
    text: "Your CDCP estimate is ready. We'll contact you soon to discuss details."
  },
  insurance_approval_received: {
    email: {
      subject: "Insurance Approval Received",
      body: "Great news! Your insurance claim has been approved. We'll contact you to discuss next steps and scheduling."
    },
    text: "Good news! Your insurance claim has been approved. We'll contact you soon."
  },
  insurance_denial_received: {
    email: {
      subject: "Insurance Claim Update",
      body: "We've received a response regarding your insurance claim. Please contact us to discuss your options and next steps."
    },
    text: "We've received an update on your insurance claim. Please contact us to discuss options."
  },
  insurance_info_requested: {
    email: {
      subject: "Additional Information Needed for Insurance",
      body: "Your insurance company has requested additional information. We'll work with you to gather what's needed and submit it promptly."
    },
    text: "Your insurance company needs additional information. We'll help you gather what's needed."
  },
  insurance_info_submitted: {
    email: {
      subject: "Additional Information Submitted to Insurance",
      body: "We've submitted the additional information requested by your insurance company. We'll notify you as soon as we receive their response."
    },
    text: "We've submitted the additional info to your insurance. We'll notify you when we hear back."
  }
};

// Send text notification via Twilio
async function sendTextNotification(phone: string, message: string): Promise<boolean> {
  try {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.warn("⚠️  Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER");
      return false;
    }

    // Format phone number (remove non-digits, ensure it starts with country code)
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    // Use Twilio REST API directly (no SDK needed for simple SMS)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', message);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Twilio API error: ${response.status}`, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Text sent via Twilio to ${formattedPhone}: ${result.sid}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send text notification:`, error);
    return false;
  }
}

// Main notification function
export async function sendPatientNotification(
  patientId: string,
  event: NotificationEvent
): Promise<{ emailSent: boolean; textSent: boolean }> {
  try {
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      console.error(`❌ Patient not found: ${patientId}`);
      return { emailSent: false, textSent: false };
    }

    const message = NOTIFICATION_MESSAGES[event];
    if (!message) {
      console.error(`❌ Unknown notification event: ${event}`);
      return { emailSent: false, textSent: false };
    }

    let emailSent = false;
    let textSent = false;

    // Send email if enabled and email exists
    if (patient.emailNotifications && patient.email) {
      try {
        emailSent = await sendCustomNotification(
          patient.name,
          patient.email,
          message.email.subject,
          message.email.body
        );
        if (emailSent) {
          console.log(`✅ Email notification sent to ${patient.name} for event: ${event}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to send email notification:`, error);
      }
    }

    // Send text if enabled and phone exists
    if (patient.textNotifications && patient.phone) {
      try {
        textSent = await sendTextNotification(patient.phone, message.text);
        if (textSent) {
          console.log(`✅ Text notification sent to ${patient.name} for event: ${event}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to send text notification:`, error);
      }
    }

    return { emailSent, textSent };
  } catch (error: any) {
    console.error(`❌ Error sending notification:`, error);
    return { emailSent: false, textSent: false };
  }
}
