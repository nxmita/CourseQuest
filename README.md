# CourseQuest - USC Course Planning Platform

A comprehensive course planning and review platform for USC students, built from a Figma prototype.

## Features

- **Course Discovery**: Browse and search through USC's course catalog
- **Student Reviews**: Read authentic student reviews and ratings
- **Smart Scheduling**: Visual calendar planning with conflict detection
- **User Profiles**: Track your course history and favorites
- **Syllabus Archive**: Access course syllabi and materials
- **USC Branding**: Authentic USC colors and design

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
CourseQuest/
├── components/           # React components
│   ├── ui/             # Reusable UI components
│   ├── landing-page.tsx
│   ├── course-browser.tsx
│   ├── course-detail.tsx
│   ├── calendar-view.tsx
│   ├── login-page.tsx
│   └── profile-page.tsx
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
├── globals.css        # Global styles and CSS variables
└── package.json       # Dependencies and scripts
```

## Key Components

- **LandingPage**: Hero section and feature overview
- **CourseBrowser**: Course search and filtering
- **CourseDetail**: Detailed course information and reviews
- **CalendarView**: Visual schedule planning
- **ProfilePage**: User settings and course history

## Technologies Used

- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)
- Radix UI (component primitives)
- Sonner (notifications)

## USC Branding

The application uses official USC colors:
- Cardinal Red: #990000
- Gold: #FFCC00

## Development

The project uses Vite for fast development and building. Hot module replacement is enabled for instant updates during development.

## Deployment

The built application can be deployed to any static hosting service like:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

Simply upload the contents of the `dist` directory to your hosting service.
