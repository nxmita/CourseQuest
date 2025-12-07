import { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import { LandingPage } from './components/landing-page';
import { CourseBrowser } from './components/course-browser';
import { CourseDetail } from './components/course-detail';
import { CalendarView } from './components/calendar-view';
import { LoginPage } from './components/login-page';
import { SignupPage } from './components/signup-page';
import { ProfilePage } from './components/profile-page';
import { Calendar, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Toaster } from './components/ui/sonner';
import { Course } from './course-data';
import { userDatabase, UserPreferences } from './components/user-data';
import { toast } from 'sonner';
import { GoogleAnalytics, trackPageView } from './components/analytics';
import { Analytics } from '@vercel/analytics/react';

// Helper function to get view from URL hash
const getViewFromUrl = (): string => {
  const hash = window.location.hash.replace('#', '');
  // Valid views
  const validViews = ['landing', 'login', 'signup', 'browse', 'calendar', 'profile', 'course-detail'];
  if (hash && validViews.includes(hash)) {
    return hash;
  }
  // Default to landing if no hash or invalid hash
  return 'landing';
};

// Helper function to update URL hash
const updateUrlHash = (view: string) => {
  if (window.location.hash !== `#${view}`) {
    window.history.pushState({ view }, '', `#${view}`);
  }
};

export default function App() {
  // Initialize currentView from URL
  const [currentView, setCurrentView] = useState(() => getViewFromUrl());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [calendarCourses, setCalendarCourses] = useState<Course[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [favoritedCourses, setFavoritedCourses] = useState<Course[]>([]);
  const [userMajor, setUserMajor] = useState('Computer Science');
  const [targetCredits, setTargetCredits] = useState(0);
  const [courseHistory, setCourseHistory] = useState<Array<{ course: Course; hasReview: boolean; reviewData?: any }>>([]);
  const [userReviews, setUserReviews] = useState<Record<string, any>>({});
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [allReviewsByCourse, setAllReviewsByCourse] = useState<Record<string, any[]>>({});
  const [courseSelectedSchedules, setCourseSelectedSchedules] = useState<Record<string, string>>({}); // courseId -> selected schedule string
  const [initialTab, setInitialTab] = useState<string>('overview'); // Track which tab to open in course detail
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>(''); // Save search query when navigating to course detail

  // Initialize URL hash on first load if not present
  useEffect(() => {
    if (!window.location.hash) {
      updateUrlHash('landing');
    }
  }, []);

  // Check for existing user on app load and load preferences
  useEffect(() => {
    const existingUser = userDatabase.getCurrentUser();
    if (existingUser) {
      setCurrentUser(existingUser);
      setIsLoggedIn(true);
      // Load user preferences
      const preferences = userDatabase.loadUserPreferences(existingUser.id);
      if (preferences) {
        setCalendarCourses(preferences.calendarCourses || []);
        setFavoritedCourses(preferences.favoritedCourses || []);
        setCourseHistory(preferences.courseHistory || []);
        setUserMajor(preferences.userMajor || 'Computer Science');
        setTargetCredits(preferences.targetCredits || 0);
        setCourseSelectedSchedules(preferences.courseSelectedSchedules || {});
        setAllReviewsByCourse(preferences.allReviewsByCourse || {});
        setUserReviews(preferences.userReviews || {});
      }
    }
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    // Load user preferences
    const preferences = userDatabase.loadUserPreferences(user.id);
    if (preferences) {
      setCalendarCourses(preferences.calendarCourses || []);
      setFavoritedCourses(preferences.favoritedCourses || []);
      setCourseHistory(preferences.courseHistory || []);
      setUserMajor(preferences.userMajor || 'Computer Science');
      setTargetCredits(preferences.targetCredits || 0);
      setCourseSelectedSchedules(preferences.courseSelectedSchedules || {});
      setAllReviewsByCourse(preferences.allReviewsByCourse || {});
      setUserReviews(preferences.userReviews || {});
    }
    setCurrentView('browse');
  };

  const handleSignup = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    // New users start with default preferences
    setCalendarCourses([]);
    setFavoritedCourses([]);
    setCourseHistory([]);
    setUserMajor('Computer Science');
    setTargetCredits(0);
    setCourseSelectedSchedules({});
    setAllReviewsByCourse({});
    setUserReviews({});
    setCurrentView('browse');
  };

  const handleLogout = () => {
    // Save preferences before logging out (if user was logged in)
    if (currentUser) {
      const preferences = {
        calendarCourses,
        favoritedCourses,
        courseHistory,
        userMajor,
        targetCredits,
        courseSelectedSchedules,
        allReviewsByCourse,
        userReviews
      };
      userDatabase.saveUserPreferences(currentUser.id, preferences);
    }
    
    userDatabase.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCalendarCourses([]); // Reset calendar completely
    setCourseSelectedSchedules({}); // Reset selected schedules
    setLocalReviews([]); // Reset reviews
    setCourseHistory([]); // Reset course history
    setFavoritedCourses([]); // Reset favorites
    setAllReviewsByCourse({}); // Reset reviews by course
    setUserReviews({}); // Reset user reviews
    setCurrentView('landing');
  };

  // Sync URL hash with currentView and handle browser back/forward buttons
  useEffect(() => {
    // Update URL hash when view changes
    updateUrlHash(currentView);
    
    // Track page views when view changes
    const path = window.location.pathname + window.location.search + window.location.hash;
    trackPageView(path);
  }, [currentView]);

  // Listen for browser back/forward button clicks (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromUrl();
      if (view !== currentView) {
        setCurrentView(view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Also handle hashchange for direct hash navigation
    const handleHashChange = () => {
      const view = getViewFromUrl();
      if (view !== currentView) {
        setCurrentView(view);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentView]);

  // Save preferences whenever they change (only if user is logged in)
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const preferences: UserPreferences = {
        calendarCourses,
        favoritedCourses,
        courseHistory,
        userMajor,
        targetCredits,
        courseSelectedSchedules,
        allReviewsByCourse,
        userReviews
      };
      userDatabase.saveUserPreferences(currentUser.id, preferences);
    }
  }, [calendarCourses, favoritedCourses, courseHistory, userMajor, targetCredits, courseSelectedSchedules, allReviewsByCourse, userReviews, isLoggedIn, currentUser]);

  const toggleFavorite = (course: Course) => {
    setFavoritedCourses(prev => {
      const isFavorited = prev.some(c => c.id === course.id);
      if (isFavorited) {
        return prev.filter(c => c.id !== course.id);
      } else {
        return [...prev, course];
      }
    });
  };

  const isFavorited = (courseId: string) => {
    return favoritedCourses.some(c => c.id === courseId);
  };

  const handleReviewSubmit = (courseId: string, reviewData: any) => {
    // The actual review submission is handled in CourseDetail and user-data.ts
    // This function now primarily ensures local state is updated
    const updatedReviews = userDatabase.getReviewsForCourse(courseId);
    setLocalReviews(updatedReviews);
    setAllReviewsByCourse(prev => ({
      ...prev,
      [courseId]: updatedReviews
    }));
    // Update course history to reflect review status
    setCourseHistory(prev => prev.map(item =>
      item.course.id === courseId
        ? { ...item, hasReview: true, reviewData: userDatabase.getUserReviewForCourse(courseId) }
        : item
    ));
  };

  const handleReviewDelete = (courseId: string, reviewId: string) => {
    // Review deletion is now handled in course-detail.tsx using userDatabase
    // This function updates the local state and course history
    const updatedReviews = userDatabase.getReviewsForCourse(courseId);
    setLocalReviews(updatedReviews);
    setAllReviewsByCourse(prev => ({
      ...prev,
      [courseId]: updatedReviews
    }));
    
    // Update courseHistory to reflect that the review was deleted
    setCourseHistory(prev => {
      return prev.map(item => {
        if (item.course.id === courseId) {
          // Check if user still has a review for this course
          const hasReview = userDatabase.hasUserReviewedCourse(courseId);
          return { ...item, hasReview, reviewData: hasReview ? userDatabase.getUserReviewForCourse(courseId) : undefined };
        }
        return item;
      });
    });
    toast.success('Review deleted successfully');
  };

  const handleAddCompletedCourse = (course: Course) => {
    setCourseHistory(prev => {
      const isAlreadyAdded = prev.some(item => item.course.id === course.id);
      if (!isAlreadyAdded) {
        return [...prev, { course, hasReview: false }];
      }
      return prev;
    });
  };

  const handleRemoveCompletedCourse = (courseId: string) => {
    setCourseHistory(prev => prev.filter(item => item.course.id !== courseId));
  };

  const totalCreditsTaken = courseHistory.reduce((sum, item) => sum + item.course.credits, 0);
  const currentEnrolledCredits = calendarCourses.reduce((sum, course) => sum + course.credits, 0);
  const isVerifiedStudent = currentUser?.email?.toLowerCase().includes('@usc.edu') || false;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={() => setCurrentView('browse')} onStartPlanning={() => setCurrentView('calendar')} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('landing')} onSignup={() => setCurrentView('signup')} />;
      case 'signup':
        return <SignupPage onSignupSuccess={handleSignup} onBack={() => setCurrentView('login')} onLogin={() => setCurrentView('login')} />;
      case 'browse':
        return (
          <CourseBrowser 
            initialSearchQuery={savedSearchQuery}
            onCourseSelect={(course, currentSearchQuery) => {
              // Save the current search query before navigating to course detail
              if (currentSearchQuery !== undefined) {
                setSavedSearchQuery(currentSearchQuery);
              }
              setSelectedCourse(course);
              setInitialTab('overview'); // Default to overview tab
              // Load reviews from global storage
              const reviews = userDatabase.getReviewsForCourse(course.id);
              setLocalReviews(reviews);
              setAllReviewsByCourse(prev => ({
                ...prev,
                [course.id]: reviews
              }));
              setCurrentView('course-detail');
              // Scroll to top when opening course details
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            calendarCourses={calendarCourses}
            onAddToCalendar={(course, selectedSchedule) => {
              setCalendarCourses(prev => {
                // Check by course code, not just ID (to handle deduplicated courses)
                const isAlreadyAdded = prev.some(c => c.code.toLowerCase() === course.code.toLowerCase());
              if (!isAlreadyAdded) {
                  // Store the selected schedule for this course
                  if (selectedSchedule) {
                    setCourseSelectedSchedules(prevSchedules => ({
                      ...prevSchedules,
                      [course.id]: selectedSchedule
                    }));
                  }
                  return [...prev, course];
                }
                return prev;
              });
              // Return true if course wasn't already added (check current state for return value)
              const wasAdded = !calendarCourses.some(c => c.code.toLowerCase() === course.code.toLowerCase());
              return wasAdded;
            }}
            onRemoveFromCalendar={(courseId) => {
              setCalendarCourses(prev => prev.filter(c => c.id !== courseId));
              // Remove the selected schedule for this course
              setCourseSelectedSchedules(prev => {
                const newSchedules = { ...prev };
                delete newSchedules[courseId];
                return newSchedules;
              });
            }}
            onReplaceCourse={(oldCourseId, newCourse, selectedSchedule) => {
              // Atomically replace old course with new course
              setCalendarCourses(prev => {
                const filtered = prev.filter(c => c.id !== oldCourseId);
                const isAlreadyAdded = filtered.some(c => c.id === newCourse.id);
                if (!isAlreadyAdded) {
                  // Store the selected schedule for the new course
                  if (selectedSchedule) {
                    setCourseSelectedSchedules(prevSchedules => {
                      const newSchedules = { ...prevSchedules };
                      delete newSchedules[oldCourseId];
                      return {
                        ...newSchedules,
                        [newCourse.id]: selectedSchedule
                      };
                    });
                  } else {
                    // Remove the schedule for the old course
                    setCourseSelectedSchedules(prev => {
                      const newSchedules = { ...prev };
                      delete newSchedules[oldCourseId];
                      return newSchedules;
                    });
                  }
                  return [...filtered, newCourse];
                }
                return filtered;
              });
            }}
            favoritedCourses={favoritedCourses}
            onToggleFavorite={toggleFavorite}
            allReviewsByCourse={allReviewsByCourse}
            courseSelectedSchedules={courseSelectedSchedules}
          />
        );
      case 'course-detail':
        return (
          <CourseDetail 
            course={selectedCourse!}
            onBack={() => {
              setCurrentView('browse');
              // Keep the saved search query so it's restored when CourseBrowser mounts
            }}
            calendarCourses={calendarCourses}
            onAddToCalendar={(course, selectedSchedule) => {
              setCalendarCourses(prev => {
                // Check by course code, not just ID (to handle deduplicated courses)
                const isAlreadyAdded = prev.some(c => c.code.toLowerCase() === course.code.toLowerCase());
              if (!isAlreadyAdded) {
                  // Store the selected schedule for this course
                  if (selectedSchedule) {
                    setCourseSelectedSchedules(prevSchedules => ({
                      ...prevSchedules,
                      [course.id]: selectedSchedule
                    }));
                  }
                  return [...prev, course];
                }
                return prev;
              });
              // Return true if course wasn't already added
              const wasAdded = !calendarCourses.some(c => c.code.toLowerCase() === course.code.toLowerCase());
              return wasAdded;
            }}
            onRemoveFromCalendar={(courseId) => {
              setCalendarCourses(prev => prev.filter(c => c.id !== courseId));
              // Remove the selected schedule for this course
              setCourseSelectedSchedules(prev => {
                const newSchedules = { ...prev };
                delete newSchedules[courseId];
                return newSchedules;
              });
            }}
            onReplaceCourse={(oldCourseId, newCourse, selectedSchedule) => {
              // Atomically replace old course with new course
              setCalendarCourses(prev => {
                const filtered = prev.filter(c => c.id !== oldCourseId);
                // Check by course code, not just ID
                const isAlreadyAdded = filtered.some(c => c.code.toLowerCase() === newCourse.code.toLowerCase());
                if (!isAlreadyAdded) {
                  // Store the selected schedule for the new course
                  if (selectedSchedule) {
                    setCourseSelectedSchedules(prevSchedules => {
                      const newSchedules = { ...prevSchedules };
                      delete newSchedules[oldCourseId];
                      return {
                        ...newSchedules,
                        [newCourse.id]: selectedSchedule
                      };
                    });
                  } else {
                    // Remove the schedule for the old course
                    setCourseSelectedSchedules(prev => {
                      const newSchedules = { ...prev };
                      delete newSchedules[oldCourseId];
                      return newSchedules;
                    });
                  }
                  return [...filtered, newCourse];
                }
                return filtered;
              });
            }}
            courseSelectedSchedules={courseSelectedSchedules}
            isLoggedIn={isLoggedIn}
            isFavorited={isFavorited(selectedCourse?.id || '')}
            onToggleFavorite={() => selectedCourse && toggleFavorite(selectedCourse)}
            onReviewSubmit={(reviewData) => selectedCourse && handleReviewSubmit(selectedCourse.id, reviewData)}
            onReviewDelete={handleReviewDelete}
            username={currentUser?.username || ''}
            localReviews={localReviews}
            initialTab={initialTab}
            setLocalReviews={(reviews) => {
              setLocalReviews(reviews);
              // Also update all reviews by course
              if (selectedCourse) {
                setAllReviewsByCourse(prev => ({
                  ...prev,
                  [selectedCourse.id]: reviews
                }));
              }
            }}
            onReviewsUpdate={(courseId, reviews) => {
              setAllReviewsByCourse(prev => ({
                ...prev,
                [courseId]: reviews
              }));
              // Also update localReviews if this is the selected course
              if (selectedCourse && selectedCourse.id === courseId) {
                setLocalReviews(reviews);
              }
            }}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            calendarCourses={calendarCourses} 
            onRemoveFromCalendar={(courseId) => {
              setCalendarCourses(calendarCourses.filter(c => c.id !== courseId));
              // Remove the selected schedule for this course
              setCourseSelectedSchedules(prev => {
                const newSchedules = { ...prev };
                delete newSchedules[courseId];
                return newSchedules;
              });
            }}
            onAddToCalendar={(course, selectedSchedule) => {
              // Check by course code, not just ID (to handle deduplicated courses)
              const isAlreadyAdded = calendarCourses.some(c => c.code.toLowerCase() === course.code.toLowerCase());
              if (!isAlreadyAdded) {
                setCalendarCourses([...calendarCourses, course]);
                // Store the selected schedule for this course
                if (selectedSchedule) {
                  setCourseSelectedSchedules(prev => ({
                    ...prev,
                    [course.id]: selectedSchedule
                  }));
                }
                return true;
              }
              return false;
            }}
            isLoggedIn={isLoggedIn}
            favoritedCourses={favoritedCourses}
            onToggleFavorite={toggleFavorite}
            allReviewsByCourse={allReviewsByCourse}
            courseSelectedSchedules={courseSelectedSchedules}
            onCourseSelect={(course) => {
              setSelectedCourse(course);
              setInitialTab('overview'); // Default to overview tab
              // Load reviews from global storage
              const reviews = userDatabase.getReviewsForCourse(course.id);
              setLocalReviews(reviews);
              setAllReviewsByCourse(prev => ({
                ...prev,
                [course.id]: reviews
              }));
              setCurrentView('course-detail');
              // Scroll to top when opening course details
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'profile':
        if (!isLoggedIn) {
          return <LandingPage onGetStarted={() => setCurrentView('browse')} onStartPlanning={() => setCurrentView('calendar')} />;
        }
        return (
          <ProfilePage
            username={currentUser?.username || ''}
            isVerifiedStudent={isVerifiedStudent}
            userMajor={userMajor}
            onMajorChange={setUserMajor}
            courseHistory={courseHistory}
            favoritedCourses={favoritedCourses}
            targetCredits={targetCredits}
            onTargetCreditsChange={setTargetCredits}
            totalCreditsTaken={totalCreditsTaken}
            currentEnrolledCredits={currentEnrolledCredits}
            onCourseSelect={(course) => {
              setSelectedCourse(course);
              setInitialTab('overview'); // Default to overview tab
              setCurrentView('course-detail');
            }}
            onWriteReview={(course) => {
              setSelectedCourse(course);
              setInitialTab('reviews'); // Open to reviews tab
              // Load reviews from global storage
              const reviews = userDatabase.getReviewsForCourse(course.id);
              setLocalReviews(reviews);
              setAllReviewsByCourse(prev => ({
                ...prev,
                [course.id]: reviews
              }));
              setCurrentView('course-detail');
              // Scroll to top when opening course details
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEditReview={(course) => {
              setSelectedCourse(course);
              setInitialTab('reviews'); // Open to reviews tab
              // Load reviews from global storage
              const reviews = userDatabase.getReviewsForCourse(course.id);
              setLocalReviews(reviews);
              setAllReviewsByCourse(prev => ({
                ...prev,
                [course.id]: reviews
              }));
              setCurrentView('course-detail');
              // Scroll to top when opening course details
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            onAddCompletedCourse={handleAddCompletedCourse}
            onRemoveCompletedCourse={handleRemoveCompletedCourse}
          />
        );
      default:
        return <LandingPage onGetStarted={() => setCurrentView('browse')} onStartPlanning={() => setCurrentView('calendar')} />;
    }
  };

  if (currentView === 'landing' || currentView === 'login') {
    return (
      <>
        <GoogleAnalytics />
        <Analytics />
        {renderCurrentView()}
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GoogleAnalytics />
      {/* Navigation Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-lg" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => setCurrentView('landing')}
            >
              <h1 className="text-2xl font-bold" style={{ color: '#990000' }}>
                CourseQuest
              </h1>
              <div className="ml-2 w-1 h-6 rounded-full" style={{ backgroundColor: '#FFCC00' }}></div>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Button
                variant={currentView === 'browse' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('browse')}
                className="flex items-center gap-2"
                style={currentView === 'browse' ? { backgroundColor: '#990000', color: 'white', border: '1px solid #FFCC00' } : {}}
              >
                <Search className="h-4 w-4" />
                Browse Courses
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('calendar')}
                className="flex items-center gap-2"
                style={currentView === 'calendar' ? { backgroundColor: '#990000', color: 'white', border: '1px solid #FFCC00' } : {}}
              >
                <Calendar className="h-4 w-4" />
                My Calendar
                {calendarCourses.length > 0 && (
                  <span 
                    className="ml-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: '#FFCC00', color: '#000' }}
                  >
                    {calendarCourses.length}
                  </span>
                )}
              </Button>

              {isLoggedIn ? (
                <div className="ml-4 pl-4 border-l">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(153, 0, 0, 0.1)' }}>
                        <User className="h-4 w-4" style={{ color: '#990000' }} />
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setCurrentView('profile')}>
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => setCurrentView('login')}
                  className="flex items-center gap-2 ml-4"
                  style={{ backgroundColor: '#990000', color: 'white' }}
                >
                  <User className="h-4 w-4" />
                  Login / Sign Up
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderCurrentView()}
      </main>
      
      <GoogleAnalytics />
      <Analytics />
      <Toaster />
    </div>
  );
}