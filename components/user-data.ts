// User data management system
import { Review } from '../course-data';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface UserPreferences {
  calendarCourses: any[];
  favoritedCourses: any[];
  courseHistory: Array<{ course: any; hasReview: boolean; reviewData?: any }>;
  userMajor: string;
  targetCredits: number;
  courseSelectedSchedules: Record<string, string>;
  allReviewsByCourse: Record<string, any[]>;
  userReviews: Record<string, any>;
}

// Mock database using localStorage
const USERS_KEY = 'coursequest_users';
const CURRENT_USER_KEY = 'coursequest_current_user';
const VERIFICATION_CODES_KEY = 'coursequest_verification_codes';

export const userDatabase = {
  // Get all users from localStorage
  getAllUsers: (): User[] => {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },

  // Save users to localStorage
  saveUsers: (users: User[]): void => {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  },

  // Add a new user
  addUser: (user: Omit<User, 'id' | 'createdAt'>): User | null => {
    const users = userDatabase.getAllUsers();
    
    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      throw new Error('Username already exists');
    }
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    userDatabase.saveUsers(users);
    return newUser;
  },

  // Find user by username or email
  findUser: (usernameOrEmail: string): User | null => {
    const users = userDatabase.getAllUsers();
    return users.find(u => 
      u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
      u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    ) || null;
  },

  // Validate user credentials
  validateUser: (usernameOrEmail: string, password: string): User | null => {
    const user = userDatabase.findUser(usernameOrEmail);
    if (user && user.password === password) {
      return user;
    }
    return null;
  },

  // Set current user
  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    try {
      const user = localStorage.getItem(CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  },

  // Logout current user
  logout: (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Validate USC email
  isValidUSCEmail: (email: string): boolean => {
    const emailLower = email.toLowerCase();
    
    // Must end with @usc.edu
    if (!emailLower.endsWith('@usc.edu')) {
      return false;
    }
    
    // Extract the part before @
    const localPart = emailLower.split('@')[0];
    
    // Must be at least 5 characters long
    if (localPart.length < 5) {
      return false;
    }
    
    // Must contain only English letters or digits (no special symbols)
    if (!/^[a-z0-9]+$/.test(localPart)) {
      return false;
    }
    
    return true;
  },

  // Validate password strength
  validatePassword: (password: string): { isValid: boolean; message: string } => {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    return { isValid: true, message: '' };
  },

  // Validate username
  validateUsername: (username: string): { isValid: boolean; message: string } => {
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    return { isValid: true, message: '' };
  },

  // Save user preferences
  saveUserPreferences: (userId: string, preferences: UserPreferences): void => {
    try {
      const key = `coursequest_preferences_${userId}`;
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  },

  // Load user preferences
  loadUserPreferences: (userId: string): UserPreferences | null => {
    try {
      const key = `coursequest_preferences_${userId}`;
      const preferences = localStorage.getItem(key);
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  },

  // Clear user preferences
  clearUserPreferences: (userId: string): void => {
    try {
      const key = `coursequest_preferences_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing user preferences:', error);
    }
  },

  // Email verification code management
  generateVerificationCode: (): string => {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Send verification code (mock - in production this would send an actual email)
  sendVerificationCode: (email: string, code: string): void => {
    try {
      const codes = userDatabase.getVerificationCodes();
      codes[email.toLowerCase()] = {
        code,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      };
      localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
      
      // In a real app, this would send an email via a backend service
      // For development, we'll log it to console and show in toast
      console.log(`Verification code for ${email}: ${code}`);
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  },

  // Get all verification codes
  getVerificationCodes: (): Record<string, { code: string; expiresAt: number; attempts: number }> => {
    try {
      const codes = localStorage.getItem(VERIFICATION_CODES_KEY);
      return codes ? JSON.parse(codes) : {};
    } catch (error) {
      console.error('Error loading verification codes:', error);
      return {};
    }
  },

  // Verify code
  verifyCode: (email: string, inputCode: string): { isValid: boolean; message: string } => {
    try {
      const codes = userDatabase.getVerificationCodes();
      const emailKey = email.toLowerCase();
      const codeData = codes[emailKey];

      if (!codeData) {
        return { isValid: false, message: 'No verification code found. Please request a new code.' };
      }

      // Check if code has expired (10 minutes)
      if (Date.now() > codeData.expiresAt) {
        delete codes[emailKey];
        localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
        return { isValid: false, message: 'Verification code has expired. Please request a new code.' };
      }

      // Check attempt limit (max 5 attempts)
      if (codeData.attempts >= 5) {
        delete codes[emailKey];
        localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
        return { isValid: false, message: 'Too many failed attempts. Please request a new code.' };
      }

      // Increment attempts
      codeData.attempts += 1;
      codes[emailKey] = codeData;
      localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));

      if (codeData.code === inputCode) {
        // Code is valid, remove it
        delete codes[emailKey];
        localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
        return { isValid: true, message: 'Code verified successfully' };
      } else {
        return { isValid: false, message: 'Invalid verification code. Please try again.' };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return { isValid: false, message: 'An error occurred during verification' };
    }
  },

  // Clear verification code for an email
  clearVerificationCode: (email: string): void => {
    try {
      const codes = userDatabase.getVerificationCodes();
      delete codes[email.toLowerCase()];
      localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
    } catch (error) {
      console.error('Error clearing verification code:', error);
    }
  },

  // Reviews storage (global, visible to everyone)
  REVIEWS_KEY: 'coursequest_reviews',
  SESSION_ID_KEY: 'coursequest_session_id',
  
  // Get or create a session ID for anonymous users
  getSessionId: (): string => {
    try {
      let sessionId = localStorage.getItem(userDatabase.SESSION_ID_KEY);
      if (!sessionId) {
        // Generate a unique session ID
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(userDatabase.SESSION_ID_KEY, sessionId);
      }
      return sessionId;
    } catch (error) {
      console.error('Error getting session ID:', error);
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },

  // Get all reviews for a course
  getReviewsForCourse: (courseId: string): Review[] => {
    try {
      const allReviews = localStorage.getItem(userDatabase.REVIEWS_KEY);
      const reviews: Review[] = allReviews ? JSON.parse(allReviews) : [];
      return reviews.filter(r => r.courseId === courseId).sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    }
  },

  // Get all reviews
  getAllReviews: (): Review[] => {
    try {
      const allReviews = localStorage.getItem(userDatabase.REVIEWS_KEY);
      return allReviews ? JSON.parse(allReviews) : [];
    } catch (error) {
      console.error('Error loading all reviews:', error);
      return [];
    }
  },

  // Add a review
  addReview: (review: Omit<Review, 'id' | 'createdAt'>): Review => {
    try {
      const allReviews = userDatabase.getAllReviews();
      const currentUser = userDatabase.getCurrentUser();
      const sessionId = userDatabase.getSessionId();
      
      // Determine author ID - use user ID if logged in, otherwise use session ID
      const authorId = currentUser ? currentUser.id : sessionId;
      
      const newReview: Review = {
        ...review,
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId,
        authorUsername: currentUser ? currentUser.username : undefined,
        createdAt: new Date().toISOString()
      };
      
      allReviews.push(newReview);
      localStorage.setItem(userDatabase.REVIEWS_KEY, JSON.stringify(allReviews));
      return newReview;
    } catch (error) {
      console.error('Error saving review:', error);
      throw error;
    }
  },

  // Delete a review (only by author)
  deleteReview: (reviewId: string): boolean => {
    try {
      const allReviews = userDatabase.getAllReviews();
      const review = allReviews.find(r => r.id === reviewId);
      
      if (!review) {
        return false;
      }
      
      const currentUser = userDatabase.getCurrentUser();
      const sessionId = userDatabase.getSessionId();
      
      // Verify ownership: must match either user ID or session ID
      const isOwner = currentUser 
        ? review.authorId === currentUser.id
        : review.authorId === sessionId;
      
      if (!isOwner) {
        return false;
      }
      
      const filtered = allReviews.filter(r => r.id !== reviewId);
      localStorage.setItem(userDatabase.REVIEWS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      return false;
    }
  },

  // Check if current user/session can delete a review
  canDeleteReview: (reviewId: string): boolean => {
    try {
      const allReviews = userDatabase.getAllReviews();
      const review = allReviews.find(r => r.id === reviewId);
      
      if (!review) {
        return false;
      }
      
      const currentUser = userDatabase.getCurrentUser();
      const sessionId = userDatabase.getSessionId();
      
      // Check if current user/session is the author
      return currentUser 
        ? review.authorId === currentUser.id
        : review.authorId === sessionId;
    } catch (error) {
      console.error('Error checking review ownership:', error);
      return false;
    }
  },

  // Check if current user/session has a review for a course
  hasUserReviewedCourse: (courseId: string): boolean => {
    try {
      const allReviews = userDatabase.getAllReviews();
      const currentUser = userDatabase.getCurrentUser();
      const sessionId = userDatabase.getSessionId();
      
      // Check if user has any review for this course
      return allReviews.some(review => 
        review.courseId === courseId && 
        (currentUser ? review.authorId === currentUser.id : review.authorId === sessionId)
      );
    } catch (error) {
      console.error('Error checking user review for course:', error);
      return false;
    }
  },

  // Get current user's review for a course
  getUserReviewForCourse: (courseId: string): Review | null => {
    try {
      const allReviews = userDatabase.getAllReviews();
      const currentUser = userDatabase.getCurrentUser();
      const sessionId = userDatabase.getSessionId();
      
      return allReviews.find(review => 
        review.courseId === courseId && 
        (currentUser ? review.authorId === currentUser.id : review.authorId === sessionId)
      ) || null;
    } catch (error) {
      console.error('Error getting user review for course:', error);
      return null;
    }
  }
};

