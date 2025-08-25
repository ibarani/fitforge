import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendSignUpCode, confirmSignIn } from '@aws-amplify/auth';
import { User, Lock, Mail, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import logo from '../../logo/Sentre_Icon_Red.svg';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'confirm', 'newPassword'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cognitoUser, setCognitoUser] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    name: '',
    confirmationCode: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: formData.email,
        password: formData.password,
      });

      if (isSignedIn) {
        onLogin(formData.email);
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        setMode('confirm');
        setError('Please confirm your email first');
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setMode('newPassword');
        setCognitoUser({ username: formData.email, challengeParam: nextStep });
        setSuccess('Please set a new password for your account');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      if (err.name === 'UserNotFoundException') {
        setError('No account found with this email');
      } else if (err.name === 'NotAuthorizedException') {
        setError('Incorrect password');
      } else if (err.name === 'UserNotConfirmedException') {
        setMode('confirm');
        setError('Please confirm your email first');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            name: formData.name
          }
        }
      });

      if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        setMode('confirm');
        setSuccess('Account created! Please check your email for the confirmation code.');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: formData.email,
        confirmationCode: formData.confirmationCode
      });

      if (isSignUpComplete) {
        setSuccess('Email confirmed! You can now sign in.');
        setMode('signin');
        // Clear confirmation code
        setFormData(prev => ({ ...prev, confirmationCode: '' }));
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      if (err.name === 'CodeMismatchException') {
        setError('Invalid confirmation code');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Confirmation code has expired');
      } else {
        setError(err.message || 'Failed to confirm email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await resendSignUpCode({ username: formData.email });
      setSuccess('New confirmation code sent to your email');
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: formData.newPassword
      });

      if (isSignedIn) {
        setSuccess('Password changed successfully!');
        onLogin(formData.email);
      }
    } catch (err) {
      console.error('New password error:', err);
      setError(err.message || 'Failed to set new password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="FitForge Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            FitForge
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'confirm' && 'Confirm your email'}
            {mode === 'newPassword' && 'Set your new password'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="igor@barani.org"
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign Up
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Igor Barani"
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="igor@barani.org"
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 8 characters"
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* New Password Form */}
          {mode === 'newPassword' && (
            <form onSubmit={handleNewPassword} className="space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Your account requires a new password. Please choose a secure password.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Min 8 characters"
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Setting new password...
                  </>
                ) : (
                  'Set New Password'
                )}
              </button>
            </form>
          )}

          {/* Confirmation Form */}
          {mode === 'confirm' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation Code
                </label>
                <input
                  type="text"
                  name="confirmationCode"
                  value={formData.confirmationCode}
                  onChange={handleInputChange}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength="6"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center text-2xl font-mono tracking-wider"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Check your email for the confirmation code
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Confirm Email'
                )}
              </button>

              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Powered by AWS Cognito</p>
        </div>
      </div>
    </div>
  );
}