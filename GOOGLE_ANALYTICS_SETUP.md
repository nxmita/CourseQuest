# Google Analytics Setup Guide

## Getting Your Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Create a new property (or use an existing one)
4. Set up a **Web** data stream
5. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

## Setting Up the Measurement ID

### For Local Development:

1. Create a `.env` file in the root directory (if it doesn't exist)
2. Add your Google Analytics Measurement ID:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   Replace `G-XXXXXXXXXX` with your actual Measurement ID

### For Production (Vercel):

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `VITE_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX` (your Measurement ID)
   - **Environment**: Production, Preview, Development (select all)

### For Production (Netlify):

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add:
   - **Key**: `VITE_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX` (your Measurement ID)
   - **Scopes**: All scopes (or specific ones)

## What Gets Tracked

The integration automatically tracks:
- **Page views** - When users navigate between pages
- **Custom events** - Can be added throughout the app

## Adding Custom Event Tracking

You can track custom events anywhere in your app:

```typescript
import { trackEvent } from './components/analytics';

// Example: Track when a user adds a course to calendar
trackEvent('add_to_calendar', {
  course_code: 'CSCI-103',
  course_title: 'Introduction to Programming'
});

// Example: Track when a user writes a review
trackEvent('write_review', {
  course_code: 'CSCI-103',
  rating: 4.5
});
```

## Testing

1. Set up your Measurement ID in environment variables
2. Deploy or run locally
3. Visit your site and navigate around
4. Go to Google Analytics → **Reports** → **Realtime** to see live data
5. It may take a few minutes for data to appear

## Important Notes

- The Measurement ID is stored as an environment variable, not in your code
- Never commit your `.env` file (it's already in `.gitignore`)
- Analytics only works in production or when the environment variable is set
- If `VITE_GA_MEASUREMENT_ID` is not set, analytics will be disabled (no errors)

