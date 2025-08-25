import Anthropic from '@anthropic-ai/sdk';
import { getClaudeApiKey } from './secretsManager.js';

// Claude API Service for analyzing workout cycles
export class ClaudeAnalysisService {
  constructor() {
    this.anthropic = null; // Will be initialized on first use
  }

  async initializeClient() {
    if (!this.anthropic) {
      const apiKey = await getClaudeApiKey();
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
    }
    return this.anthropic;
  }

  /**
   * Analyze a completed workout cycle and generate recommendations
   * @param {Object} cycleData - Complete cycle data including workouts, sets, and RPEs
   * @returns {Object} Analysis results with suggestions for next cycle
   */
  async analyzeCycle(cycleData) {
    const prompt = this.buildAnalysisPrompt(cycleData);
    
    try {
      // Initialize client with API key from Secrets Manager
      await this.initializeClient();
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const analysis = this.parseClaudeResponse(response.content[0].text);
      return analysis;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  getSystemPrompt() {
    return `You are an expert strength and conditioning coach with deep knowledge of progressive overload, RPE-based training, and exercise physiology. 
    
    Your task is to analyze workout data and provide specific, actionable recommendations for the next training cycle.
    
    Key principles to follow:
    1. Use RPE (Rate of Perceived Exertion) as the primary indicator of training stress
    2. Apply progressive overload principles while managing fatigue
    3. Consider the relationship between volume, intensity, and recovery
    4. Account for individual exercise progression rates
    5. Reference the RPE scale where:
       - RPE 6-7: Light to moderate, 3-4 reps in reserve
       - RPE 8: Challenging but 2 reps in reserve
       - RPE 9: Hard, 1 rep in reserve
       - RPE 10: Maximum effort, no reps in reserve
    
    Provide recommendations in a structured JSON format.`;
  }

  buildAnalysisPrompt(cycleData) {
    const { workouts, exercises, rpeData, userProfile } = cycleData;
    
    return `Analyze this completed training cycle and provide recommendations for the next cycle:

USER PROFILE:
- Current bodyweight: ${userProfile.bodyweight} lbs
- Training experience: ${userProfile.experience || 'Intermediate'}
- Cycle duration: ${workouts.length} workouts

WORKOUT SUMMARY:
${this.formatWorkoutSummary(workouts)}

EXERCISE PERFORMANCE DATA:
${this.formatExerciseData(exercises)}

RPE PATTERNS:
${this.formatRPEData(rpeData)}

Please provide:
1. Overall assessment of the cycle (fatigue level, progress rate)
2. Specific weight/rep recommendations for each exercise
3. Any form or technique concerns based on RPE patterns
4. Suggested modifications to training volume or frequency
5. Recovery recommendations

Format your response as JSON with the following structure:
{
  "overall_assessment": {
    "fatigue_level": "low|moderate|high",
    "progress_rate": "slow|optimal|fast",
    "summary": "Brief text summary"
  },
  "exercise_recommendations": {
    "exercise_name": {
      "current_weight": number,
      "suggested_weight": number,
      "current_reps": "string",
      "suggested_reps": "string",
      "reasoning": "explanation",
      "confidence": 0.0-1.0
    }
  },
  "training_modifications": {
    "volume": "increase|maintain|decrease",
    "frequency": "increase|maintain|decrease",
    "intensity": "increase|maintain|decrease",
    "reasoning": "explanation"
  },
  "recovery_recommendations": ["recommendation1", "recommendation2"],
  "warnings": ["any concerns or warnings"]
}`;
  }

  formatWorkoutSummary(workouts) {
    return workouts.map(w => 
      `- ${w.template_key} on ${w.date}: ${w.completed ? 'Completed' : 'Partial'}, Notes: ${w.notes || 'None'}`
    ).join('\n');
  }

  formatExerciseData(exercises) {
    return Object.entries(exercises).map(([name, data]) => {
      const avgWeight = data.weights.reduce((a, b) => a + b, 0) / data.weights.length;
      const avgReps = data.reps.reduce((a, b) => a + b, 0) / data.reps.length;
      return `${name}:
  - Average weight: ${avgWeight.toFixed(1)} lbs
  - Average reps: ${avgReps.toFixed(1)}
  - Weight progression: ${data.weights.join(' → ')}
  - Rep progression: ${data.reps.join(' → ')}`;
    }).join('\n\n');
  }

  formatRPEData(rpeData) {
    return Object.entries(rpeData).map(([exercise, rpes]) => {
      const avgRPE = rpes.reduce((a, b) => a + b, 0) / rpes.length;
      const trend = this.calculateTrend(rpes);
      return `${exercise}: Average RPE ${avgRPE.toFixed(1)}, Trend: ${trend}, Values: [${rpes.join(', ')}]`;
    }).join('\n');
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg - firstAvg > 0.5) return 'increasing';
    if (firstAvg - secondAvg > 0.5) return 'decreasing';
    return 'stable';
  }

  parseClaudeResponse(responseText) {
    try {
      // Extract JSON from Claude's response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: try to parse the entire response
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      
      // Return a default structure with the raw response
      return {
        overall_assessment: {
          fatigue_level: 'moderate',
          progress_rate: 'optimal',
          summary: 'Analysis completed but response parsing failed'
        },
        raw_response: responseText,
        error: 'Failed to parse structured response'
      };
    }
  }

  /**
   * Generate smart defaults for the next workout based on AI suggestions
   * @param {Object} suggestions - AI suggestions for exercises
   * @param {Object} lastWorkout - Previous workout data
   * @returns {Object} Default values for form inputs
   */
  generateSmartDefaults(suggestions, lastWorkout) {
    const defaults = {};
    
    Object.entries(suggestions.exercise_recommendations || {}).forEach(([exercise, recommendation]) => {
      defaults[exercise] = {
        weight: recommendation.suggested_weight,
        reps: recommendation.suggested_reps,
        isAISuggested: true,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning
      };
    });
    
    return defaults;
  }
}