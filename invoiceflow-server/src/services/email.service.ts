// backend/src/services/email.service.ts

import formData from 'form-data';
import Mailgun from 'mailgun.js';

interface SendInvoiceParams {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentLink: string;
  pdfBuffer: Buffer;
  dueDate: string;
}

interface PaymentConfirmationParams {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentId: string;
  paidDate: string;
}

class EmailService {
  private mg: any;
  private domain: string;
  private fromEmail: string;

  constructor() {
    const mailgun = new Mailgun(formData);
    
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY!,
      url: 'https://api.mailgun.net',
    });

    this.domain = process.env.MAILGUN_DOMAIN!;
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || `InvoiceFlow <mailgun@${this.domain}>`;
  }

  async sendInvoice(params: SendInvoiceParams) {
    try {
      const messageData = {
        from: this.fromEmail,
        to: [params.to],
        subject: `Invoice #${params.invoiceNumber} from InvoiceFlow`,
        html: this.getInvoiceEmailTemplate(params),
        text: `Hi ${params.customerName},\n\nPlease find your invoice #${params.invoiceNumber} attached.\n\nAmount Due: ₹${params.amount.toFixed(2)}\nDue Date: ${params.dueDate}\n\nPay now: ${params.paymentLink}\n\nThank you!`,
        attachment: {
          data: params.pdfBuffer,
          filename: `Invoice_${params.invoiceNumber}.pdf`,
          contentType: 'application/pdf',
        },
      };

      const response = await this.mg.messages.create(this.domain, messageData);
      
      console.log('✅ Invoice email sent:', response.id);
      return {
        success: true,
        messageId: response.id,
      };
    } catch (error: any) {
      console.error('❌ Mailgun send error:', error);
      throw new Error(`Failed to send invoice email: ${error.message}`);
    }
  }

  async sendPaymentConfirmation(params: PaymentConfirmationParams) {
    try {
      const messageData = {
        from: this.fromEmail,
        to: [params.to],
        subject: `Payment Received - Invoice #${params.invoiceNumber}`,
        html: this.getPaymentConfirmationTemplate(params),
        text: `Hi ${params.customerName},\n\nWe've received your payment!\n\nInvoice: #${params.invoiceNumber}\nAmount: ₹${params.amount.toFixed(2)}\nPayment ID: ${params.paymentId}\n\nThank you for your business!`,
      };

      const response = await this.mg.messages.create(this.domain, messageData);
      
      console.log('✅ Payment confirmation sent:', response.id);
      return {
        success: true,
        messageId: response.id,
      };
    } catch (error: any) {
      console.error('❌ Payment confirmation error:', error);
      throw new Error(`Failed to send confirmation: ${error.message}`);
    }
  }

  async sendPaymentReminder(params: {
    to: string;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    paymentLink: string;
    daysOverdue?: number;
  }) {
    try {
      const isOverdue = params.daysOverdue && params.daysOverdue > 0;
      const subject = isOverdue 
        ? `Overdue: Invoice #${params.invoiceNumber} (${params.daysOverdue} days)` 
        : `Reminder: Invoice #${params.invoiceNumber} Due Soon`;

      const messageData = {
        from: this.fromEmail,
        to: [params.to],
        subject,
        html: this.getPaymentReminderTemplate(params),
        text: `Hi ${params.customerName},\n\nThis is a reminder for invoice #${params.invoiceNumber}.\n\nAmount: ₹${params.amount.toFixed(2)}\nDue Date: ${params.dueDate}\n\nPay now: ${params.paymentLink}`,
      };

      const response = await this.mg.messages.create(this.domain, messageData);
      
      console.log('✅ Payment reminder sent:', response.id);
      return {
        success: true,
        messageId: response.id,
      };
    } catch (error: any) {
      console.error('❌ Reminder send error:', error);
      throw new Error(`Failed to send reminder: ${error.message}`);
    }
  }

  // ===== SIMPLIFIED EMAIL TEMPLATES WITH DIRECT LINKS =====

  private getInvoiceEmailTemplate(params: SendInvoiceParams): string {
    const hasPaymentLink = params.paymentLink && !params.paymentLink.includes('.pdf')
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #844fc1; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Invoice from InvoiceFlow</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Hi <strong>${params.customerName}</strong>,</p>
              
              <p style="margin: 0 0 25px 0; font-size: 15px; color: #666; line-height: 1.6;">
                Thank you for your business! Please find your invoice <strong>#${params.invoiceNumber}</strong> attached to this email.
              </p>
              
              <!-- Invoice Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border: 1px solid #e5e5e5; border-radius: 6px;">
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e5e5e5;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px; font-weight: 600;">Invoice Number:</td>
                        <td align="right" style="color: #333; font-size: 14px; font-weight: 500;">#${params.invoiceNumber}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px; font-weight: 600;">Due Date:</td>
                        <td align="right" style="color: #333; font-size: 14px; font-weight: 500;">${params.dueDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Amount -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f0e7ff 0%, #e9d5ff 100%); border: 2px solid #844fc1; border-radius: 8px; padding: 25px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Total Amount Due</p>
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #844fc1;">₹${params.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </td>
                </tr>
              </table>
              
              ${hasPaymentLink ? `
              <!-- Payment Link Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 2px solid #38ce3c; border-radius: 8px; padding: 25px; text-align: center;">
                    <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #333;">Pay Securely with Razorpay</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">Click or copy the payment link below:</p>
                    
                    <!-- Direct Payment Link -->
                    <div style="background-color: #ffffff; border: 2px solid #38ce3c; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                      <a href="${params.paymentLink}" style="color: #059669; font-size: 14px; font-weight: 500; text-decoration: underline; word-break: break-all; display: block;">${params.paymentLink}</a>
                    </div>
                    
                    <p style="margin: 0; font-size: 12px; color: #666;">Copy and paste this link in your browser to make payment</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #1e40af;">
                      <strong>PDF Attachment:</strong> The invoice PDF is attached to this email for your records.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                If you have any questions regarding this invoice, feel free to reply to this email.
              </p>
              
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #333;">
                Best regards,<br>
                <strong style="color: #844fc1;">InvoiceFlow Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                This is an automated email from <strong>InvoiceFlow</strong>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  private getPaymentConfirmationTemplate(params: PaymentConfirmationParams): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #38ce3c; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Payment Received!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="margin: 0 0 10px 0; font-size: 16px; text-align: center; color: #333;">Hi <strong>${params.customerName}</strong>,</p>
              
              <p style="margin: 0 0 30px 0; text-align: center; font-size: 18px; color: #38ce3c; font-weight: 600;">
                We've successfully received your payment!
              </p>
              
              <!-- Payment Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="font-weight: 600; color: #666; font-size: 14px;">Invoice Number:</td>
                        <td align="right" style="color: #333; font-family: monospace; font-size: 14px;">#${params.invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 600; color: #666; font-size: 14px;">Payment Date:</td>
                        <td align="right" style="color: #333; font-family: monospace; font-size: 14px;">${params.paidDate}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 600; color: #666; font-size: 14px;">Payment ID:</td>
                        <td align="right" style="color: #333; font-family: monospace; font-size: 14px;">${params.paymentId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Amount -->
              <p style="margin: 25px 0; font-size: 32px; font-weight: bold; color: #38ce3c; text-align: center;">
                ₹${params.amount.toFixed(2)}
              </p>
              
              <p style="margin: 25px 0 0 0; text-align: center; font-size: 15px; color: #666; line-height: 1.6;">
                Your payment has been successfully processed and your invoice is now marked as paid.
              </p>
              
              <p style="margin: 25px 0 0 0; text-align: center; font-size: 15px; color: #666;">
                Thank you for your business!
              </p>
              
              <p style="margin: 20px 0 0 0; text-align: center; font-size: 14px; color: #333;">
                Best regards,<br>
                <strong>InvoiceFlow Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                This is an automated confirmation from <strong>InvoiceFlow</strong>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  private getPaymentReminderTemplate(params: any): string {
    const isOverdue = params.daysOverdue && params.daysOverdue > 0
    const headerColor = isOverdue ? '#ef4444' : '#f59e0b'
    const headerText = isOverdue ? 'Payment Overdue' : 'Payment Reminder'

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${headerColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${headerText}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Hi <strong>${params.customerName}</strong>,</p>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #666; line-height: 1.6;">
                This is a ${isOverdue ? 'reminder that payment for' : 'friendly reminder about'} invoice <strong>#${params.invoiceNumber}</strong> is ${isOverdue ? `overdue by ${params.daysOverdue} days` : 'due soon'}.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <p style="margin: 0 0 8px 0; font-size: 15px; color: #333;"><strong>Amount:</strong> ₹${params.amount.toFixed(2)}</p>
                    <p style="margin: 0; font-size: 15px; color: #333;"><strong>Due Date:</strong> ${params.dueDate}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Payment Link -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 2px solid #38ce3c; border-radius: 8px; padding: 20px; text-align: center;">
                    <p style="margin: 0 0 15px 0; font-size: 15px; font-weight: 600; color: #333;">Pay Now:</p>
                    <div style="background-color: #ffffff; border: 2px solid #38ce3c; border-radius: 6px; padding: 12px;">
                      <a href="${params.paymentLink}" style="color: #059669; font-size: 14px; font-weight: 500; text-decoration: underline; word-break: break-all; display: block;">${params.paymentLink}</a>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #333;">
                Best regards,<br>
                <strong>InvoiceFlow Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                This is an automated reminder from <strong>InvoiceFlow</strong>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }
}

export default new EmailService();
