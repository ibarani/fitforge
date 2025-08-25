/**
 * @fileoverview Main application component for FitForge workout tracking PWA.
 * Handles authentication, routing, and global state management.
 * 
 * @author Igor Barani
 * @copyright 2025 FitForge
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signOut } from '@aws-amplify/auth';
import WorkoutTracker from './components/WorkoutTracker.jsx';
import Login from './components/Login.jsx';
import { awsConfig } from './aws-config.js';

/**
 * Configure AWS Amplify with error handling.
 * This runs once at module load time.
 */
try {
  Amplify.configure(awsConfig);
  console.log('Amplify configured successfully');
} catch (error) {
  console.error('Error configuring Amplify:', error);
}

/**
 * Root application component that manages authentication and routing.
 * 
 * @component
 * @returns {React.ReactElement} The main application with routing.
 * 
 * @example
 * // Rendered in main.jsx
 * <App />
 */
export default function App() {
  /** @type {[boolean, function]} Authentication state and setter */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  /** @type {[string, function]} User email state and setter */
  const [userEmail, setUserEmail] = useState('');
  
  /** @type {[boolean, function]} Loading state for initial auth check */
  const [loading, setLoading] = useState(true);

  /**
   * Check authentication status on component mount.
   * Retrieves existing Cognito session if available.
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Verifies if user has an active Cognito session.
   * Extracts user email from ID token if authenticated.
   * 
   * @async
   * @private
   * @returns {Promise<void>}
   */
  const checkAuthStatus = async () => {
    try {
      const session = await fetchAuthSession();
      if (session?.tokens?.idToken) {
        /** Extract email from the token payload */
        const payload = session.tokens.idToken.payload;
        setUserEmail(payload.email || payload['cognito:username']);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Not authenticated');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles successful user login.
   * Updates authentication state and stores user email.
   * 
   * @param {string} email - The authenticated user's email address.
   * @returns {void}
   */
  const handleLogin = (email) => {
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  /**
   * Handles user logout.
   * Signs out from Cognito and clears local storage.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserEmail('');
      /** Clear workout cycle data from local storage */
      localStorage.removeItem('current_cycle');
      localStorage.removeItem('cycle_complete');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /** Show loading spinner while checking authentication status */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router basename="/fitforge">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <WorkoutTracker userId={userEmail} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}