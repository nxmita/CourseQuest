// User data management system
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
  }
};

