import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLES, ItemSchemas, DBHelpers } from '../database/dynamodb-schema.js';

// Initialize DynamoDB client
const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const docClient = DynamoDBDocumentClient.from(client);

export class WorkoutService {
  /**
   * Save a workout to DynamoDB
   */
  async saveWorkout(workoutData) {
    const { date, templateKey, bodyweight, sessionNotes, exercises, exerciseRPEs, isOptional } = workoutData;
    
    const workout = ItemSchemas.workout(date, templateKey);
    Object.assign(workout, {
      bodyweight,
      sessionNotes,
      exercises,
      exerciseRPEs,
      isOptional,
      completed: true
    });

    await docClient.send(new PutCommand({
      TableName: TABLES.MAIN,
      Item: workout
    }));

    // Update current cycle if not optional
    if (!isOptional) {
      await this.updateCycleProgress(templateKey);
    }

    return workout;
  }

  /**
   * Get all workouts for Igor
   */
  async getAllWorkouts() {
    const response = await docClient.send(new QueryCommand({
      TableName: TABLES.MAIN,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': 'USER#igor',
        ':sk': 'WORKOUT#'
      },
      ScanIndexForward: false  // Most recent first
    }));

    return response.Items || [];
  }

  /**
   * Get workouts for a specific date range
   */
  async getWorkoutsByDateRange(startDate, endDate) {
    const response = await docClient.send(new QueryCommand({
      TableName: TABLES.MAIN,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
      ExpressionAttributeValues: {
        ':pk': 'WORKOUTS',
        ':start': startDate,
        ':end': endDate
      }
    }));

    return response.Items || [];
  }

  /**
   * Get the current cycle status
   */
  async getCurrentCycle() {
    const response = await docClient.send(new GetCommand({
      TableName: TABLES.MAIN,
      Key: {
        PK: 'USER#igor',
        SK: 'CYCLE#CURRENT'
      }
    }));

    if (!response.Item) {
      // Initialize first cycle
      const newCycle = ItemSchemas.currentCycle(1);
      await docClient.send(new PutCommand({
        TableName: TABLES.MAIN,
        Item: newCycle
      }));
      return newCycle;
    }

    return response.Item;
  }

  /**
   * Update cycle progress when a workout is completed
   */
  async updateCycleProgress(templateKey) {
    const currentCycle = await this.getCurrentCycle();
    
    // Add to completed workouts if not already there
    if (!currentCycle.completedWorkouts.includes(templateKey)) {
      currentCycle.completedWorkouts.push(templateKey);
      
      // Remove from remaining workouts
      currentCycle.remainingWorkouts = currentCycle.remainingWorkouts.filter(
        w => w !== templateKey
      );

      // Check if cycle is complete
      const mandatoryWorkouts = ['A_push_power', 'A_pull_width', 'B_push_hyp', 'B_pull_strength'];
      const isComplete = mandatoryWorkouts.every(w => currentCycle.completedWorkouts.includes(w));

      if (isComplete) {
        // Archive current cycle
        await this.completeCycle(currentCycle);
        
        // Start new cycle
        const newCycle = ItemSchemas.currentCycle(currentCycle.cycleNumber + 1);
        await docClient.send(new PutCommand({
          TableName: TABLES.MAIN,
          Item: newCycle
        }));
        
        return { cycleComplete: true, newCycleNumber: newCycle.cycleNumber };
      } else {
        // Update current cycle
        await docClient.send(new UpdateCommand({
          TableName: TABLES.MAIN,
          Key: {
            PK: 'USER#igor',
            SK: 'CYCLE#CURRENT'
          },
          UpdateExpression: 'SET completedWorkouts = :completed, remainingWorkouts = :remaining',
          ExpressionAttributeValues: {
            ':completed': currentCycle.completedWorkouts,
            ':remaining': currentCycle.remainingWorkouts
          }
        }));
      }
    }

    return { cycleComplete: false };
  }

  /**
   * Archive a completed cycle
   */
  async completeCycle(cycle) {
    const archive = ItemSchemas.cycleArchive(cycle.cycleNumber, new Date().toISOString());
    archive.startDate = cycle.startDate;
    archive.workouts = cycle.completedWorkouts;

    await docClient.send(new PutCommand({
      TableName: TABLES.MAIN,
      Item: archive
    }));

    return archive;
  }

  /**
   * Get AI suggestions for current workout
   */
  async getLatestSuggestions() {
    const response = await docClient.send(new GetCommand({
      TableName: TABLES.MAIN,
      Key: {
        PK: 'USER#igor',
        SK: 'SUGGESTIONS#LATEST'
      }
    }));

    return response.Item?.suggestions || {};
  }

  /**
   * Save AI analysis and suggestions
   */
  async saveAIAnalysis(cycleNumber, analysis) {
    const analysisItem = ItemSchemas.aiAnalysis(cycleNumber, new Date().toISOString());
    Object.assign(analysisItem, analysis);

    // Save full analysis
    await docClient.send(new PutCommand({
      TableName: TABLES.MAIN,
      Item: analysisItem
    }));

    // Save latest suggestions for quick access
    if (analysis.exerciseRecommendations) {
      const suggestions = ItemSchemas.latestSuggestions(cycleNumber);
      suggestions.suggestions = Object.entries(analysis.exerciseRecommendations).reduce((acc, [exercise, rec]) => {
        acc[exercise] = {
          weight: rec.suggested_weight,
          reps: rec.suggested_reps,
          confidence: rec.confidence,
          reasoning: rec.reasoning
        };
        return acc;
      }, {});

      await docClient.send(new PutCommand({
        TableName: TABLES.MAIN,
        Item: suggestions
      }));
    }

    return analysisItem;
  }

  /**
   * Get cycle data for AI analysis
   */
  async getCycleDataForAnalysis(cycleNumber) {
    // Get all workouts for the cycle
    const cycleWorkouts = await docClient.send(new QueryCommand({
      TableName: TABLES.MAIN,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CYCLE#${cycleNumber}`
      }
    }));

    // Get the actual workout data
    const workouts = [];
    const exercises = {};
    const rpeData = {};

    for (const workout of cycleWorkouts.Items || []) {
      workouts.push(workout);
      
      // Aggregate exercise data
      for (const [exerciseName, sets] of Object.entries(workout.exercises || {})) {
        if (!exercises[exerciseName]) {
          exercises[exerciseName] = { weights: [], reps: [] };
        }
        
        sets.forEach(set => {
          if (set.weight) exercises[exerciseName].weights.push(set.weight);
          if (set.reps) exercises[exerciseName].reps.push(set.reps);
        });
      }

      // Aggregate RPE data
      for (const [exerciseName, rpe] of Object.entries(workout.exerciseRPEs || {})) {
        if (!rpeData[exerciseName]) {
          rpeData[exerciseName] = [];
        }
        rpeData[exerciseName].push(rpe);
      }
    }

    // Get user profile for bodyweight
    const profile = await docClient.send(new GetCommand({
      TableName: TABLES.MAIN,
      Key: {
        PK: 'USER#igor',
        SK: 'PROFILE'
      }
    }));

    return {
      workouts,
      exercises,
      rpeData,
      userProfile: {
        bodyweight: workouts[workouts.length - 1]?.bodyweight || 180,
        experience: 'Intermediate'
      }
    };
  }
}

export const workoutService = new WorkoutService();