import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { userDatabase } from './user-data';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onBack: () => void;
  onSignup: () => void;
}

export function LoginPage({ onLogin, onBack, onSignup }: LoginPageProps) {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.usernameOrEmail) {
      newErrors.usernameOrEmail = 'Username or email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if user exists
      const user = userDatabase.findUser(formData.usernameOrEmail);
      
      if (!user) {
        // User doesn't exist, redirect to signup
        toast.info('Account not found. Redirecting to signup...');
        setTimeout(() => {
          onSignup();
        }, 1500);
        return;
      }

      // Validate credentials
      const validatedUser = userDatabase.validateUser(formData.usernameOrEmail, formData.password);
      
      if (!validatedUser) {
        setErrors({ password: 'Invalid password' });
        toast.error('Invalid password');
        return;
      }

      // Check if email is USC email
      if (!userDatabase.isValidUSCEmail(validatedUser.email)) {
        toast.error('Please use a valid @usc.edu email address');
        return;
      }

      // Login successful
      userDatabase.setCurrentUser(validatedUser);
      toast.success('Login successful!');
      onLogin(validatedUser);
      
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="absolute left-4 top-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-3xl font-bold" style={{ color: '#990000' }}>
              CourseQuest
            </h1>
            <div className="ml-2 w-1 h-8 rounded-full" style={{ backgroundColor: '#FFCC00' }}></div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your CourseQuest account
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-2" style={{ borderColor: '#FFCC00' }}>
          <CardHeader className="pb-4" style={{ backgroundColor: 'rgba(153, 0, 0, 0.05)' }}>
            <CardTitle className="text-xl font-bold text-center" style={{ color: '#990000' }}>
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Use your username or USC email to sign in
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username or Email */}
              <div>
                <Label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or USC Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    value={formData.usernameOrEmail}
                    onChange={(e) => handleInputChange('usernameOrEmail', e.target.value)}
                    className={`pl-10 ${errors.usernameOrEmail ? 'border-red-500' : ''}`}
                    placeholder="Enter username or email@usc.edu"
                    disabled={isLoading}
                  />
                </div>
                {errors.usernameOrEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.usernameOrEmail}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                style={{ backgroundColor: '#990000', color: 'white' }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Signup Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={onSignup}
                  className="font-medium hover:underline"
                  style={{ color: '#990000' }}
                >
                  Sign up here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
