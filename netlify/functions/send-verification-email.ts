import { Handler } from '@netlify/functions';

interface EmailRequest {
  email: string;
  code: string;
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, code }: EmailRequest = JSON.parse(event.body || '{}');

    if (!email || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and code are required' })
      };
    }

    const apiKey = process.env.VITE_EMAIL_API_KEY;
    const emailService = process.env.VITE_EMAIL_SERVICE || 'resend';
    // Default to Resend's test domain if not specified (no verification needed)
    const fromEmail = process.env.VITE_EMAIL_FROM || 'onboarding@resend.dev';

    if (!apiKey) {
      console.error('Email API key not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    // Send email based on service
    if (emailService === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'CourseQuest Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #990000;">CourseQuest Verification Code</h2>
              <p>Thank you for signing up for CourseQuest!</p>
              <p>Your verification code is:</p>
              <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
                ${code}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">CourseQuest - USC Course Planning Made Easy</p>
            </div>
          `
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Resend API error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to send email' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Verification code sent' })
      };
    } else if (emailService === 'sendgrid') {
      // SendGrid implementation
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email }]
          }],
          from: { email: fromEmail },
          subject: 'CourseQuest Verification Code',
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #990000;">CourseQuest Verification Code</h2>
                <p>Thank you for signing up for CourseQuest!</p>
                <p>Your verification code is:</p>
                <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
                  ${code}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">CourseQuest - USC Course Planning Made Easy</p>
              </div>
            `
          }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid API error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to send email' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Verification code sent' })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported email service' })
      };
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

