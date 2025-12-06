# Email Verification Setup Guide

## Where to Put Your API Key

### For Netlify Deployment:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add the following environment variables:
   - `VITE_EMAIL_API_KEY` = Your API key (e.g., `re_xxxxxxxxxxxxx` for Resend)
   - `VITE_EMAIL_SERVICE` = `resend` or `sendgrid` (depending on which service you're using)
   - `VITE_EMAIL_FROM` = Your verified sender email (e.g., `noreply@yourdomain.com`)

### For Vercel Deployment:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the same environment variables as above:
   - `VITE_EMAIL_API_KEY`
   - `VITE_EMAIL_SERVICE`
   - `VITE_EMAIL_FROM`

### For Local Development:

1. Create a `.env` file in the root directory
2. Add your API key and use Resend's test domain:
   ```
   VITE_EMAIL_API_KEY=re_your_api_key_here
   VITE_EMAIL_SERVICE=resend
   VITE_EMAIL_FROM=onboarding@resend.dev
   ```
   
   **Quick Start with Resend Test Domain:**
   - No domain verification needed!
   - Just get your API key from https://resend.com/api-keys
   - Use `onboarding@resend.dev` as the sender email
   - Emails will work immediately (may go to spam folder)

## Supported Email Services

### Resend (Recommended)
- Sign up at https://resend.com
- Get your API key from https://resend.com/api-keys
- **For Testing (No Domain Verification Needed):**
  - Use Resend's test domain: `onboarding@resend.dev`
  - Set `VITE_EMAIL_FROM=onboarding@resend.dev`
  - This works immediately without domain verification
  - **Note:** Test domain emails may go to spam, so check your spam folder
- **For Production:**
  - Verify your domain in Resend dashboard
  - Use your verified domain: `noreply@yourdomain.com`
- Set `VITE_EMAIL_SERVICE=resend`

### SendGrid
- Sign up at https://sendgrid.com
- Get your API key from https://app.sendgrid.com/settings/api_keys
- Verify your sender email
- Set `VITE_EMAIL_SERVICE=sendgrid`

## Important Notes

- **Never commit your `.env` file** - it's already in `.gitignore`
- The API key is stored as an environment variable, not in your code
- **Using Resend Test Domain (`onboarding@resend.dev`):**
  - Works immediately without domain verification
  - Perfect for testing and development
  - Emails may go to spam folder - check there!
  - Limited to 100 emails per day on free tier
  - For production, verify your own domain for better deliverability
- For local development, emails won't send unless you set up the API key
- In production, the serverless function will use the environment variables you set in your hosting platform

## Testing

1. Set up your API key in your deployment platform's environment variables
2. Deploy your site
3. Try signing up with a test email
4. Check your email inbox for the verification code

If emails aren't sending, check:
- API key is correct
- Sender email is verified with your email service
- Environment variables are set correctly in your deployment platform
- Check the browser console and server logs for errors

