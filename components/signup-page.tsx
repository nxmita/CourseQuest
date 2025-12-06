import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { userDatabase } from './user-data';
import { toast } from 'sonner';

interface SignupPageProps {
  onBack: () => void;
  onSignupSuccess: (user: any) => void;
  onLogin: () => void;
}

export function SignupPage({ onBack, onSignupSuccess, onLogin }: SignupPageProps) {
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validate username
    const usernameValidation = userDatabase.validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.message;
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!userDatabase.isValidUSCEmail(formData.email)) {
      newErrors.email = 'Please enter a valid USC email';
    }

    // Validate password
    const passwordValidation = userDatabase.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    // Validate email before sending code
    if (!formData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    if (!userDatabase.isValidUSCEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid USC email' });
      return;
    }

    // Check if email is already registered
    const existingUser = userDatabase.findUser(formData.email);
    if (existingUser) {
      setErrors({ email: 'This email is already registered' });
      return;
    }

    setIsSendingCode(true);
    
    try {
      // Generate and send verification code
      const code = userDatabase.generateVerificationCode();
      userDatabase.sendVerificationCode(formData.email, code);
      
      // Show code in development (in production, this would be sent via email)
      toast.success(`Verification code sent to ${formData.email}`, {
        description: `Development: Your code is ${code}`,
        duration: 10000
      });
      
      setStep('verification');
      setErrors({});
    } catch (error) {
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      setErrors({ verificationCode: 'Please enter the verification code' });
      return;
    }

    setIsLoading(true);
    
    try {
      const verification = userDatabase.verifyCode(formData.email, formData.verificationCode);
      
      if (!verification.isValid) {
        setErrors({ verificationCode: verification.message });
        return;
      }

      // Code is valid, proceed with account creation
      const newUser = userDatabase.addUser({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (newUser) {
        // Clear verification code
        userDatabase.clearVerificationCode(formData.email);
        userDatabase.setCurrentUser(newUser);
        toast.success('Account created successfully!');
        onSignupSuccess(newUser);
      }
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        setErrors({ username: 'This username is already taken' });
        setStep('form');
      } else if (error.message === 'Email already exists') {
        setErrors({ email: 'This email is already registered' });
        setStep('form');
      } else {
        toast.error('An error occurred during signup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'form') {
      if (!validateForm()) {
        return;
      }
      // Send verification code instead of creating account
      await handleSendCode();
    } else {
      // Verify code and create account
      await handleVerifyCode();
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  const handleBackToForm = () => {
    setStep('form');
    setFormData(prev => ({ ...prev, verificationCode: '' }));
    setErrors({});
    userDatabase.clearVerificationCode(formData.email);
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
          
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join CourseQuest to start planning your academic journey
          </p>
        </div>

        {/* Signup Form */}
        <Card className="border-2" style={{ borderColor: '#FFCC00' }}>
          <CardHeader className="pb-4" style={{ backgroundColor: 'rgba(153, 0, 0, 0.05)' }}>
            <CardTitle className="text-xl font-bold text-center" style={{ color: '#990000' }}>
              Sign Up
            </CardTitle>
            <CardDescription className="text-center">
              Create your account with your USC credentials
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                      placeholder="Enter your username"
                      disabled={isLoading || isSendingCode}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    USC Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="yourname@usc.edu"
                      disabled={isLoading || isSendingCode}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Only @usc.edu email addresses are accepted
                  </p>
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
                      disabled={isLoading || isSendingCode}
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

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="Confirm your password"
                      disabled={isLoading || isSendingCode}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isSendingCode}
                  style={{ backgroundColor: '#990000', color: 'white' }}
                >
                  {isSendingCode ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-800">
                    We've sent a verification code to <strong>{formData.email}</strong>. Please check your email and enter the code below.
                  </AlertDescription>
                </Alert>

                {/* Verification Code */}
                <div>
                  <Label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="verificationCode"
                      type="text"
                      value={formData.verificationCode}
                      onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                      className={`pl-10 ${errors.verificationCode ? 'border-red-500' : ''}`}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.verificationCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.verificationCode}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  style={{ backgroundColor: '#990000', color: 'white' }}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                </Button>

                {/* Resend Code */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="font-medium hover:underline"
                      style={{ color: '#990000' }}
                      disabled={isSendingCode}
                    >
                      Resend Code
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={handleBackToForm}
                    className="text-sm text-gray-600 hover:underline"
                    disabled={isLoading}
                  >
                    ← Back to form
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={onLogin}
                  className="font-medium hover:underline"
                  style={{ color: '#990000' }}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

