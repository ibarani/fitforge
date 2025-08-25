/**
 * @fileoverview Express router for workout-related API endpoints.
 * Handles workout CRUD operations, cycle management, and AI analysis.
 * 
 * @module api/workoutAPI
 * @author Igor Barani
 * @copyright 2025 FitForge
 */

import express from 'express';
import { ClaudeAnalysisService } from '../services/claudeAnalysis.js';
import { workoutService } from '../services/dynamoService.js';

/** @type {express.Router} Express router instance */
const router = express.Router();

/** @type {ClaudeAnalysisService} Claude AI service instance */
const claudeService = new ClaudeAnalysisService();

/**
 * Save a completed workout to the database.
 * Checks for cycle completion and triggers AI analysis if needed.
 * 
 * @name POST/api/workouts
 * @function
 * @memberof module:api/workoutAPI
 * @param {express.Request} req - Express request object.
 * @param {Object} req.body - Workout data.
 * @param {string} req.body.userId - User identifier.
 * @param {string} req.body.templateKey - Workout template key.
 * @param {string} req.body.date - Workout date (YYYY-MM-DD).
 * @param {number} [req.body.bodyweight] - User's bodyweight.
 * @param {string} [req.body.notes] - Session notes.
 * @param {Object} req.body.exercises - Exercise sets data.
 * @param {Object} [req.body.exerciseRPEs] - RPE ratings per exercise.
 * @param {boolean} [req.body.isOptional] - Whether workout is optional.
 * @param {express.Response} res - Express response object.
 * @returns {Object} Response with workout data and cycle status.
 */
router.post('/workouts', async (req, res) => {
  try {
    const {
      userId,
      templateKey,
      date,
      bodyweight,
      notes,
      exercises,
      exerciseRPEs,
      isOptional
    } = req.body;

    // Generate workout ID
    const workoutId = generateId();
    
    // Save to DynamoDB
    const workout = await workoutService.saveWorkout({
      id: workoutId,
      userId: userId || 'igor', // Default to igor for single-user app
      templateKey,
      date,
      bodyweight,
      sessionNotes: notes,
      exercises,
      exerciseRPEs,
      isOptional: isOptional || false
    });
    
    console.log('Workout saved to DynamoDB:', workoutId);

    // Check if cycle is complete (only for non-optional workouts)
    if (!isOptional) {
      const cycleComplete = await checkCycleCompletion(userId);
      
      if (cycleComplete) {
        // Trigger Claude analysis
        const cycleData = await getCycleData(userId);
        const analysis = await claudeService.analyzeCycle(cycleData);
        
        // Save analysis results
        await saveAnalysisResults(userId, analysis);
        
        res.json({
          success: true,
          workout,
          cycleComplete: true,
          analysis
        });
        return;
      }
    }

    res.json({
      success: true,
      workout,
      cycleComplete: false
    });
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Retrieve workout history for a user.
 * Returns all workouts sorted by date.
 * 
 * @name GET/api/workouts
 * @function
 * @memberof module:api/workoutAPI
 * @param {express.Request} req - Express request object.
 * @param {string} req.query.userId - User identifier.
 * @param {express.Response} res - Express response object.
 * @returns {Array<Object>} Array of workout records.
 */
router.get('/workouts', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Fetch all workouts for the user
    const workouts = await workoutService.getAllWorkouts();
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current training cycle status.
 * Returns progress and completed workouts for the active cycle.
 * 
 * @name GET/api/cycles/current
 * @function
 * @memberof module:api/workoutAPI
 * @param {express.Request} req - Express request object.
 * @param {string} req.query.userId - User identifier.
 * @param {express.Response} res - Express response object.
 * @returns {Object} Current cycle status and progress.
 */
router.get('/cycles/current', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Fetch from database
    const currentCycle = await workoutService.getCurrentCycle();
    res.json(currentCycle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get AI-generated suggestions for a specific exercise.
 * Returns recommended weight and reps based on previous performance.
 * 
 * @name GET/api/suggestions/:exerciseName
 * @function
 * @memberof module:api/workoutAPI
 * @param {express.Request} req - Express request object.
 * @param {string} req.params.exerciseName - Name of the exercise.
 * @param {string} req.query.userId - User identifier.
 * @param {express.Response} res - Express response object.
 * @returns {Object} Exercise suggestions with weight and rep recommendations.
 */
router.get('/suggestions/:exerciseName', async (req, res) => {
  try {
    const { exerciseName } = req.params;
    const { userId } = req.query;
    
    // Fetch from database
    const suggestions = await workoutService.getLatestSuggestions();
    const suggestion = suggestions[exerciseName] || {
      exercise: exerciseName,
      suggestedWeight: null,
      suggestedReps: "Start light and work up",
      confidence: 0,
      reasoning: "No previous data available"
    };
    
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manually trigger AI analysis for a training cycle.
 * Analyzes workout data and generates personalized recommendations.
 * 
 * @name POST/api/analysis/trigger
 * @function
 * @memberof module:api/workoutAPI
 * @param {express.Request} req - Express request object.
 * @param {Object} req.body - Analysis request data.
 * @param {string} req.body.userId - User identifier.
 * @param {string} [req.body.cycleId] - Specific cycle to analyze.
 * @param {express.Response} res - Express response object.
 * @returns {Object} AI analysis results with recommendations.
 */
router.post('/analysis/trigger', async (req, res) => {
  try {
    const { userId, cycleId } = req.body;
    
    const cycleData = await getCycleData(userId, cycleId);
    const analysis = await claudeService.analyzeCycle(cycleData);
    
    await saveAnalysisResults(userId, analysis, cycleId);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error triggering analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check if the current training cycle is complete.
 * 
 * @async
 * @function checkCycleCompletion
 * @param {string} userId - User identifier.
 * @returns {Promise<boolean>} True if all mandatory workouts are complete.
 * @private
 */
async function checkCycleCompletion(userId) {
  // Check database for completed mandatory workouts
  const currentCycle = await workoutService.getCurrentCycle();
  const mandatoryWorkouts = ['A_push_power', 'A_pull_width', 'B_push_hyp', 'B_pull_strength'];
  
  // Return true if all mandatory workouts are complete
  return mandatoryWorkouts.every(w => currentCycle.completedWorkouts.includes(w));
}

/**
 * Retrieve complete data for a training cycle.
 * 
 * @async
 * @function getCycleData
 * @param {string} userId - User identifier.
 * @param {string} [cycleId] - Specific cycle ID or current cycle if omitted.
 * @returns {Promise<Object>} Complete cycle data for analysis.
 * @private
 */
async function getCycleData(userId, cycleId) {
  // Fetch complete cycle data from database
  const currentCycle = await workoutService.getCurrentCycle();
  const cycleNumber = cycleId || currentCycle.cycleNumber;
  
  // Get cycle data for AI analysis
  return await workoutService.getCycleDataForAnalysis(cycleNumber);
}

/**
 * Save AI analysis results to the database.
 * 
 * @async
 * @function saveAnalysisResults
 * @param {string} userId - User identifier.
 * @param {Object} analysis - AI analysis results.
 * @param {string} [cycleId] - Specific cycle ID.
 * @returns {Promise<Object>} Saved analysis record.
 * @private
 */
async function saveAnalysisResults(userId, analysis, cycleId) {
  // Save to database
  const currentCycle = await workoutService.getCurrentCycle();
  const cycleNumber = cycleId || currentCycle.cycleNumber;
  
  console.log('Saving analysis results for cycle:', cycleNumber);
  return await workoutService.saveAIAnalysis(cycleNumber, analysis);
}

/**
 * Generate a unique identifier for database records.
 * 
 * @function generateId
 * @returns {string} Unique alphanumeric ID.
 * @private
 * 
 * @example
 * const id = generateId(); // Returns: 'abc123def456'
 */
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default router;