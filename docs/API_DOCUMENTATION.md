# FitForge API Documentation

## Base URL

Production: `https://lbgihtb5md.execute-api.us-west-2.amazonaws.com/prod`

## Authentication

All API endpoints (except `/api/health`) require JWT authentication via AWS Cognito.

### Headers

```http
Authorization: Bearer <idToken>
Content-Type: application/json
```

## Endpoints

### Health Check

Check API availability and status.

```http
GET /api/health
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-08-25T16:46:04.101Z",
  "environment": "AWS_Lambda_nodejs18.x"
}
```

**Status Codes:**
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is down

---

### Save Workout

Save a completed workout session.

```http
POST /api/workouts
```

#### Request Body

```json
{
  "userId": "igor@barani.org",
  "templateKey": "A_push_power",
  "date": "2025-08-25",
  "bodyweight": 185,
  "exercises": {
    "Bench Press": [
      { "weight": 225, "reps": 5 },
      { "weight": 225, "reps": 5 },
      { "weight": 225, "reps": 5 }
    ],
    "Overhead Press": [
      { "weight": 135, "reps": 8 },
      { "weight": 135, "reps": 8 }
    ]
  },
  "exerciseRPEs": {
    "Bench Press": 8,
    "Overhead Press": 7
  },
  "skipped": ["Dips"],
  "sessionNotes": "Felt strong today, increased bench weight",
  "timestamp": "2025-08-25T10:30:00.000Z"
}
```

#### Response

```json
{
  "message": "Workout saved successfully",
  "workoutId": "workout_1234567890",
  "data": {
    "PK": "USER#igor@barani.org",
    "SK": "WORKOUT#2025-08-25T10:30:00.000Z",
    "templateKey": "A_push_power",
    // ... rest of workout data
  }
}
```

**Status Codes:**
- `200 OK`: Workout saved successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

---

### Get Workout History

Retrieve workout history for a user.

```http
GET /api/workouts?userId=<userId>&limit=<limit>
```

#### Query Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| userId | string | Yes | User email/ID | - |
| limit | number | No | Maximum workouts to return | 50 |

#### Response

```json
[
  {
    "workoutId": "workout_1234567890",
    "userId": "igor@barani.org",
    "date": "2025-08-25",
    "templateKey": "A_push_power",
    "bodyweight": 185,
    "exercises": {
      "Bench Press": [
        { "weight": 225, "reps": 5 },
        { "weight": 225, "reps": 5 }
      ]
    },
    "exerciseRPEs": {
      "Bench Press": 8
    },
    "timestamp": "2025-08-25T10:30:00.000Z"
  },
  // ... more workouts
]
```

**Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### Get AI Analysis

Request AI analysis for completed workouts.

```http
POST /api/analysis
```

#### Request Body

```json
{
  "userId": "igor@barani.org",
  "workoutIds": [
    "workout_1234567890",
    "workout_1234567891",
    "workout_1234567892"
  ],
  "requestTimestamp": "2025-08-25T10:30:00.000Z"
}
```

#### Response

```json
{
  "analysisId": "analysis_abc123",
  "userId": "igor@barani.org",
  "summary": {
    "strengths": [
      "Consistent progressive overload on bench press",
      "Good RPE management staying in 7-8 range"
    ],
    "improvements": [
      "Consider adding more volume to pulling movements",
      "Rest periods may be too short based on RPE trends"
    ],
    "recommendations": [
      "Increase pull-up volume by 1 set next week",
      "Add 5lbs to deadlift working sets"
    ]
  },
  "detailedAnalysis": {
    "volumeAnalysis": {
      "push": "High volume, well-distributed",
      "pull": "Moderate volume, could increase",
      "legs": "Adequate for current phase"
    },
    "intensityAnalysis": {
      "averageRPE": 7.5,
      "trend": "stable",
      "recommendation": "Maintain current intensity"
    }
  },
  "timestamp": "2025-08-25T10:31:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Analysis complete
- `202 Accepted`: Analysis started (async)
- `400 Bad Request`: Invalid workout IDs
- `401 Unauthorized`: Invalid token
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Analysis failed

---

### Delete Workout

Delete a specific workout.

```http
DELETE /api/workouts/:workoutId
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workoutId | string | Yes | Unique workout identifier |

#### Response

```json
{
  "message": "Workout deleted successfully",
  "workoutId": "workout_1234567890"
}
```

**Status Codes:**
- `200 OK`: Deleted successfully
- `401 Unauthorized`: Invalid token
- `404 Not Found`: Workout not found
- `500 Internal Server Error`: Server error

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-25T10:30:00.000Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token missing |
| `AUTH_INVALID` | Invalid authentication token |
| `AUTH_EXPIRED` | Token has expired |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

---

## Rate Limiting

- **Requests per second**: 10
- **Burst capacity**: 20
- **Headers returned**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## CORS Configuration

Allowed origins:
- `http://localhost:5173` (development)
- `https://www.barani.org`
- `https://barani.org`

Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`

Allowed headers: `Content-Type, Authorization`

---

## Data Types

### Workout Object

```typescript
interface Workout {
  workoutId: string;
  userId: string;
  templateKey: string;
  date: string; // YYYY-MM-DD
  bodyweight?: number;
  exercises: {
    [exerciseName: string]: Array<{
      weight: number;
      reps: number;
    }>;
  };
  exerciseRPEs?: {
    [exerciseName: string]: number; // 1-10
  };
  skipped?: string[];
  sessionNotes?: string;
  timestamp: string; // ISO 8601
}
```

### Exercise Set

```typescript
interface ExerciseSet {
  weight: number; // in pounds
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}
```

---

## Example Requests

### cURL Examples

#### Save Workout
```bash
curl -X POST https://api.fitforge.com/api/workouts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@example.com",
    "templateKey": "A_push_power",
    "exercises": {
      "Bench Press": [{"weight": 225, "reps": 5}]
    }
  }'
```

#### Get History
```bash
curl -X GET "https://api.fitforge.com/api/workouts?userId=user@example.com&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript/Fetch Examples

#### Save Workout
```javascript
const saveWorkout = async (workoutData) => {
  const response = await fetch('https://api.fitforge.com/api/workouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workoutData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

#### Get History
```javascript
const getWorkoutHistory = async (userId, limit = 50) => {
  const response = await fetch(
    `https://api.fitforge.com/api/workouts?userId=${userId}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

---

## Webhooks

Currently not implemented. Future versions may include webhooks for:
- Workout completion
- AI analysis completion
- Achievement unlocked

---

## SDK Support

Currently no official SDK. Use standard HTTP clients or the provided JavaScript examples.

---

## Changelog

### Version 1.0.0 (2025-08-25)
- Initial API release
- Basic CRUD operations for workouts
- AI analysis endpoint
- Authentication via Cognito

---

## Support

For API issues or questions:
- GitHub Issues: [fitforge/issues](https://github.com/fitforge/issues)
- Email: support@fitforge.app