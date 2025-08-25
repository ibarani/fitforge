/**
 * @fileoverview Workout selection UI components for FitForge.
 * Provides visual card-based workout selection with progress tracking.
 * 
 * @module WorkoutSelector
 * @author Igor Barani
 * @copyright 2025 FitForge
 */

import React from 'react';
import {
  Dumbbell, Target, Brain, Zap, Heart, Activity, Check, Settings
} from 'lucide-react';

/**
 * Individual workout card component with visual feedback.
 * Displays workout information with gradient backgrounds and selection state.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.workout - Workout template object.
 * @param {string} props.workout.key - Unique workout identifier.
 * @param {string} props.workout.title - Workout display title.
 * @param {Array<Object>} props.workout.exercises - List of exercises.
 * @param {boolean} props.workout.mandatory - Whether workout is required.
 * @param {number} props.index - Card index in the list.
 * @param {boolean} props.isActive - Whether this card is currently selected.
 * @param {boolean} props.isCompleted - Whether this workout is completed.
 * @param {function(number): void} props.onClick - Selection callback function.
 * @returns {React.ReactElement} Workout card component.
 * 
 * @example
 * <WorkoutCard
 *   workout={workoutTemplate}
 *   index={0}
 *   isActive={true}
 *   isCompleted={false}
 *   onClick={(index) => handleSelect(index)}
 * />
 */
export const WorkoutCard = ({ workout, index, isActive, isCompleted, onClick }) => {
  /**
   * Returns appropriate icon component based on workout type.
   * 
   * @param {string} key - Workout key identifier.
   * @returns {React.ReactElement} Lucide icon component.
   * @private
   */
  const getWorkoutIcon = (key) => {
    if (key.includes('push')) return <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (key.includes('pull')) return <Target className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (key.includes('leg')) return <Zap className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (key.includes('core')) return <Brain className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (key.includes('optional')) return <Heart className="w-5 h-5 sm:w-6 sm:h-6" />;
    return <Activity className="w-5 h-5 sm:w-6 sm:h-6" />;
  };

  /**
   * Returns Tailwind gradient classes based on workout type.
   * 
   * @param {string} key - Workout key identifier.
   * @returns {string} Tailwind CSS gradient classes.
   * @private
   */
  const getWorkoutColor = (key) => {
    if (key.includes('optional')) return 'from-teal-400 to-cyan-500';  // Check optional first
    if (key.includes('push')) return 'from-blue-500 to-indigo-600';
    if (key.includes('pull')) return 'from-green-500 to-emerald-600';
    if (key.includes('leg')) return 'from-orange-500 to-red-600';
    if (key.includes('core')) return 'from-purple-500 to-pink-600';
    return 'from-gray-500 to-gray-600';
  };

  /** @type {string} Extract workout letter (A-D) from title */
  const letter = workout.title.match(/Workout ([A-D])/)?.[1] || '';
  
  /** @type {boolean} Check if workout is optional */
  const isOptional = !workout.mandatory;
  
  /** @type {string} Extract short title from full workout name */
  const shortTitle = workout.title.split(':')[1]?.trim()?.split('(')[0]?.trim() || 
                     workout.title.replace('[OPTIONAL]', '').trim();

  return (
    <button
      onClick={() => onClick(index)}
      className={`relative group transition-all duration-200 sm:hover:-translate-y-1 touch-manipulation w-full text-left rounded-lg sm:rounded-xl ${
        isActive
          ? 'shadow-2xl sm:shadow-[0_20px_50px_rgba(99,102,241,0.3)] scale-[1.02] brightness-110'
          : 'shadow-md sm:shadow-lg hover:shadow-xl hover:scale-[1.01]'
      }`}
      aria-label={`Select ${workout.title}`}
    >
      <div className="relative h-20 sm:h-32 rounded-[inherit] overflow-hidden">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-200 ${getWorkoutColor(workout.key)} ${
          isCompleted ? 'opacity-70' : isActive ? 'opacity-100 saturate-125' : 'opacity-100'
        }`} />
        
        {/* Selection Overlay - Subtle glow effect */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/10 pointer-events-none" />
        )}
        
        {/* Mobile Layout */}
        <div className="sm:hidden relative h-full p-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Letter/Icon */}
            <div className="flex-shrink-0">
              {letter ? (
                <div className="text-2xl font-black bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  {letter}
                </div>
              ) : (
                <div className="bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  {getWorkoutIcon(workout.key)}
                </div>
              )}
            </div>
            {/* Title */}
            <div className="flex-1">
              <div className="text-sm font-bold">
                {shortTitle}
              </div>
              <div className="text-xs opacity-75">
                {workout.exercises.length} exercises
              </div>
            </div>
          </div>
          {/* Status */}
          <div className="flex items-center gap-2">
            {isCompleted && (
              <div className="bg-green-400 rounded-full p-1.5">
                <Check className="w-4 h-4" />
              </div>
            )}
            {isActive && (
              <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                Active
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden sm:block relative h-full p-4">
          <div className="flex flex-col justify-between h-full text-white">
            {/* Top Section */}
            <div className="flex items-start justify-between">
              <div>
                {letter ? (
                  <div className="text-3xl font-black">{letter}</div>
                ) : (
                  <div className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full inline-block">
                    OPTIONAL
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {getWorkoutIcon(workout.key)}
                {isCompleted && (
                  <div className="bg-green-400 rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom Section */}
            <div>
              <div className="text-xs font-bold opacity-90 line-clamp-2">
                {shortTitle}
              </div>
              <div className="text-xs opacity-75 mt-1">
                {workout.exercises.length} exercises
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Selection Indicator - Shows selected state */}
        {isActive && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg z-10">
            <span className="text-xs font-semibold text-indigo-600">Active</span>
          </div>
        )}
      </div>
    </button>
  );
};

/**
 * Progress ring visualization component.
 * Displays workout cycle completion as a circular progress indicator.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {number} props.completedCount - Number of completed workouts.
 * @param {number} props.totalCount - Total workouts in cycle.
 * @returns {React.ReactElement} SVG progress ring.
 * 
 * @example
 * <CycleProgressRing completedCount={3} totalCount={6} />
 */
export const CycleProgressRing = ({ completedCount, totalCount }) => {
  /** @type {number} Calculate completion percentage */
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  return (
    <div className="relative">
      {/* Mobile - Smaller Ring */}
      <div className="sm:hidden relative w-16 h-16">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="#E5E7EB"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="#6366F1"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - completedCount / totalCount)}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-800">{percentage}%</span>
        </div>
      </div>
      
      {/* Desktop - Larger Ring */}
      <div className="hidden sm:block relative w-20 h-20">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="url(#gradient)"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - completedCount / totalCount)}`}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-800">{percentage}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Profile settings modal component.
 * Allows users to configure workout cycle and UI preferences.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Modal visibility state.
 * @param {function(): void} props.onClose - Close modal callback.
 * @param {Object<string, boolean>} props.includeInAnalysis - Workout inclusion map.
 * @param {function(Object): void} props.setIncludeInAnalysis - Update inclusion map.
 * @param {Array<Object>} props.templates - Available workout templates.
 * @param {boolean} props.useVisualSelector - Visual selector preference.
 * @param {function(boolean): void} props.setUseVisualSelector - Update UI preference.
 * @returns {React.ReactElement|null} Modal component or null if closed.
 * 
 * @example
 * <ProfileSettingsModal
 *   isOpen={showSettings}
 *   onClose={() => setShowSettings(false)}
 *   includeInAnalysis={analysisMap}
 *   setIncludeInAnalysis={setAnalysisMap}
 *   templates={workoutTemplates}
 *   useVisualSelector={true}
 *   setUseVisualSelector={setVisualMode}
 * />
 */
export const ProfileSettingsModal = ({ isOpen, onClose, includeInAnalysis, setIncludeInAnalysis, templates, useVisualSelector, setUseVisualSelector }) => {
  if (!isOpen) return null;

  /**
   * Toggles workout inclusion in AI analysis cycle.
   * Persists preference to localStorage.
   * 
   * @param {string} workoutKey - Unique workout identifier.
   * @returns {void}
   */
  const handleToggle = (workoutKey) => {
    const updated = { ...includeInAnalysis, [workoutKey]: !includeInAnalysis[workoutKey] };
    setIncludeInAnalysis(updated);
    localStorage.setItem('includeInAnalysis', JSON.stringify(updated));
  };

  /**
   * Toggles visual selector UI preference.
   * Persists preference to localStorage.
   * 
   * @returns {void}
   */
  const handleVisualToggle = () => {
    const newValue = !useVisualSelector;
    setUseVisualSelector(newValue);
    localStorage.setItem('useVisualSelector', JSON.stringify(newValue));
  };

  /** @type {Array<Object>} Filter mandatory workout templates */
  const mandatoryWorkouts = templates?.filter(t => t.mandatory) || [];
  
  /** @type {Array<Object>} Filter optional workout templates */
  const optionalWorkouts = templates?.filter(t => !t.mandatory) || [];

  /** @type {number} Count workouts selected for AI analysis cycle */
  const selectedCount = mandatoryWorkouts.filter(w => includeInAnalysis[w.key] !== false).length + 
                       optionalWorkouts.filter(w => includeInAnalysis[w.key] === true).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Profile Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* AI Analysis Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Include in AI Analysis Cycle
            </h3>
            <div className="text-xs text-gray-500 mb-3">
              Select which workouts to track for AI analysis. Analysis triggers when you complete all selected workouts.
              <div className="mt-1 font-semibold text-indigo-600">
                Current cycle: {selectedCount} workouts selected
              </div>
            </div>
            
            {/* Mandatory Workouts */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 mb-2">Core Training (Recommended)</div>
              <div className="space-y-2">
                {mandatoryWorkouts.map(workout => {
                  const letter = workout.title.match(/Workout ([A-D])/)?.[1] || '';
                  const subtitle = workout.title.split(':')[1]?.trim() || '';
                  return (
                    <label key={workout.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer touch-manipulation">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {letter ? `Workout ${letter}` : workout.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subtitle}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeInAnalysis[workout.key] !== false}
                        onChange={() => handleToggle(workout.key)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional Workouts */}
            {optionalWorkouts.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Recovery & Supplemental</div>
                <div className="space-y-2">
                  {optionalWorkouts.map(workout => (
                    <label key={workout.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer touch-manipulation">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {workout.title.replace('Optional:', '').trim()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Recovery & mobility work
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeInAnalysis[workout.key] === true}
                        onChange={() => handleToggle(workout.key)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* UI Preferences */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Display Preferences
            </h3>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer touch-manipulation">
              <div>
                <div className="font-medium text-gray-800">Visual Workout Selector</div>
                <div className="text-xs text-gray-500">
                  Use colorful cards instead of dropdown
                </div>
              </div>
              <input
                type="checkbox"
                checked={useVisualSelector || false}
                onChange={handleVisualToggle}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium touch-manipulation"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

/**
 * Main workout selector component.
 * Displays all available workouts in a visual card grid with progress tracking.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.templates - Available workout templates.
 * @param {number} props.activeTemplate - Currently selected template index.
 * @param {function(number): void} props.setActiveTemplate - Template selection callback.
 * @param {Object} props.cycleProgress - Current cycle progress data.
 * @param {Array<string>} props.cycleProgress.completed - Completed workout keys.
 * @param {Object<string, boolean>} props.includeInAnalysis - Workout inclusion map.
 * @returns {React.ReactElement} Workout selector interface.
 * 
 * @example
 * <WorkoutSelector
 *   templates={workoutTemplates}
 *   activeTemplate={0}
 *   setActiveTemplate={setActive}
 *   cycleProgress={{completed: ['A_push_power']}}
 *   includeInAnalysis={{A_push_power: true}}
 * />
 */
export const WorkoutSelector = ({ 
  templates, 
  activeTemplate, 
  setActiveTemplate, 
  cycleProgress,
  includeInAnalysis 
}) => {
  /** @type {Array<Object>} Filter mandatory workout templates */
  const mandatoryWorkouts = templates.filter(t => t.mandatory);
  
  /** @type {Object|undefined} Find optional workout template */
  const optionalWorkout = templates.find(t => !t.mandatory);
  
  /** @type {Array<string>} Extract completed workout keys */
  const completedWorkouts = cycleProgress?.completed || [];

  /**
   * Checks if a workout has been completed in current cycle.
   * 
   * @param {string} workoutKey - Unique workout identifier.
   * @returns {boolean} True if workout is completed.
   */
  const isWorkoutCompleted = (workoutKey) => {
    return completedWorkouts.includes(workoutKey);
  };

  /** @type {number} Calculate number of workouts selected for AI analysis */
  const selectedForAnalysis = templates.filter(t => 
    (t.mandatory && includeInAnalysis?.[t.key] !== false) || 
    (!t.mandatory && includeInAnalysis?.[t.key] === true)
  ).length;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Select Workout</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
            Complete all {selectedForAnalysis || 6} selected workouts to finish your training cycle
          </p>
        </div>
        <CycleProgressRing 
          completedCount={completedWorkouts.length} 
          totalCount={selectedForAnalysis || 6} 
        />
      </div>

      {/* All Workout Cards - Vertical on mobile, Grid on desktop */}
      <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 sm:gap-4">
        {/* Mandatory Workouts */}
        {mandatoryWorkouts.map((workout, index) => (
          <WorkoutCard
            key={workout.key}
            workout={workout}
            index={index}
            isActive={activeTemplate === index}
            isCompleted={isWorkoutCompleted(workout.key)}
            onClick={setActiveTemplate}
          />
        ))}
        
        {/* Optional Workout - Same row */}
        {optionalWorkout && (
          <WorkoutCard
            workout={optionalWorkout}
            index={templates.indexOf(optionalWorkout)}
            isActive={activeTemplate === templates.indexOf(optionalWorkout)}
            isCompleted={isWorkoutCompleted(optionalWorkout.key)}
            onClick={setActiveTemplate}
          />
        )}
      </div>
    </div>
  );
};