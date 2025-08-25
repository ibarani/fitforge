// DynamoDB Table Schemas for FitForge
// Single-table design optimized for single user

export const TABLES = {
  MAIN: 'fitforge-main'
};

export const tableDefinitions = {
  // Single table design for all workout data
  main: {
    TableName: TABLES.MAIN,
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },  // Partition Key
      { AttributeName: 'SK', KeyType: 'RANGE' }  // Sort Key
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'  // On-demand pricing
  }
};

/**
 * Access Patterns for Single User (Igor)
 * 
 * Entity Types:
 * - USER#igor
 * - WORKOUT#<date>#<template>
 * - CYCLE#<number>
 * - ANALYSIS#<cycle>#<date>
 * 
 * Access Patterns:
 * 1. Get user profile: PK=USER#igor, SK=PROFILE
 * 2. Get all workouts: PK=USER#igor, SK begins_with WORKOUT#
 * 3. Get workouts by date range: GSI1PK=WORKOUTS, GSI1SK between dates
 * 4. Get current cycle: PK=USER#igor, SK=CYCLE#CURRENT
 * 5. Get cycle history: PK=USER#igor, SK begins_with CYCLE#
 * 6. Get AI analysis: PK=CYCLE#<number>, SK begins_with ANALYSIS#
 * 7. Get latest suggestions: PK=USER#igor, SK=SUGGESTIONS#LATEST
 */

export const ItemSchemas = {
  // User Profile
  userProfile: {
    PK: 'USER#igor',
    SK: 'PROFILE',
    type: 'USER_PROFILE',
    email: 'igor@barani.org',
    name: 'Igor Barani',
    createdAt: '2024-01-01T00:00:00Z',
    settings: {
      defaultRestTimes: {},
      preferredUnits: 'lbs'
    }
  },

  // Workout Record
  workout: (date, templateKey) => ({
    PK: 'USER#igor',
    SK: `WORKOUT#${date}#${templateKey}`,
    GSI1PK: 'WORKOUTS',
    GSI1SK: date,
    type: 'WORKOUT',
    date,
    templateKey,
    bodyweight: 0,
    sessionNotes: '',
    exercises: {},  // { exerciseName: [{ set: 1, weight: 135, reps: 8, notes: '' }] }
    exerciseRPEs: {},  // { exerciseName: 8 }
    isOptional: false,
    completed: false,
    createdAt: new Date().toISOString()
  }),

  // Current Cycle
  currentCycle: (cycleNumber) => ({
    PK: 'USER#igor',
    SK: 'CYCLE#CURRENT',
    GSI1PK: `CYCLE#${cycleNumber}`,
    GSI1SK: 'META',
    type: 'CURRENT_CYCLE',
    cycleNumber,
    startDate: new Date().toISOString(),
    completedWorkouts: [],  // ['A_push_power', 'A_pull_width', ...]
    remainingWorkouts: ['A_push_power', 'A_pull_width', 'B_push_hyp', 'B_pull_strength']
  }),

  // Completed Cycle Archive
  cycleArchive: (cycleNumber, endDate) => ({
    PK: 'USER#igor',
    SK: `CYCLE#${String(cycleNumber).padStart(4, '0')}`,
    GSI1PK: `CYCLE#${cycleNumber}`,
    GSI1SK: 'ARCHIVE',
    type: 'CYCLE_ARCHIVE',
    cycleNumber,
    startDate: '',
    endDate,
    workouts: [],  // Array of workout IDs
    completed: true
  }),

  // AI Analysis Result
  aiAnalysis: (cycleNumber, analysisDate) => ({
    PK: `CYCLE#${cycleNumber}`,
    SK: `ANALYSIS#${analysisDate}`,
    type: 'AI_ANALYSIS',
    cycleNumber,
    analysisDate,
    overallAssessment: {
      fatigueLevel: 'moderate',
      progressRate: 'optimal',
      summary: ''
    },
    exerciseRecommendations: {},
    trainingModifications: {},
    recoveryRecommendations: [],
    rawClaudeResponse: ''
  }),

  // Latest AI Suggestions (cached for quick access)
  latestSuggestions: (cycleNumber) => ({
    PK: 'USER#igor',
    SK: 'SUGGESTIONS#LATEST',
    type: 'AI_SUGGESTIONS',
    cycleNumber,
    generatedAt: new Date().toISOString(),
    suggestions: {},  // { exerciseName: { weight: 140, reps: '8-10', confidence: 0.85 } }
    appliedTo: []  // Which workouts have used these suggestions
  })
};

// Helper functions for DynamoDB operations
export const DBHelpers = {
  // Generate consistent keys
  workoutKey: (date, templateKey) => `WORKOUT#${date}#${templateKey}`,
  cycleKey: (cycleNumber) => `CYCLE#${String(cycleNumber).padStart(4, '0')}`,
  
  // Parse keys back to components
  parseWorkoutKey: (sk) => {
    const parts = sk.split('#');
    return {
      date: parts[1],
      templateKey: parts[2]
    };
  },
  
  parseCycleKey: (sk) => {
    const parts = sk.split('#');
    return {
      cycleNumber: parseInt(parts[1])
    };
  }
};