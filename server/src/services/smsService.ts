import twilio from 'twilio';

export class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async sendSMS(to: string, message: string): Promise<void> {
    if (!this.client) {
      throw new Error('Twilio credentials not configured');
    }

    if (!this.fromNumber) {
      throw new Error('Twilio phone number not configured');
    }

    await this.client.messages.create({
      body: message,
      from: this.fromNumber,
      to: to,
    });
  }

  async sendPDFNotification(to: string[], entryCount: number): Promise<void> {
    const message = `📱 Caderno Journal: Your scheduled export with ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} has been sent to your email. Check your inbox!`;

    const promises = to.map((phoneNumber) => this.sendSMS(phoneNumber, message));
    await Promise.all(promises);
  }

  isConfigured(): boolean {
    return this.client !== null && this.fromNumber !== '';
  }
}
