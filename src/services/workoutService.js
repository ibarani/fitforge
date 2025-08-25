/**
 * @fileoverview Service layer for FitForge API interactions.
 * Handles all communication with the backend API including workout CRUD operations
 * and AI analysis requests. Provides automatic fallback to localStorage when offline.
 * 
 * @module workoutService
 * @author Igor Barani
 * @copyright 2025 FitForge
 */

import { awsConfig } from '../aws-config';

/** @type {string} Base API endpoint URL from AWS configuration */
const API_ENDPOINT = awsConfig.API.endpoint;

/**
 * Saves workout data to the backend API.
 * Automatically falls back to localStorage if the API request fails.
 * 
 * @async
 * @function saveWorkout
 * @param {Object} workoutData - The workout data to save.
 * @param {string} workoutData.templateKey - Workout template identifier.
 * @param {string} workoutData.date - Workout date (YYYY-MM-DD format).
 * @param {number} [workoutData.bodyweight] - User's bodyweight in pounds.
 * @param {Object<string, Array<{weight: number, reps: number}>>} workoutData.exercises - Exercise sets data.
 * @param {Object<string, number>} [workoutData.exerciseRPEs] - RPE ratings per exercise.
 * @param {Array<string>} [workoutData.skipped] - List of skipped exercises.
 * @param {string} [workoutData.sessionNotes] - Session notes.
 * @param {string} userId - The authenticated user's email/ID.
 * @param {string} idToken - The Cognito ID token for authentication.
 * @returns {Promise<Object>} The saved workout data with server-generated ID.
 * @throws {Error} Throws error if save fails (after localStorage backup).
 * 
 * @example
 * const result = await saveWorkout(
 *   {
 *     templateKey: 'A_push_power',
 *     date: '2025-08-25',
 *     exercises: {
 *       'Bench Press': [{weight: 225, reps: 5}]
 *     }
 *   },
 *   'user@example.com',
 *   'eyJhbGciOiJIUzI1NiIs...'
 * );
 */
export const saveWorkout = async (workoutData, userId, idToken) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/api/workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        userId,
        ...workoutData,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to save workout: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Workout saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving workout:', error);
    
    /** Fallback to localStorage if backend fails - ensures data isn't lost */
    try {
      const key = `workout_backup_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify({ userId, ...workoutData }));
      console.log('Workout saved to localStorage as backup');
    } catch (storageError) {
      console.error('Failed to save backup to localStorage:', storageError);
    }
    throw error;
  }
};

/**
 * Retrieves workout history from the backend API.
 * Falls back to localStorage backups if API request fails.
 * 
 * @async
 * @function getWorkoutHistory
 * @param {string} userId - The authenticated user's email/ID.
 * @param {string} idToken - The Cognito ID token for authentication.
 * @param {number} [limit=50] - Maximum number of workouts to retrieve.
 * @returns {Promise<Array<Object>>} Array of workout records sorted by date.
 * 
 * @example
 * const workouts = await getWorkoutHistory(
 *   'user@example.com',
 *   'eyJhbGciOiJIUzI1NiIs...',
 *   20
 * );
 * // Returns: [{workoutId: '...', date: '2025-08-25', ...}, ...]
 */
export const getWorkoutHistory = async (userId, idToken, limit = 50) => {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/api/workouts?userId=${userId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch workouts: ${response.statusText}`);
    }

    const workouts = await response.json();
    return workouts;
  } catch (error) {
    console.error('Error fetching workout history:', error);
    
    /** Attempt to retrieve workouts from localStorage backup */
    const backupWorkouts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('workout_backup_')) {
        try {
          const workout = JSON.parse(localStorage.getItem(key));
          if (workout.userId === userId) {
            backupWorkouts.push(workout);
          }
        } catch (parseError) {
          console.error('Error parsing backup workout:', parseError);
        }
      }
    }
    return backupWorkouts;
  }
};

/**
 * Requests AI analysis for completed workouts using Claude API.
 * Analyzes workout patterns and provides personalized recommendations.
 * 
 * @async
 * @function getAIAnalysis
 * @param {Array<string>} workoutIds - Array of workout IDs to analyze.
 * @param {string} userId - The authenticated user's email/ID.
 * @param {string} idToken - The Cognito ID token for authentication.
 * @returns {Promise<Object>} AI analysis results with insights and recommendations.
 * @throws {Error} Throws error if analysis request fails.
 * 
 * @example
 * const analysis = await getAIAnalysis(
 *   ['workout_123', 'workout_124'],
 *   'user@example.com',
 *   'eyJhbGciOiJIUzI1NiIs...'
 * );
 * // Returns: {
 * //   summary: {...},
 * //   detailedAnalysis: {...},
 * //   recommendations: [...]
 * // }
 */
export const getAIAnalysis = async (workoutIds, userId, idToken) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/api/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        userId,
        workoutIds,
        requestTimestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get AI analysis: ${response.statusText}`);
    }

    const analysis = await response.json();
    return analysis;
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    throw error;
  }
};

/**
 * Tests backend API connectivity.
 * Used to determine online/offline status in the UI.
 * 
 * @async
 * @function testBackendConnection
 * @returns {Promise<boolean>} True if backend is reachable, false otherwise.
 * 
 * @example
 * const isOnline = await testBackendConnection();
 * if (isOnline) {
 *   console.log('API is available');
 * } else {
 *   console.log('Working offline');
 * }
 */
export const testBackendConnection = async () => {
  try {
    const response = await fetch(`${API_ENDPOINT}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    return response.ok;
  } catch (error) {
    /** Log error but don't throw - this is an expected failure when offline */
    console.error('Backend connection test failed:', error);
    return false;
  }
};