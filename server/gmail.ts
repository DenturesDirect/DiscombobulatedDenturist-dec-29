// Gmail Integration for Patient Notifications
// Uses Replit's Google Mail connector

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error('Gmail not configured: REPLIT_CONNECTORS_HOSTNAME not set');
  }
  
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Gmail not configured: authentication token not available');
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gmail connector request failed: ${response.status}`);
    }
    
    const data = await response.json();
    connectionSettings = data?.items?.[0];
    
    if (!connectionSettings) {
      throw new Error('Gmail not connected: no connection found');
    }
    
    const accessToken = connectionSettings?.settings?.access_token || 
                        connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!accessToken) {
      throw new Error('Gmail not connected: no access token available');
    }
    
    return accessToken;
  } catch (error: any) {
    connectionSettings = null;
    throw new Error(`Gmail connection failed: ${error.message}`);
  }
}

async function getGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  patientName: string;
}

export async function sendPatientNotification(options: EmailOptions): Promise<boolean> {
  try {
    const gmail = await getGmailClient();
    
    const message = [
      'Content-Type: text/html; charset="UTF-8"',
      'MIME-Version: 1.0',
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      '',
      options.body
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`📧 Email sent to ${options.patientName} (${options.to})`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendAppointmentReminder(
  patientName: string,
  patientEmail: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<boolean> {
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Dentures Direct - Appointment Reminder</h2>
      <p>Dear ${patientName},</p>
      <p>This is a friendly reminder about your upcoming appointment:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
      </div>
      <p>Please arrive 10 minutes early to complete any necessary paperwork.</p>
      <p>If you need to reschedule, please call us at your earliest convenience.</p>
      <br>
      <p>Best regards,</p>
      <p><strong>Dentures Direct Team</strong></p>
    </div>
  `;

  return sendPatientNotification({
    to: patientEmail,
    subject: `Appointment Reminder - ${appointmentDate}`,
    body,
    patientName
  });
}

export async function sendCustomNotification(
  patientName: string,
  patientEmail: string,
  subject: string,
  messageContent: string
): Promise<boolean> {
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Dentures Direct</h2>
      <p>Dear ${patientName},</p>
      <p>${messageContent}</p>
      <br>
      <p>Best regards,</p>
      <p><strong>Dentures Direct Team</strong></p>
    </div>
  `;

  return sendPatientNotification({
    to: patientEmail,
    subject,
    body,
    patientName
  });
}
