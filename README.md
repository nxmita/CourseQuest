# CourseQuest 🎓

A comprehensive USC-themed course planning and scheduling application built with React, TypeScript, and Tailwind CSS. CourseQuest helps USC students discover, plan, and manage their academic journey with an intuitive interface and powerful features.

## ✨ Features

### 🔐 **Complete Authentication System**
- **USC Email Validation**: Only @usc.edu emails can create accounts
- **Secure Login/Signup**: Username or email login with password protection
- **Session Management**: Persistent login across browser sessions
- **User Profile Management**: Track academic progress and course history

### 📚 **Advanced Course Browser**
- **Comprehensive Course Database**: 30+ courses including Viterbi School of Engineering
- **Smart Filtering**: Filter by department, rating, workload, prerequisites, and credits
- **Real-time Search**: Search courses by code, title, or professor
- **Course Details**: Detailed information with schedules, prerequisites, and evaluation methods

### 📅 **Interactive Calendar System**
- **Visual Schedule Planning**: Weekly grid view with time slots
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Credit Tracking**: Monitor target vs. enrolled credits
- **Course Management**: Add/remove courses with one click

### 👤 **Profile & Progress Tracking**
- **Academic Dashboard**: Track completed, enrolled, and required credits
- **Course History**: Manage completed courses with search functionality
- **Review System**: Write and manage course reviews
- **Favorites**: Save courses for later consideration

### ⭐ **Dynamic Review System**
- **User Reviews**: Write detailed reviews with ratings
- **Anonymous Options**: Post reviews anonymously if preferred
- **Review Management**: Edit or delete your own reviews
- **Dynamic Ratings**: Course ratings update based on user reviews

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React Hooks with localStorage persistence
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives with custom styling

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/CourseQuest.git
cd CourseQuest
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:5173](http://localhost:5173)

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
CourseQuest/
├── components/
│   ├── ui/                    # Reusable UI components (Shadcn/ui)
│   ├── course-browser.tsx     # Course search and filtering
│   ├── calendar-view.tsx      # Visual schedule planner
│   ├── course-detail.tsx      # Individual course information
│   ├── profile-page.tsx       # User profile and course history
│   ├── login-page.tsx         # User authentication
│   ├── signup-page.tsx        # User registration
│   ├── landing-page.tsx       # Homepage
│   ├── course-data.ts         # Course database and types
│   └── user-data.ts           # User management system
├── App.tsx                    # Main application component
├── main.tsx                   # Application entry point
├── globals.css                # Global styles and CSS variables
└── package.json               # Dependencies and scripts
```

## 🎯 Key Features in Detail

### Course Management
- **30+ Courses**: Computer Science, Engineering, Mathematics, Sciences, and more
- **Viterbi Engineering**: EE, AME, ISE, BME, and CE courses
- **Real-time Filtering**: Department, rating, workload, prerequisites, credits
- **Search Functionality**: Find courses by code, title, or professor

### Calendar Planning
- **Weekly View**: Monday-Friday schedule with time slots
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Credit Management**: Track target vs. enrolled credits
- **Course Addition**: One-click course addition to calendar

### User Experience
- **USC Theming**: Authentic cardinal red (#990000) and gold (#FFCC00) colors
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished interactions and transitions
- **Accessibility**: Keyboard navigation and screen reader support

## 🔧 Development

### Adding New Courses
1. Edit `components/course-data.ts`
2. Add course object to `mockCourses` array
3. Include all required fields: id, code, title, credits, professor, department, etc.

### Styling Guidelines
- Use USC colors: `#990000` (cardinal red) and `#FFCC00` (gold)
- Follow Tailwind CSS utility-first approach
- Maintain consistency with Shadcn/ui component patterns

### State Management
- User data: `user-data.ts` with localStorage persistence
- Course data: `course-data.ts` with mock data
- Application state: React hooks in `App.tsx`

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the coding standards and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add some amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**: Describe your changes and link any related issues

### Development Guidelines
- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Maintain USC branding consistency
- Test on multiple screen sizes
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **USC** for the authentic branding and color scheme
- **Shadcn/ui** for the beautiful component library
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first styling approach
- **Vite** for the fast development experience
- **React & TypeScript communities** for excellent tooling and documentation

## 📞 Support

For questions, issues, or contributions, please:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Contact the development team

---

**Built with ❤️ for USC students by USC students** 🎓