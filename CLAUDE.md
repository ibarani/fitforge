# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitForge is a comprehensive fitness tracking web application built with React, Vite, and Tailwind CSS. It provides a workout tracking interface with timers, RPE (Rate of Perceived Exertion) scales, and exercise tracking capabilities.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

The application follows a single-page React architecture with:

- **Vite** as the build tool and development server
- **React 18** for component-based UI
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **localStorage** for client-side data persistence

### Key Components

- `WorkoutTracker.jsx`: Main component containing all workout logic, templates, and state management
  - Timer management with audio feedback
  - Exercise templates with predefined workouts
  - RPE visual scale for effort tracking
  - Local storage for workout persistence
  - CSV export functionality

### Data Flow

1. Workout templates are predefined in `DEFAULT_TEMPLATES`
2. User interactions update state through React hooks
3. Data auto-saves to localStorage after changes
4. Completed workouts track cycle completion for progressive training

## Key Features

- **Workout Templates**: Pre-configured Push/Pull workouts with mandatory and optional variations
- **Rest Timer**: Auto-starts after completing sets with audio notifications
- **RPE Tracking**: Visual scale for rating exercise difficulty
- **Progress Tracking**: Previous workout data displayed for progressive overload
- **Data Persistence**: Auto-saves to browser localStorage
- **Export**: CSV export for workout data analysis

## Project Structure

```
fitforge/
├── src/
│   ├── components/
│   │   └── WorkoutTracker.jsx  # Main workout tracking component
│   ├── App.jsx                 # Root app component
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind directives
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
└── postcss.config.js           # PostCSS configuration
```

## Code Conventions

- Component files use `.jsx` extension
- All components are functional with React Hooks
- State management uses `useState`, `useEffect`, `useCallback`, and `useMemo`
- Custom hooks (like `useTimer`) for reusable logic
- Tailwind classes for styling (no separate CSS files)