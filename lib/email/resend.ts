import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
  tags?: Array<{
    name: string
    value: string
  }>
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

// Email templates
export const emailTemplates = {
  welcomeEmail: (name: string, email: string): EmailTemplate => ({
    subject: 'Welcome to BPMN Studio - Your Process Modeling Journey Begins!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to BPMN Studio</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to BPMN Studio!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e4e8; border-top: none;">
            <h2>Hi ${name},</h2>
            
            <p>Thank you for joining BPMN Studio! We're excited to have you on board.</p>
            
            <p>With BPMN Studio, you can:</p>
            <ul>
              <li>✨ Create professional BPMN diagrams with ease</li>
              <li>🎯 Collaborate with your team in real-time</li>
              <li>📊 Export to multiple formats (XML, SVG, PNG)</li>
              <li>🚀 Integrate with your favorite tools</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/studio" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Creating</a>
            </div>
            
            <p>Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs">documentation</a> or reply to this email.</p>
            
            <p>Best regards,<br>The BPMN Studio Team</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} BPMN Studio. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #666;">Unsubscribe</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #666;">Privacy Policy</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${name},\n\nThank you for joining BPMN Studio! We're excited to have you on board.\n\nGet started: ${process.env.NEXT_PUBLIC_APP_URL}/studio\n\nBest regards,\nThe BPMN Studio Team`
  }),

  projectShared: (projectName: string, sharedBy: string, recipientEmail: string): EmailTemplate => ({
    subject: `${sharedBy} shared "${projectName}" with you`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Shared</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f6f8fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #24292e;">📊 Project Shared With You</h2>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e1e4e8; border-radius: 6px;">
            <p><strong>${sharedBy}</strong> has shared the project <strong>"${projectName}"</strong> with you on BPMN Studio.</p>
            
            <div style="background: #f6f8fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Project:</strong> ${projectName}</p>
              <p style="margin: 5px 0;"><strong>Shared by:</strong> ${sharedBy}</p>
              <p style="margin: 5px 0;"><strong>Access level:</strong> Collaborator</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" style="background: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Project</a>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `${sharedBy} has shared the project "${projectName}" with you on BPMN Studio.\n\nView project: ${process.env.NEXT_PUBLIC_APP_URL}/projects`
  }),

  subscriptionUpgraded: (plan: string, email: string): EmailTemplate => ({
    subject: 'Your BPMN Studio subscription has been upgraded!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Subscription Upgraded</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Subscription Upgraded!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e4e8; border-top: none;">
            <p>Great news! Your BPMN Studio account has been upgraded to <strong>${plan}</strong>.</p>
            
            <h3>Your new features include:</h3>
            <ul>
              <li>✅ Unlimited projects and diagrams</li>
              <li>✅ Advanced export formats (SVG, PNG, PDF)</li>
              <li>✅ Real-time collaboration</li>
              <li>✅ Version history and rollback</li>
              <li>✅ Priority support</li>
              <li>✅ Custom branding options</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Subscription</a>
            </div>
            
            <p>Thank you for choosing BPMN Studio Pro!</p>
          </div>
        </body>
      </html>
    `,
    text: `Great news! Your BPMN Studio account has been upgraded to ${plan}.\n\nManage your subscription: ${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`
  })
}

// Send email function
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Use default from address if not provided
    const from = options.from || process.env.EMAIL_FROM || 'BPMN Studio <noreply@bpmn-studio.com>'
    
    const data = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html || '',
      text: options.text || '',
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      tags: options.tags,
    } as any)
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// Batch send emails
export async function sendBatchEmails(emails: EmailOptions[]): Promise<{ success: boolean; error?: string; results?: any[] }> {
  try {
    const results = await Promise.allSettled(
      emails.map(email => sendEmail(email))
    )
    
    const failures = results.filter(r => r.status === 'rejected')
    
    if (failures.length > 0) {
      console.error(`${failures.length} emails failed to send`)
    }
    
    return {
      success: failures.length === 0,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
    }
  } catch (error) {
    console.error('Batch email send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch send failed'
    }
  }
}

// Send transactional emails with retry logic
export async function sendTransactionalEmail(
  options: EmailOptions,
  retries = 3
): Promise<{ success: boolean; error?: string; data?: any }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await sendEmail(options)
    
    if (result.success) {
      return result
    }
    
    if (attempt < retries) {
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  return {
    success: false,
    error: `Failed to send email after ${retries} attempts`
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Sanitize email content to prevent injection
export function sanitizeEmailContent(content: string): string {
  // Remove script tags and potential XSS vectors
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}