/**
 * @fileoverview Main Express server configuration for FitForge backend.
 * Configures middleware, API routes, and serverless deployment handler.
 * Deployed as AWS Lambda function behind API Gateway.
 * 
 * @module backend/index
 * @author Igor Barani
 * @copyright 2025 FitForge
 */

import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import workoutAPI from './api/workoutAPI.js';

/** @type {express.Express} Express application instance */
const app = express();

/**
 * Configure middleware stack.
 * - CORS: Allows cross-origin requests from any domain
 * - JSON: Parses JSON request bodies
 */
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

/**
 * Mount API routes under /api path.
 * All workout-related endpoints are handled by workoutAPI router.
 */
app.use('/api', workoutAPI);

/**
 * Health check endpoint for monitoring and connectivity tests.
 * Returns server status and environment information.
 * 
 * @name GET/api/health
 * @function
 * @memberof module:backend/index
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {Object} Health status response.
 * @returns {string} returns.status - Server health status ('healthy').
 * @returns {Date} returns.timestamp - Current server timestamp.
 * @returns {string} returns.environment - Execution environment (Lambda or local).
 */
app.get('/api/health', (req, res) => {
  // Explicitly set CORS headers for cross-origin compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    environment: process.env.AWS_EXECUTION_ENV || 'local'
  });
});

/**
 * Global error handling middleware.
 * Catches unhandled errors and returns standardized error responses.
 * 
 * @function errorHandler
 * @param {Error} err - Error object.
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @param {express.NextFunction} next - Express next middleware function.
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * AWS Lambda handler function.
 * Wraps Express app with serverless-http for Lambda compatibility.
 * Configured to handle API Gateway stage prefix (/prod).
 * 
 * @function handler
 * @param {Object} event - AWS Lambda event object.
 * @param {Object} context - AWS Lambda context object.
 * @returns {Promise<Object>} Lambda response object.
 * 
 * @example
 * // Invoked by AWS Lambda runtime
 * // Event contains API Gateway request details
 * // Returns API Gateway-compatible response
 */
export const handler = serverless(app, {
  basePath: '/prod'
});