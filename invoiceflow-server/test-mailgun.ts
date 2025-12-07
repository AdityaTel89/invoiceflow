// backend/test-mailgun.ts
import formData from 'form-data'
import Mailgun from 'mailgun.js'
import * as dotenv from 'dotenv'

dotenv.config()

const mailgun = new Mailgun(formData)
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
  url: 'https://api.mailgun.net'
})

async function testMailgun() {
  try {
    console.log('🧪 Testing Mailgun configuration...')
    console.log('Domain:', process.env.MAILGUN_DOMAIN)
    console.log('From:', process.env.MAILGUN_FROM_EMAIL)
    
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
      from: process.env.MAILGUN_FROM_EMAIL!,
      to: ['adityatelsinge@gmail.com'], // Use your authorized recipient email
      subject: 'Test Email from InvoiceFlow',
      text: 'This is a test email!',
      html: '<h1>Test Email</h1><p>If you see this, Mailgun is working! 🎉</p>'
    })

    console.log('✅ Email sent successfully!')
    console.log('Message ID:', response.id)
  } catch (error: any) {
    console.error('❌ Test failed:', error)
    console.error('Status:', error.status)
    console.error('Message:', error.message)
  }
}

testMailgun()
