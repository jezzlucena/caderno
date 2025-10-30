import nodemailer, { Transporter } from 'nodemailer';
import { Buffer } from 'buffer';

export interface EmailOptions {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
}

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured');
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPDFEmail(
    to: string[],
    pdfBuffer: Buffer,
    fileName: string,
    entryCount: number
  ): Promise<void> {
    const subject = `Your Caderno Journal Export - ${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'}`;
    
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0;">Caderno Journal Export</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Your scheduled journal export is ready! This PDF contains <strong>${entryCount}</strong> 
              ${entryCount === 1 ? 'entry' : 'entries'} from your Caderno journal.
            </p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">📄 Export Details</h2>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li><strong>File:</strong> ${fileName}</li>
              <li><strong>Entries:</strong> ${entryCount}</li>
              <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>🔒 Privacy Note:</strong> This export contains your personal journal entries. 
              Please store it securely and delete it when no longer needed.
            </p>
          </div>

          <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This is an automated message from your Caderno server.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Your Caderno Journal Export

Your scheduled journal export is ready! This PDF contains ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} from your Caderno journal.

Export Details:
- File: ${fileName}
- Entries: ${entryCount}
- Generated: ${new Date().toLocaleString()}

Privacy Note: This export contains your personal journal entries. Please store it securely and delete it when no longer needed.
    `;

    await this.sendEmail({
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}
