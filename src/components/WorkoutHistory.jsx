import React, { useState, useEffect } from 'react';
import {
  Calendar, TrendingUp, Award, Clock, Activity,
  ChevronLeft, ChevronRight, Flame, Target, BarChart3,
  CheckCircle, Dumbbell, User, Filter
} from 'lucide-react';

export function WorkoutHistory({ userId = 'igor' }) {
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list, stats
  const [loading, setLoading] = useState(true);

  // Fetch workout history from backend
  useEffect(() => {
    fetchWorkoutHistory();
  }, [userId]);

  const fetchWorkoutHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/workouts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkoutHistory(data);
      }
    } catch (error) {
      console.error('Error fetching workout history:', error);
      // Load from localStorage as fallback
      const savedHistory = localStorage.getItem('workoutHistory');
      if (savedHistory) {
        setWorkoutHistory(JSON.parse(savedHistory));
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentWorkouts = workoutHistory.filter(w => new Date(w.date) >= thirtyDaysAgo);
    const weekWorkouts = workoutHistory.filter(w => new Date(w.date) >= sevenDaysAgo);

    // Calculate current streak
    let currentStreak = 0;
    const sortedWorkouts = [...workoutHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    let lastDate = new Date();
    
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      const dayDiff = Math.floor((lastDate - workoutDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= 1) {
        currentStreak++;
        lastDate = workoutDate;
      } else {
        break;
      }
    }

    // Calculate meaningful metrics
    // Total Volume (tonnage) - weight × reps
    const totalVolume = recentWorkouts.reduce((total, workout) => {
      const workoutVolume = Object.values(workout.exercises || {}).reduce((sum, sets) => {
        return sum + sets.reduce((setSum, set) => {
          return setSum + ((set.weight || 0) * (set.reps || 0));
        }, 0);
      }, 0);
      return total + workoutVolume;
    }, 0);

    // Total Hard Sets (more meaningful for hypertrophy)
    const totalSets = recentWorkouts.reduce((total, workout) => {
      return total + Object.values(workout.exercises || {}).reduce((sum, sets) => {
        return sum + sets.length;
      }, 0);
    }, 0);

    // Average RPE (training intensity indicator)
    const avgRPE = (() => {
      const allRPEs = recentWorkouts.flatMap(workout => 
        Object.values(workout.exerciseRPEs || {})
      ).filter(rpe => rpe);
      return allRPEs.length > 0 
        ? (allRPEs.reduce((a, b) => a + b, 0) / allRPEs.length).toFixed(1)
        : null;
    })();

    return {
      totalWorkouts: workoutHistory.length,
      thisMonth: recentWorkouts.length,
      thisWeek: weekWorkouts.length,
      currentStreak,
      totalVolume: Math.round(totalVolume),
      totalSets,
      avgRPE,
      avgWorkoutsPerWeek: (recentWorkouts.length / 4.3).toFixed(1)
    };
  };

  const stats = calculateStats();

  // Calendar view helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getWorkoutsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return workoutHistory.filter(w => w.date.startsWith(dateStr));
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setSelectedMonth(newMonth);
  };

  const formatWorkoutTitle = (workout) => {
    const templates = {
      'A_push_power': 'Push Day (Power)',
      'A_pull_width': 'Pull Day (Width)',
      'B_push_hyp': 'Push Day (Hypertrophy)',
      'B_pull_strength': 'Pull Day (Strength)',
      'C_leg_day': 'Leg Day',
      'D_core_circuit': 'Core Circuit',
      'recovery': 'Recovery & Mobility'
    };
    return templates[workout.templateKey] || workout.templateKey;
  };

  const getWorkoutIcon = (templateKey) => {
    if (templateKey?.includes('push')) return '💪';
    if (templateKey?.includes('pull')) return '🏋️';
    if (templateKey?.includes('leg')) return '🦵';
    if (templateKey?.includes('core')) return '🎯';
    if (templateKey?.includes('recovery')) return '🧘';
    return '💪';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            Workout History
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'stats' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Current Streak</p>
                <p className="text-2xl font-bold text-purple-900">{stats.currentStreak}</p>
              </div>
              <Flame className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">This Week</p>
                <p className="text-2xl font-bold text-blue-900">{stats.thisWeek}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">This Month</p>
                <p className="text-2xl font-bold text-green-900">{stats.thisMonth}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalWorkouts}</p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {getDaysInMonth(selectedMonth).map((date, index) => {
                const workouts = date ? getWorkoutsForDate(date) : [];
                const isToday = date && date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`
                      aspect-square border rounded-lg p-1 relative
                      ${!date ? 'bg-transparent border-transparent' : ''}
                      ${date && workouts.length > 0 ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100' : ''}
                      ${date && workouts.length === 0 ? 'bg-white border-gray-200' : ''}
                      ${isToday ? 'ring-2 ring-indigo-500' : ''}
                    `}
                    onClick={() => date && workouts.length > 0 && setSelectedWorkout(workouts[0])}
                  >
                    {date && (
                      <>
                        <div className="text-sm font-medium text-gray-700">
                          {date.getDate()}
                        </div>
                        {workouts.length > 0 && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="text-xs text-center">
                              {getWorkoutIcon(workouts[0].templateKey)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {workoutHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No workouts recorded yet. Start your first workout!
              </div>
            ) : (
              [...workoutHistory]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 20)
                .map((workout, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedWorkout(workout)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getWorkoutIcon(workout.templateKey)}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {formatWorkoutTitle(workout)}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(workout.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {Object.keys(workout.exercises || {}).length} exercises
                        </p>
                        {workout.sessionNotes && (
                          <p className="text-xs text-gray-500 mt-1">Has notes</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Stats View */}
        {viewMode === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Progress Overview
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg per Week</span>
                  <span className="font-bold text-gray-900">{stats.avgWorkoutsPerWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hard Sets (30d)</span>
                  <span className="font-bold text-gray-900">{stats.totalSets} sets</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tonnage (30d)</span>
                  <span className="font-bold text-gray-900">{(stats.totalVolume / 1000).toFixed(1)}k lbs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Intensity (RPE)</span>
                  <span className="font-bold text-gray-900">
                    {stats.avgRPE ? `${stats.avgRPE}/10` : 'No data'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Achievements
              </h4>
              <div className="space-y-3">
                {stats.currentStreak >= 7 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <span className="text-gray-700">Week Warrior - 7+ day streak!</span>
                  </div>
                )}
                {stats.totalWorkouts >= 10 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-gray-700">Committed - 10+ workouts</span>
                  </div>
                )}
                {stats.totalWorkouts >= 50 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <span className="text-gray-700">Elite - 50+ workouts</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Workout Details Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {formatWorkoutTitle(selectedWorkout)}
                </h3>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                {new Date(selectedWorkout.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              {selectedWorkout.bodyweight && (
                <p className="text-sm text-gray-600 mb-4">
                  Bodyweight: {selectedWorkout.bodyweight} lbs
                </p>
              )}

              <div className="space-y-4">
                {Object.entries(selectedWorkout.exercises || {}).map(([exercise, sets]) => (
                  <div key={exercise} className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{exercise}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {sets.map((set, i) => (
                        <span key={i} className="mr-3">
                          Set {i + 1}: {set.weight}lbs × {set.reps}
                        </span>
                      ))}
                    </div>
                    {selectedWorkout.exerciseRPEs?.[exercise] && (
                      <div className="text-sm text-gray-500 mt-1">
                        RPE: {selectedWorkout.exerciseRPEs[exercise]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedWorkout.sessionNotes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-700">{selectedWorkout.sessionNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}