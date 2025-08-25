# FitForge Component Guide

## Component Hierarchy

```
App
├── Login
└── WorkoutTracker
    ├── WorkoutSelector
    │   ├── WorkoutCard
    │   ├── CycleProgressRing
    │   └── ProfileSettingsModal
    ├── WorkoutHistory
    └── Exercise Components
```

---

## Core Components

### App.jsx

**Purpose**: Main application component handling routing and authentication.

**Key Features**:
- Authentication state management
- Route protection
- AWS Amplify configuration

**Props**: None (Root component)

**State**:
- `isAuthenticated`: boolean
- `userEmail`: string
- `loading`: boolean

**Usage**:
```jsx
// Automatically rendered as root
<App />
```

---

### Login.jsx

**Purpose**: User authentication interface with sign-in, sign-up, and password reset.

**Key Features**:
- Email/password authentication
- Form validation
- Error handling
- Password visibility toggle

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onLogin | function | Yes | Callback with user data on successful login |

**State**:
- `isSignUp`: boolean - Toggle between sign-in/sign-up
- `email`: string
- `password`: string
- `error`: string
- `showPassword`: boolean

**Usage**:
```jsx
<Login onLogin={(email) => handleLogin(email)} />
```

---

### WorkoutTracker.jsx

**Purpose**: Main workout tracking interface - the heart of the application.

**Key Features**:
- Exercise tracking with sets/reps/weight
- RPE rating system
- Session notes
- Workout completion
- AI analysis integration
- Local storage backup

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| userId | string | Yes | User email/identifier |
| onLogout | function | Yes | Logout callback |

**State** (Key items):
- `activeTemplate`: number - Selected workout index
- `workoutData`: object - Exercise sets data
- `exerciseRPEs`: object - RPE ratings
- `sessionNotes`: string
- `workoutComplete`: boolean
- `activeView`: 'workout' | 'history'

**Methods**:
- `handleAddSet(exercise, weight, reps)`
- `handleDeleteSet(exercise, setIndex)`
- `handleSaveWorkout()`
- `handleCompleteWorkout()`

**Usage**:
```jsx
<WorkoutTracker 
  userId="igor@barani.org" 
  onLogout={() => handleLogout()} 
/>
```

---

### WorkoutSelector.jsx

**Purpose**: Visual workout selection interface with card-based UI.

**Exports**:
- `WorkoutCard` - Individual workout card
- `CycleProgressRing` - Progress visualization
- `ProfileSettingsModal` - Settings dialog
- `WorkoutSelector` - Main selector component

#### WorkoutCard

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| workout | object | Yes | Workout template data |
| index | number | Yes | Card index |
| isActive | boolean | Yes | Selection state |
| isCompleted | boolean | Yes | Completion state |
| onClick | function | Yes | Selection callback |

**Features**:
- Gradient backgrounds by workout type
- Active state highlighting
- Completion checkmarks
- Responsive design

**Usage**:
```jsx
<WorkoutCard
  workout={workoutTemplate}
  index={0}
  isActive={activeTemplate === 0}
  isCompleted={false}
  onClick={(index) => setActiveTemplate(index)}
/>
```

#### CycleProgressRing

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| completedCount | number | Yes | Completed workouts |
| totalCount | number | Yes | Total workouts in cycle |

**Features**:
- SVG progress ring
- Percentage display
- Animated transitions
- Responsive sizing

**Usage**:
```jsx
<CycleProgressRing 
  completedCount={3} 
  totalCount={6} 
/>
```

#### ProfileSettingsModal

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Modal visibility |
| onClose | function | Yes | Close callback |
| includeInAnalysis | object | Yes | Workout selection for AI |
| setIncludeInAnalysis | function | Yes | Update selection |
| templates | array | Yes | Workout templates |
| useVisualSelector | boolean | Yes | UI preference |
| setUseVisualSelector | function | Yes | Update UI preference |

**Features**:
- Workout cycle configuration
- UI preferences
- LocalStorage persistence

---

### WorkoutHistory.jsx

**Purpose**: Display and analyze workout history with multiple view modes.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| userId | string | No | 'igor' | User identifier |

**State**:
- `workoutHistory`: array - All workouts
- `selectedMonth`: Date - Calendar month
- `selectedWorkout`: object - Detail view
- `viewMode`: 'calendar' | 'list' | 'stats'

**View Modes**:

1. **Calendar View**
   - Monthly calendar with workout indicators
   - Click to view workout details
   - Navigation between months

2. **List View**
   - Chronological workout list
   - Quick overview of exercises
   - Session notes indicator

3. **Stats View**
   - 30-day metrics
   - Hard sets tracking
   - Tonnage calculation
   - Average RPE
   - Achievement badges

**Calculated Metrics**:
- Current streak
- Weekly/monthly totals
- Volume (tonnage)
- Training intensity (RPE)

**Usage**:
```jsx
<WorkoutHistory userId="igor@barani.org" />
```

---

## Service Components

### workoutService.js

**Purpose**: API communication layer for workout data.

**Exports**:

#### saveWorkout(workoutData, userId, idToken)
Saves workout to backend with localStorage fallback.

```javascript
const result = await saveWorkout(
  workoutData,
  'igor@barani.org',
  idToken
);
```

#### getWorkoutHistory(userId, idToken, limit)
Retrieves workout history from backend.

```javascript
const workouts = await getWorkoutHistory(
  'igor@barani.org',
  idToken,
  50
);
```

#### getAIAnalysis(workoutIds, userId, idToken)
Requests AI analysis for completed workouts.

```javascript
const analysis = await getAIAnalysis(
  ['workout_1', 'workout_2'],
  'igor@barani.org',
  idToken
);
```

#### testBackendConnection()
Health check for backend availability.

```javascript
const isOnline = await testBackendConnection();
```

---

## Component Styling

### Design System

**Colors**:
- Primary: Indigo (`indigo-600`)
- Success: Green (`green-500`)
- Error: Red (`red-500`)
- Background: Gray gradient (`gray-50` to `blue-50`)

**Spacing**:
- Cards: `p-4 sm:p-6`
- Sections: `mb-4 sm:mb-6`
- Inline: `gap-2` to `gap-4`

**Responsive Breakpoints**:
- Mobile: Default
- Tablet: `sm:` (640px+)
- Desktop: `md:` (768px+)
- Large: `lg:` (1024px+)

### Component Classes

**Cards**:
```css
.workout-card {
  @apply rounded-lg sm:rounded-xl shadow-md sm:shadow-lg;
  @apply transition-all duration-200;
  @apply hover:shadow-xl hover:scale-[1.01];
}
```

**Buttons**:
```css
.primary-button {
  @apply px-4 py-2 bg-indigo-600 text-white rounded-lg;
  @apply hover:bg-indigo-700 transition-colors;
  @apply touch-manipulation;
}
```

**Forms**:
```css
.input-field {
  @apply w-full px-3 py-2 border-2 border-gray-200 rounded-lg;
  @apply focus:border-indigo-500 focus:outline-none;
}
```

---

## State Management Patterns

### Local State
Components use React hooks for local state:
```jsx
const [value, setValue] = useState(initialValue);
```

### Persistent State
LocalStorage for offline capability:
```jsx
useEffect(() => {
  const saved = localStorage.getItem('key');
  if (saved) setState(JSON.parse(saved));
}, []);

useEffect(() => {
  localStorage.setItem('key', JSON.stringify(state));
}, [state]);
```

### Derived State
Computed values from props/state:
```jsx
const stats = useMemo(() => calculateStats(workouts), [workouts]);
```

---

## Component Best Practices

### 1. Error Boundaries
Wrap components in error boundaries for graceful failures.

### 2. Loading States
Always show loading indicators during async operations:
```jsx
{loading ? <Spinner /> : <Content />}
```

### 3. Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Maintain focus management

### 4. Performance
- Memoize expensive calculations
- Use React.memo for pure components
- Lazy load heavy components
- Optimize re-renders

### 5. Testing
Components should be testable:
```jsx
// Good: Testable component
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// Test
fireEvent.click(getByText('Click me'));
expect(onClick).toHaveBeenCalled();
```

---

## Component Communication

### Props Flow
```
App
 ├─(userId)→ WorkoutTracker
 │            ├─(templates)→ WorkoutSelector
 │            ├─(workouts)→ WorkoutHistory
 │            └─(exercises)→ ExerciseList
 └─(onLogin)→ Login
```

### Event Handling
```javascript
// Child component
onClick={(index) => props.onSelect(index)}

// Parent component
handleSelect = (index) => {
  setActiveTemplate(index);
}
```

### Context Usage
Currently not using Context API, but could benefit for:
- User authentication state
- Theme preferences
- Global notifications

---

## PWA Components

### Service Worker
Handles offline functionality and caching.

### Web App Manifest
```json
{
  "name": "FitForge",
  "short_name": "FitForge",
  "start_url": "/fitforge/",
  "display": "standalone",
  "theme_color": "#4F46E5",
  "background_color": "#ffffff"
}
```

---

## Future Component Ideas

1. **ProgressChart.jsx**
   - Visualize strength progression
   - Track volume over time

2. **ExerciseLibrary.jsx**
   - Exercise database
   - Form videos
   - Muscle groups

3. **SocialFeed.jsx**
   - Share workouts
   - Community challenges

4. **NutritionTracker.jsx**
   - Calorie tracking
   - Macro management

5. **RecoveryMonitor.jsx**
   - Sleep tracking
   - HRV monitoring

---

## Component Development Workflow

### Creating New Components

1. **File Structure**:
```
src/components/
└── NewComponent.jsx
```

2. **Component Template**:
```jsx
import React, { useState, useEffect } from 'react';
import { IconName } from 'lucide-react';

export function NewComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initial);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div className="component-class">
      {/* Component JSX */}
    </div>
  );
}
```

3. **PropTypes** (Optional):
```jsx
NewComponent.propTypes = {
  prop1: PropTypes.string.required,
  prop2: PropTypes.number
};
```

4. **Export**:
```jsx
export default NewComponent;
// or
export { NewComponent };
```

---

## Debugging Components

### React DevTools
- Install browser extension
- Inspect component tree
- Monitor state changes
- Profile performance

### Console Logging
```jsx
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);
```

### Error Handling
```jsx
try {
  // Risky operation
} catch (error) {
  console.error('Component error:', error);
  setError(error.message);
}
```

---

## Component Testing Strategy

### Unit Tests
Test individual components in isolation.

### Integration Tests
Test component interactions.

### E2E Tests
Test complete user workflows.

### Accessibility Tests
Ensure WCAG compliance.

---

This guide covers all major components in the FitForge application. For specific implementation details, refer to the source code in `/src/components/`.