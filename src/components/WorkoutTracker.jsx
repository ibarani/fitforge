/**
 * @fileoverview Main workout tracking component for FitForge.
 * Provides the primary interface for tracking sets, reps, weight, and RPE during workouts.
 * Manages workout state, timer functionality, and integration with backend services.
 * 
 * @module WorkoutTracker
 * @author Igor Barani
 * @copyright 2025 FitForge
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Play, Pause, SkipForward, X, Video, ChevronDown, ChevronUp,
  CheckCircle, Volume2, VolumeX, AlertCircle,
  Clock, TrendingUp, Award, LogOut, User, Bot, Settings, Save, Cloud,
  Activity, Dumbbell
} from "lucide-react";
import logo from "../../logo/Sentre_Icon_Red.svg";
import { WorkoutSelector, ProfileSettingsModal } from "./WorkoutSelector";
import { WorkoutHistory } from "./WorkoutHistory";
import { saveWorkout, testBackendConnection } from "../services/workoutService";

/**
 * @constant {Object<string, string>} EXERCISE_DESCRIPTIONS
 * @description Database of exercise form instructions and technique cues.
 * Maps exercise names to detailed descriptions for proper execution.
 */
const EXERCISE_DESCRIPTIONS = {
  // A & B Workout Exercises
  "Barbell Bench Press": "The cornerstone of chest development. Focus on keeping your shoulder blades retracted and down, creating a slight arch in your upper back. Lower the bar to your mid-chest and press explosively.",
  "Standing Overhead Press": "The ultimate shoulder builder. Keep your core tight and glutes squeezed to prevent arching your lower back. Press the bar in a straight line overhead, moving your head back slightly to clear the path.",
  "Incline Dumbbell Press": "Set the bench to a low incline (around 30 degrees) to target the upper chest fibers while minimizing shoulder strain. Control the weight on the way down for a deep stretch.",
  "Dumbbell Lateral Raises": "To build shoulder width. Raise the dumbbells out to your sides with a slight bend in your elbows, leading with your elbows, until they are at shoulder height.",
  "Ring Dips": "Superior chest and tricep builder. The instability of the rings powerfully engages your stabilizer muscles. Keep your body leaning forward slightly to emphasize chest.",
  "TRX Plank Saw": "From a plank position with feet in TRX straps, rock forward and backward. This creates dynamic instability that forces your entire core to work overtime.",
  "Kettlebell Farmer's March": "Hold heavy kettlebells and march in place with high knees. Maintain perfect posture throughout to build core stability and grip strength.",
  "Pull-Ups": "The king of back-width exercises. Use a full range of motion, pulling your chin over the bar. Focus on initiating the movement with your lats, not your arms.",
  "Bent-Over Barbell Row": "Builds thickness in the entire back. Hinge at your hips, keeping your back flat. Pull the bar towards your lower chest, squeezing your shoulder blades together at the top.",
  "Single-Arm Dumbbell Row": "Isolates each side of your back, correcting imbalances. Place one knee and hand on the bench for support and row the dumbbell up, keeping your elbow close to your body.",
  "Banded Face Pulls": "Crucial for shoulder health and posture. Anchor a band at chest height and pull the ends towards your face, separating your hands as you pull.",
  "Dumbbell Hammer Curls": "Targets the biceps and brachialis muscle for thicker-looking arms. Keep your palms facing each other throughout the movement.",
  "TRX Pike": "From a plank position with your feet in the TRX straps, hinge at your hips and lift them toward the ceiling. The instability forces your entire core to work overtime.",
  "Kettlebell Goblet Squat": "Hold a kettlebell at chest level with both hands. Squat down between your legs while keeping your chest up and core braced.",
  "Seated Dumbbell Press": "Sitting down allows you to focus purely on pressing with your shoulders. Press the dumbbells overhead until your arms are locked out.",
  "TRX Push-Ups": "Face the floor with hands in TRX handles. The instability challenges your chest, shoulders, and core simultaneously.",
  "Dumbbell Flyes": "Use a low incline. This isolates the chest muscles, focusing on the stretch and contraction. Keep a slight bend in your elbows and think of 'hugging a tree'.",
  "Bent-Over Rear Delt Flyes": "Crucial for balanced shoulder development and posture. Hinge at the hips with a flat back and raise the dumbbells out to your sides in a wide arc.",
  "TRX Tricep Extensions": "Face away from the anchor point and lean forward. Extend your arms straight, focusing on squeezing your triceps.",
  "TRX Oblique Crunches": "In a side plank with feet in straps, bring your knees toward your chest. This targets the obliques through dynamic movement.",
  "Kettlebell Swings": "Explosive hip hinge movement. Drive through your hips to swing the kettlebell to shoulder height. This is not a squat - the power comes from your posterior chain.",
  "Barbell Deadlift": "The ultimate full-body pull. Focus on maintaining a flat back and driving through your legs. This builds unparalleled back strength from top to bottom.",
  "T-Bar Row": "Great variation to target the mid-back. Place one end of the barbell in a corner, load the other end, and row with a narrow grip.",
  "Neutral Grip Pull-ups": "Using a neutral grip is often easier on the shoulders. Focus on pulling your elbows down and back to maximize lat engagement.",
  "Dumbbell Shrugs": "To directly target the upper trapezius muscles. Hold heavy dumbbells and shrug your shoulders straight up towards your ears.",
  "Kettlebell Bicep Curls": "The shape of the kettlebell provides a unique challenge for the biceps and forearms. Control the weight through the full range of motion.",
  "TRX Hamstring Runners": "Lie on your back with heels in straps. Lift your hips and perform a running motion. This builds hamstring strength and stability.",
  "Kettlebell Suitcase Carry": "Hold a heavy kettlebell in one hand and walk. Keep your torso perfectly upright to build anti-lateral flexion core strength.",
  
  // Workout C: Leg Day Exercises
  "Barbell Back Squat": "The king of leg exercises. Set the bar on your upper back, keep your chest up, and squat down until your hips are below your knees. This builds foundational strength in your quads, glutes, and hamstrings.",
  "Dumbbell Lunges": "Excellent for targeting each leg individually, correcting imbalances. Step forward and lower your hips until both knees are bent at a 90-degree angle. Push off your front foot to return to the start.",
  "Box Jumps": "Develops explosive power. Land softly on the box in a squat position with your whole foot on the surface. Always step down, never jump down, to protect your joints.",
  
  // Workout D: Core Circuit Exercises
  "TRX Knee Tucks": "From a plank position with your feet in the TRX, pull both knees towards your chest, keeping your core tight. This targets your lower abs with an added stability challenge.",
  "Barbell Landmine Anti-Rotation": "Hold the end of a barbell at your chest and move it from side to side in an arc, resisting the urge to let your torso or hips rotate. This builds incredible anti-rotational strength.",
  "Medicine Ball Slams": "Raise the ball overhead and use your entire body—lats, core, and hips—to slam it into the ground with maximum force. This is a fantastic exercise for developing explosive core power.",
  "BOSU Ball Plank": "Place your hands on the flat side of the BOSU ball and hold a high plank. The unstable surface forces your deep core stabilizer muscles to work overtime.",
  
  // Supplementary Routine Exercises
  "Dead Bug": "Lie on your back and slowly lower your opposite arm and leg toward the floor, keeping your lower back pressed firmly into the mat. This teaches core control and stability.",
  "Bird Dog": "From all fours, extend opposite arm and leg while maintaining a neutral spine. Hold briefly, then return to start. This builds core stability and improves balance.",
  "Plank": "Hold a straight line from head to heels, engaging your core throughout. One of the most effective exercises for building core endurance and stability.",
  "Wall Sit": "Slide down a wall until your thighs are parallel to the ground and hold. This builds quad endurance and mental toughness.",
  "Mountain Climbers": "In a plank position, drive your knees alternately toward your chest at a rapid pace. This combines core stability with cardiovascular conditioning.",
  "Russian Twists": "Sitting with knees bent and feet off the ground, rotate your torso from side to side while holding a weight. This targets the obliques and improves rotational strength.",
  "Hanging Leg Raises": "Hang from a pull-up bar and raise your legs to 90 degrees or higher. This is an advanced exercise for the lower abs and hip flexors.",
  
  // Optional Arms & Shoulders Exercises
  "Barbell Curls": "Stand with feet hip-width apart, grip the barbell with palms facing forward. Curl the weight up while keeping your elbows stationary at your sides.",
  "Cable Tricep Pushdowns": "Using a rope or bar attachment, keep your elbows pinned to your sides and extend your forearms down, squeezing your triceps at the bottom.",
  "Hammer Curls": "Hold dumbbells with a neutral grip (palms facing each other) and curl without rotating your wrists. This targets the brachialis for arm thickness.",
  "Overhead Tricep Extension": "Hold a dumbbell or barbell overhead with arms extended, then lower behind your head by bending only at the elbows. This provides a deep stretch for the triceps.",
  "Cable Lateral Raises": "Using a cable machine provides constant tension throughout the movement. Keep a slight bend in your elbow and raise the cable to shoulder height.",
  
  // Optional Legs & Glutes Exercises
  "Leg Press": "Position yourself in the leg press machine with feet shoulder-width apart. Lower the weight under control and press through your heels to return to the start.",
  "Leg Curls": "Lying or seated, curl your heels toward your glutes, focusing on squeezing your hamstrings at the top of the movement.",
  "Leg Extensions": "Sitting in the machine, extend your legs to full extension, focusing on squeezing your quads at the top. Control the descent.",
  "Calf Raises": "Stand on the balls of your feet and rise up as high as possible, squeezing your calves at the top. Pause briefly before lowering.",
  "Hip Thrusts": "With your upper back on a bench and a barbell across your hips, drive through your heels to lift your hips until your body forms a straight line."
};

/**
 * @constant {Object<string, string>} EXERCISE_VIDEOS
 * @description Database of exercise demonstration video URLs.
 * Maps exercise names to YouTube video links for form reference.
 */
const EXERCISE_VIDEOS = {
  // A & B Workout Videos
  "Barbell Bench Press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  "Standing Overhead Press": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
  "Incline Dumbbell Press": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
  "Dumbbell Lateral Raises": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  "Ring Dips": "https://www.youtube.com/watch?v=2z8JmcrW-As",
  "TRX Plank Saw": "https://www.youtube.com/watch?v=jwRUvXXRqjQ",
  "Kettlebell Farmer's March": "https://www.youtube.com/watch?v=cCFCJCBc1qo",
  "Pull-Ups": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  "Bent-Over Barbell Row": "https://www.youtube.com/watch?v=FWJR5Ve8bnQ",
  "Single-Arm Dumbbell Row": "https://www.youtube.com/watch?v=dFzUjzfih7k",
  "Banded Face Pulls": "https://www.youtube.com/watch?v=rep-qVOkqgk",
  "Dumbbell Hammer Curls": "https://www.youtube.com/watch?v=zC3nLlEvin4",
  "TRX Pike": "https://www.youtube.com/watch?v=ghrE5nBRVOY",
  "Kettlebell Goblet Squat": "https://www.youtube.com/watch?v=CkFmgR0XaZc",
  "Seated Dumbbell Press": "https://www.youtube.com/watch?v=qEwKCR5JCog",
  "TRX Push-Ups": "https://www.youtube.com/watch?v=xOmD_aOTr-Q",
  "Dumbbell Flyes": "https://www.youtube.com/watch?v=eozdVDA78K0",
  "Bent-Over Rear Delt Flyes": "https://www.youtube.com/watch?v=EA7u4Q_8HQ0",
  "TRX Tricep Extensions": "https://www.youtube.com/watch?v=Aw7hDjLkWqo",
  "TRX Oblique Crunches": "https://www.youtube.com/watch?v=7dq3fO1ogKM",
  "Kettlebell Swings": "https://www.youtube.com/watch?v=YSxHifyI6s8",
  "Barbell Deadlift": "https://www.youtube.com/watch?v=op9kVnSso6Q",
  "T-Bar Row": "https://www.youtube.com/watch?v=j3Igk5nyZE4",
  "Neutral Grip Pull-ups": "https://www.youtube.com/watch?v=9xWUyiJWspQ",
  "Dumbbell Shrugs": "https://www.youtube.com/watch?v=cJRVVxmytaM",
  "Kettlebell Bicep Curls": "https://www.youtube.com/watch?v=0DhfBRzRNMI",
  "TRX Hamstring Runners": "https://www.youtube.com/watch?v=J-4EgXRCRLc",
  "Kettlebell Suitcase Carry": "https://www.youtube.com/watch?v=0S_2JiSqCm0",
  
  // Workout C: Leg Day Videos
  "Barbell Back Squat": "https://www.youtube.com/watch?v=Dy28eq2PjcM",
  "Dumbbell Lunges": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
  "Box Jumps": "https://www.youtube.com/watch?v=NBY9-kTuHEk",
  
  // Workout D: Core Circuit Videos
  "TRX Knee Tucks": "https://www.youtube.com/watch?v=BbY2N_wHXAo",
  "Barbell Landmine Anti-Rotation": "https://www.youtube.com/watch?v=T3vhHvHE0M8",
  "Medicine Ball Slams": "https://www.youtube.com/watch?v=Rx9er5kpIcY",
  "BOSU Ball Plank": "https://www.youtube.com/watch?v=ASdvN_XEl_c",
  
  // Supplementary Routine Videos
  "Dead Bug": "https://www.youtube.com/watch?v=g_BYB0R-4Ws",
  "Bird Dog": "https://www.youtube.com/watch?v=wiFNA3sqjCA",
  "Plank": "https://www.youtube.com/watch?v=ASdvN_XEl_c",
  "Wall Sit": "https://www.youtube.com/watch?v=y-wV4Venusw",
  "Mountain Climbers": "https://www.youtube.com/watch?v=nmwgirgXLYM",
  "Russian Twists": "https://www.youtube.com/watch?v=wkD8rjkodUI",
  "Hanging Leg Raises": "https://www.youtube.com/watch?v=Pr1ieGZ5atI",
  
  // Optional Arms & Shoulders Videos
  "Barbell Curls": "https://www.youtube.com/watch?v=kwG2ipFRgfo",
  "Cable Tricep Pushdowns": "https://www.youtube.com/watch?v=2-LAMcpzODU",
  "Hammer Curls": "https://www.youtube.com/watch?v=zC3nLlEvin4",
  "Overhead Tricep Extension": "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q",
  "Cable Lateral Raises": "https://www.youtube.com/watch?v=PPrzBWZDOhA",
  
  // Optional Legs & Glutes Videos
  "Leg Press": "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
  "Leg Curls": "https://www.youtube.com/watch?v=ELOCsoDSmrg",
  "Leg Extensions": "https://www.youtube.com/watch?v=YyvSfVjQeL0",
  "Calf Raises": "https://www.youtube.com/watch?v=gwLzBJYoWlI",
  "Hip Thrusts": "https://www.youtube.com/watch?v=SEdqd1n0cvg"
};

/**
 * @constant {string[]} WEIGHTED_DURATION_EXERCISES
 * @description List of exercises that track both weight and duration.
 * These exercises are typically loaded carries or holds.
 */
const WEIGHTED_DURATION_EXERCISES = [
  "Kettlebell Farmer's March",
  "Kettlebell Suitcase Carry",
  "Farmer's Walk",
  "Farmer's Carry",
  "Suitcase Carry",
  "Overhead Carry",
  "Waiter's Walk"
];

/**
 * @constant {string[]} DURATION_BASED_EXERCISES
 * @description List of exercises that track duration only (no weight).
 * These are typically isometric holds or timed exercises.
 */
const DURATION_BASED_EXERCISES = [
  "Plank",
  "TRX Plank Saw",
  "Wall Sit",
  "Dead Hang",
  "L-Sit",
  "Hollow Body Hold",
  "Flutter Kicks", // Can be either, but often timed
  "Mountain Climbers" // Can be either, but often timed
];

/**
 * @constant {string[]} BODYWEIGHT_EXERCISES
 * @description List of bodyweight exercises that track reps only.
 * Weight field is used for assistance or added weight adjustments.
 */
const BODYWEIGHT_EXERCISES = [
  "Pull-Ups",
  "Push-Ups",
  "TRX Push-Ups",
  "Ring Dips",
  "Dips",
  "Hanging Leg Raises",
  "Dead Bug",
  "Bird Dog",
  "Russian Twists",
  "TRX Pike",
  "TRX Oblique Crunches",
  "TRX Tricep Extensions",
  "Neutral Grip Pull-ups",
  "Air Squats",
  "Burpees",
  "Box Jumps"
];

/**
 * Determines the tracking type for a given exercise.
 * 
 * @function getExerciseType
 * @param {string} exerciseName - Name of the exercise to classify.
 * @returns {'weighted_duration'|'duration'|'bodyweight'|'weighted'} The exercise type.
 * 
 * @example
 * getExerciseType('Plank'); // Returns: 'duration'
 * getExerciseType('Bench Press'); // Returns: 'weighted'
 */
const getExerciseType = (exerciseName) => {
  if (WEIGHTED_DURATION_EXERCISES.some(ex => exerciseName.includes(ex))) {
    return 'weighted_duration';
  } else if (DURATION_BASED_EXERCISES.some(ex => exerciseName.includes(ex))) {
    return 'duration';
  } else if (BODYWEIGHT_EXERCISES.some(ex => exerciseName.includes(ex))) {
    return 'bodyweight';
  }
  return 'weighted';
};

/**
 * @constant {Array<WorkoutTemplate>} DEFAULT_TEMPLATES
 * @description Pre-defined workout templates for the training program.
 * Includes mandatory workouts (A, B, C, D) and optional recovery sessions.
 * 
 * @typedef {Object} WorkoutTemplate
 * @property {string} key - Unique identifier for the workout.
 * @property {string} title - Display name for the workout.
 * @property {boolean} mandatory - Whether this counts toward cycle completion.
 * @property {Array<Exercise>} exercises - List of exercises in the workout.
 * 
 * @typedef {Object} Exercise
 * @property {string} name - Exercise name.
 * @property {number} sets - Number of sets to perform.
 * @property {string} targetReps - Target rep range or duration.
 * @property {number} restTime - Rest time between sets in seconds.
 */
const DEFAULT_TEMPLATES = [
  // MANDATORY WORKOUTS (count toward cycle completion)
  {
    key: "A_push_power",
    title: "Workout A: Push Day (Strength & Power)",
    mandatory: true,
    exercises: [
      { name: "Barbell Bench Press", sets: 4, targetReps: "5", restTime: 120 },
      { name: "Standing Overhead Press", sets: 4, targetReps: "5", restTime: 90 },
      { name: "Incline Dumbbell Press", sets: 3, targetReps: "8-12", restTime: 90 },
      { name: "Dumbbell Lateral Raises", sets: 3, targetReps: "15-20", restTime: 60 },
      { name: "Ring Dips", sets: 3, targetReps: "To Failure", restTime: 90 },
      { name: "TRX Plank Saw", sets: 3, targetReps: "30-45 sec", restTime: 60 },
      { name: "Kettlebell Farmer's March", sets: 3, targetReps: "30-45 sec", restTime: 60 },
    ],
  },
  {
    key: "A_pull_width",
    title: "Workout A: Pull Day (Width & Thickness)",
    mandatory: true,
    exercises: [
      { name: "Pull-Ups", sets: 4, targetReps: "To Failure", restTime: 120 },
      { name: "Bent-Over Barbell Row", sets: 4, targetReps: "5-8", restTime: 90 },
      { name: "Single-Arm Dumbbell Row", sets: 3, targetReps: "8-12 per arm", restTime: 60 },
      { name: "Banded Face Pulls", sets: 3, targetReps: "15-20", restTime: 60 },
      { name: "Dumbbell Hammer Curls", sets: 3, targetReps: "8-12", restTime: 60 },
      { name: "TRX Pike", sets: 3, targetReps: "10-15", restTime: 60 },
      { name: "Kettlebell Goblet Squat", sets: 3, targetReps: "10-12", restTime: 90 },
    ],
  },
  {
    key: "B_push_hyp",
    title: "Workout B: Push Day (Hypertrophy & Definition)",
    mandatory: true,
    exercises: [
      { name: "Seated Dumbbell Press", sets: 4, targetReps: "8-12", restTime: 90 },
      { name: "TRX Push-Ups", sets: 3, targetReps: "To Failure", restTime: 60 },
      { name: "Dumbbell Flyes", sets: 3, targetReps: "12-15", restTime: 60 },
      { name: "Bent-Over Rear Delt Flyes", sets: 3, targetReps: "15-20", restTime: 60 },
      { name: "TRX Tricep Extensions", sets: 3, targetReps: "12-15", restTime: 60 },
      { name: "TRX Oblique Crunches", sets: 3, targetReps: "10-12 per side", restTime: 60 },
      { name: "Kettlebell Swings", sets: 3, targetReps: "15-20", restTime: 90 },
    ],
  },
  {
    key: "B_pull_strength",
    title: "Workout B: Pull Day (Strength & Function)",
    mandatory: true,
    exercises: [
      { name: "Barbell Deadlift", sets: 4, targetReps: "5", restTime: 180 },
      { name: "T-Bar Row", sets: 4, targetReps: "8-10", restTime: 90 },
      { name: "Neutral Grip Pull-ups", sets: 3, targetReps: "To Failure", restTime: 90 },
      { name: "Dumbbell Shrugs", sets: 3, targetReps: "12-15", restTime: 60 },
      { name: "Kettlebell Bicep Curls", sets: 3, targetReps: "10-15", restTime: 60 },
      { name: "TRX Hamstring Runners", sets: 3, targetReps: "10-15", restTime: 60 },
      { name: "Kettlebell Suitcase Carry", sets: 3, targetReps: "30 sec per side", restTime: 60 },
    ],
  },
  // NEW MANDATORY WORKOUTS C & D
  {
    key: "C_leg_day",
    title: "Workout C: Leg Day (Foundation & Power)",
    mandatory: true,
    exercises: [
      { name: "Barbell Back Squat", sets: 4, targetReps: "6-8", restTime: 180 },
      { name: "Dumbbell Lunges", sets: 3, targetReps: "10-12 per leg", restTime: 90 },
      { name: "Kettlebell Swings", sets: 4, targetReps: "15-20", restTime: 90 },
      { name: "Kettlebell Goblet Squat", sets: 3, targetReps: "10-12", restTime: 90 },
      { name: "Box Jumps", sets: 3, targetReps: "5", restTime: 120 },
    ],
  },
  {
    key: "D_core_circuit",
    title: "Workout D: Core Overload Circuit",
    mandatory: true,
    exercises: [
      { name: "TRX Knee Tucks", sets: 3, targetReps: "15", restTime: 90 },
      { name: "Barbell Landmine Anti-Rotation", sets: 3, targetReps: "10 per side", restTime: 90 },
      { name: "Medicine Ball Slams", sets: 3, targetReps: "12", restTime: 90 },
      { name: "BOSU Ball Plank", sets: 3, targetReps: "45 sec", restTime: 90 },
      { name: "Kettlebell Suitcase Carry", sets: 3, targetReps: "30 sec per side", restTime: 90 },
    ],
  },
  
  // OPTIONAL/SUPPLEMENTARY WORKOUT (does not count toward cycle completion)
  // This is a recovery/mobility focused routine perfect for rest days
  {
    key: "optional_core_activation",
    title: "Optional: Core Activation & Full Body Stretch",
    mandatory: false,
    exercises: [
      { name: "Dead Bug", sets: 2, targetReps: "10 per side", restTime: 45 },
      { name: "Bird Dog", sets: 2, targetReps: "10 per side", restTime: 45 },
      { name: "Plank", sets: 2, targetReps: "45-60 sec", restTime: 60 },
      { name: "Wall Sit", sets: 2, targetReps: "30-60 sec", restTime: 60 },
      { name: "Mountain Climbers", sets: 2, targetReps: "30 sec", restTime: 45 },
    ],
  },
];

/**
 * Custom hook for managing the rest timer functionality.
 * Provides countdown timer with audio alerts and control functions.
 * 
 * @function useTimer
 * @returns {Object} Timer state and control functions.
 * @returns {number} returns.seconds - Current seconds remaining.
 * @returns {boolean} returns.isRunning - Whether timer is active.
 * @returns {Function} returns.startTimer - Start timer with specified seconds.
 * @returns {Function} returns.pauseTimer - Pause the timer.
 * @returns {Function} returns.resumeTimer - Resume paused timer.
 * @returns {Function} returns.stopTimer - Stop and reset timer.
 * @returns {boolean} returns.soundEnabled - Whether audio alerts are enabled.
 * @returns {Function} returns.setSoundEnabled - Toggle audio alerts.
 * 
 * @example
 * const { seconds, isRunning, startTimer } = useTimer();
 * startTimer(90); // Start 90-second timer
 */
const useTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioContextRef.current = new Ctx();
    }
  }, []);

  const playBeep = useCallback((frequency = 800, duration = 200) => {
    if (!audioContextRef.current || !soundEnabled) return;
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
    } catch (e) {
      // Audio may fail before a user gesture; ignore.
      console.log('Audio error:', e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        const newSeconds = s - 1;
        if (newSeconds <= 5 && newSeconds > 0) {
          playBeep(800, 150);
        } else if (newSeconds === 0) {
          playBeep(1200, 500);
          setIsRunning(false);
        }
        return Math.max(0, newSeconds);
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, playBeep]);

  const startTimer = useCallback((sec) => {
    setSeconds(sec);
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => setIsRunning(false), []);
  const resumeTimer = useCallback(() => setIsRunning(true), []);
  const stopTimer = useCallback(() => {
    setSeconds(0);
    setIsRunning(false);
  }, []);

  return {
    seconds,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    soundEnabled,
    setSoundEnabled
  };
};

/**
 * Visual scale component for rating perceived exertion (RPE).
 * Displays a color-coded 1-10 scale for exercise difficulty assessment.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.exerciseName - Name of the exercise being rated.
 * @param {Function} props.onSelect - Callback when RPE value is selected.
 * @param {number} [props.value] - Current RPE value (1-10).
 * @returns {React.ReactElement} The RPE visual scale component.
 * 
 * @example
 * <RPEVisualScale
 *   exerciseName="Bench Press"
 *   value={8}
 *   onSelect={(rpe) => setRPE(rpe)}
 * />
 */
const RPEVisualScale = ({ exerciseName, onSelect, value }) => {
  const [hoveredValue, setHoveredValue] = useState(null);

  const getColor = (val) => {
    const colors = [
      '#059669', '#10b981', '#34d399', '#84cc16', '#eab308',
      '#f59e0b', '#f97316', '#ea580c', '#dc2626', '#991b1b'
    ];
    return colors[val - 1];
  };

  const getLabel = (val) => {
    const labels = [
      'Very Easy', 'Easy', 'Moderate', 'Somewhat Hard', 'Hard',
      'Harder', 'Very Hard', 'Very Hard+', 'Extremely Hard', 'Maximum'
    ];
    return labels[val - 1];
  };

  const getDescription = (val) => {
    const descriptions = [
      'Barely any effort', 'Light warmup', 'Comfortable pace', 'Breathing harder', 'Challenging but doable',
      'Can still talk', '3-4 reps left', '2 reps left', '1 rep left', 'Complete failure'
    ];
    return descriptions[val - 1];
  };

  const displayValue = hoveredValue || value;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mt-4">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">
        How hard was {exerciseName}?
      </h4>

      <div className="space-y-4">
        <div className="relative">
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => {
              const val = i + 1;
              const isSelected = val === value;
              const isHovered = val === hoveredValue;

              return (
                <button
                  key={val}
                  onMouseEnter={() => setHoveredValue(val)}
                  onMouseLeave={() => setHoveredValue(null)}
                  onClick={() => onSelect(val)}
                  className={`flex-1 h-24 rounded-lg transition-all transform ${
                    isSelected ? 'scale-105 ring-2 ring-white ring-offset-2' : ''
                  } ${isHovered ? 'scale-110' : ''}`}
                  style={{
                    backgroundColor: getColor(val),
                    opacity: (!value && !hoveredValue) || val === displayValue ? 1 : 0.4
                  }}
                >
                  <div className="h-full flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-bold">{val}</span>
                    {(isSelected || isHovered) && (
                      <span className="text-xs mt-1">{getLabel(val)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-2 px-2">
            <span className="text-xs text-gray-600">Easy</span>
            <span className="text-xs text-gray-600">Moderate</span>
            <span className="text-xs text-gray-600">Hard</span>
            <span className="text-xs text-gray-600">Maximum</span>
          </div>
        </div>

        {displayValue && (
          <div className="text-center p-4 bg-white rounded-xl">
            <div className="text-3xl font-bold mb-2" style={{ color: getColor(displayValue) }}>
              RPE {displayValue}
            </div>
            <div className="text-lg font-medium text-gray-800">{getLabel(displayValue)}</div>
            <div className="text-sm text-gray-600">{getDescription(displayValue)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Timer bar component for rest period management.
 * Provides countdown display and timer controls with preset options.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {number} props.seconds - Current seconds remaining.
 * @param {boolean} props.isRunning - Whether timer is running.
 * @param {Function} props.onPause - Pause timer callback.
 * @param {Function} props.onResume - Resume timer callback.
 * @param {Function} props.onStop - Stop timer callback.
 * @param {boolean} props.soundEnabled - Whether audio alerts are enabled.
 * @param {Function} props.setSoundEnabled - Toggle audio alerts.
 * @param {Function} props.onStartTimer - Start timer with duration.
 * @param {number} props.currentExerciseRestTime - Default rest time for current exercise.
 * @returns {React.ReactElement} The timer bar component.
 */
const TimerBar = ({ seconds, isRunning, onPause, onResume, onStop, soundEnabled, setSoundEnabled, onStartTimer, currentExerciseRestTime }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds <= 5 && seconds > 0;

  const adjustTime = (adjustment) => {
    const newTime = Math.max(0, seconds + adjustment);
    onStartTimer(newTime);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
      {/* Mobile Layout */}
      <div className="sm:hidden">
        {/* Timer Display Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" />
            <div>
              <div className="text-xs opacity-90">Rest Timer</div>
              <div className={`text-2xl font-mono font-bold ${isWarning ? 'animate-pulse' : ''}`}>
                {minutes}:{secs.toString().padStart(2, '0')}
              </div>
            </div>
          </div>
          
          {/* Quick Adjust Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustTime(-30)}
              className="px-3 py-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors text-sm font-medium min-w-[48px]"
              title="Subtract 30 seconds"
            >
              -30s
            </button>
            <button
              onClick={() => adjustTime(30)}
              className="px-3 py-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors text-sm font-medium min-w-[48px]"
              title="Add 30 seconds"
            >
              +30s
            </button>
          </div>
        </div>
        
        {/* Control Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {isRunning ? (
              <>
                <button
                  onClick={onPause}
                  className="flex-1 px-3 py-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <Pause className="w-4 h-4" />
                  <span className="text-sm">Pause</span>
                </button>
                <button
                  onClick={onStop}
                  className="flex-1 px-3 py-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Stop</span>
                </button>
              </>
            ) : seconds > 0 ? (
              <>
                <button
                  onClick={onResume}
                  className="flex-1 px-3 py-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Resume</span>
                </button>
                <button
                  onClick={onStop}
                  className="flex-1 px-3 py-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Clear</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onStartTimer(currentExerciseRestTime || 90)}
                className="flex-1 px-3 py-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors min-h-[44px]"
                title={`Start timer (${currentExerciseRestTime || 90}s)`}
              >
                <span className="text-sm font-medium">Start ({currentExerciseRestTime || 90}s)</span>
              </button>
            )}
          </div>
          
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white/20 rounded-lg active:bg-white/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Clock className="w-6 h-6" />
          <div>
            <div className="text-sm opacity-90">Rest Timer</div>
            <div className={`text-3xl font-mono font-bold ${isWarning ? 'animate-pulse' : ''}`}>
              {minutes}:{secs.toString().padStart(2, '0')}
            </div>
          </div>
          
          {/* Time Adjustment Buttons */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => adjustTime(-30)}
              className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors text-sm"
              title="Subtract 30 seconds"
            >
              -30s
            </button>
            <button
              onClick={() => adjustTime(30)}
              className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors text-sm"
              title="Add 30 seconds"
            >
              +30s
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Time Buttons */}
          <div className="flex items-center gap-1 mr-2">
            {[30, 60, 90, 120].map((time) => (
              <button
                key={time}
                onClick={() => onStartTimer(time)}
                className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors text-sm font-medium"
                title={`Set timer to ${time} seconds`}
              >
                {time}s
              </button>
            ))}
          </div>

          {/* Control Buttons */}
          {isRunning ? (
            <>
              <button
                onClick={onPause}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={onStop}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Stop
              </button>
            </>
          ) : seconds > 0 ? (
            <>
              <button
                onClick={onResume}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
              <button
                onClick={onStop}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </>
          ) : (
            <div className="text-sm opacity-75">Ready - select time or complete a set</div>
          )}
          
          {/* Reset Button */}
          <button
            onClick={() => onStartTimer(currentExerciseRestTime || 90)}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
            title={`Reset to default (${currentExerciseRestTime || 90}s)`}
          >
            Reset
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Exercise row component for tracking individual exercise performance.
 * Displays exercise info, set inputs, and RPE rating interface.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {Exercise} props.exercise - Exercise configuration object.
 * @param {Array<Set>} props.sets - Array of set data.
 * @param {Function} props.onUpdateSet - Callback to update set data.
 * @param {Function} props.onSkipExercise - Callback to skip exercise.
 * @param {Array<Set>} [props.previousSets=[]] - Previous workout's sets for reference.
 * @param {number} [props.exerciseRPE] - Current RPE rating for exercise.
 * @param {Function} props.onSetExerciseRPE - Callback to set RPE rating.
 * @returns {React.ReactElement} The exercise row component.
 * 
 * @typedef {Object} Set
 * @property {string} weight - Weight used for the set.
 * @property {string} reps - Repetitions performed.
 * @property {string} [duration] - Duration for timed exercises.
 * @property {string} [comment] - Optional note for the set.
 */
const ExerciseRow = ({
  exercise,
  sets,
  onUpdateSet,
  onSkipExercise,
  previousSets = [],
  exerciseRPE,
  onSetExerciseRPE
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showRPEScale, setShowRPEScale] = useState(false);
  const videoUrl = EXERCISE_VIDEOS[exercise.name];
  const formDescription = EXERCISE_DESCRIPTIONS[exercise.name];

  const completedSets = sets.filter(s => s.weight && s.reps).length;
  const isComplete = completedSets === exercise.sets;

  useEffect(() => {
    if (isComplete && !exerciseRPE) {
      setShowRPEScale(true);
    } else {
      setShowRPEScale(false);
    }
  }, [isComplete, exerciseRPE]);

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
      isComplete ? 'ring-2 ring-green-500' : ''
    }`}>
      {/* Exercise Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center gap-3 text-left"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
              isComplete ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              {isComplete ? <CheckCircle className="w-6 h-6" /> : `${completedSets}/${exercise.sets}`}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{exercise.name}</h3>
              <p className="text-sm text-gray-500">
                Target: {exercise.targetReps} reps • {exercise.sets} sets • Rest: {exercise.restTime}s
                {exerciseRPE && <span className="ml-2 font-medium text-indigo-600">• RPE {exerciseRPE}</span>}
              </p>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          <div className="flex items-center gap-2 ml-4">
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors leading-none"
                title="Watch form video"
              >
                <Video className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={() => onSkipExercise(exercise.name)}
              className="inline-flex items-center justify-center p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors leading-none"
              title="Skip exercise"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sets Table & Form Description */}
      {expanded && (
        <div className="p-4">
          {formDescription && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Form & Function</h4>
              <p className="text-sm text-blue-800 leading-relaxed">{formDescription}</p>
            </div>
          )}

          <div className="space-y-2">
            {sets.map((set, i) => {
              const previousSet = previousSets[i];
              const exerciseType = getExerciseType(exercise.name);
              const isSetComplete = exerciseType === 'weighted_duration'
                ? set.weight && set.duration
                : exerciseType === 'duration' 
                  ? set.duration 
                  : exerciseType === 'bodyweight'
                    ? set.weight && set.reps
                    : set.weight && set.reps;

              return (
                <div key={i} className={`grid grid-cols-8 gap-3 p-3 rounded-xl ${
                  isSetComplete ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className="col-span-1 flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSetComplete ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                  </div>

                  {exerciseType === 'weighted_duration' ? (
                    <>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => onUpdateSet(i, { ...set, weight: e.target.value })}
                          placeholder="Weight"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-medium"
                        />
                        {previousSet && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            prev: {previousSet.weight}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={set.duration || ''}
                          onChange={(e) => onUpdateSet(i, { ...set, duration: e.target.value })}
                          placeholder="Seconds"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-medium"
                        />
                        {previousSet && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            prev: {previousSet.duration}s
                          </div>
                        )}
                      </div>
                    </>
                  ) : exerciseType === 'duration' ? (
                    <>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.duration || ''}
                          onChange={(e) => onUpdateSet(i, { ...set, duration: e.target.value })}
                          placeholder="Duration (seconds)"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-medium"
                        />
                        {previousSet && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            prev: {previousSet.duration}s
                          </div>
                        )}
                      </div>
                    </>
                  ) : exerciseType === 'bodyweight' ? (
                    <>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => onUpdateSet(i, { ...set, weight: e.target.value })}
                          placeholder="BW"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-medium"
                          title="Bodyweight (adjust for assistance or added weight)"
                        />
                        {previousSet && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            prev: {previousSet.weight}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => onUpdateSet(i, { ...set, reps: e.target.value })}
                          placeholder="Reps"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-medium"
                        />
                        {previousSet && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            prev: {previousSet.reps}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => onUpdateSet(i, { ...set, weight: e.target.value })}
                          placeholder="Weight"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-medium"
                        />
                        {previousSet && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            prev: {previousSet.weight}
                          </div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => onUpdateSet(i, { ...set, reps: e.target.value })}
                          placeholder="Reps"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-medium"
                        />
                        {previousSet && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            prev: {previousSet.reps}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={set.comment || ''}
                      onChange={(e) => onUpdateSet(i, { ...set, comment: e.target.value })}
                      placeholder="Notes (optional)"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* RPE Visual Scale - Shows after all sets complete */}
          {showRPEScale && (
            <RPEVisualScale
              exerciseName={exercise.name}
              value={exerciseRPE}
              onSelect={(value) => {
                onSetExerciseRPE?.(exercise.name, value);
                setShowRPEScale(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Completion summary component displayed after workout completion.
 * Shows workout statistics, RPE summary, and session notes input.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {Object<string, Array<Set>>} props.workoutData - All exercise sets data.
 * @param {WorkoutTemplate} props.template - Current workout template.
 * @param {string} props.sessionNotes - Session notes text.
 * @param {Function} props.onUpdateNotes - Callback to update notes.
 * @param {Object<string, number>} props.exerciseRPEs - RPE ratings by exercise.
 * @returns {React.ReactElement} The completion summary component.
 */
const CompletionSummary = ({ workoutData, template, sessionNotes, onUpdateNotes, exerciseRPEs }) => {
  const totalVolume = Object.entries(workoutData).reduce((total, [exerciseName, sets]) => {
    return total + sets.reduce((sum, set) => {
      return sum + (set.weight && set.reps ? parseFloat(set.weight) * parseInt(set.reps, 10) : 0);
    }, 0);
  }, 0);

  const completedSets = Object.values(workoutData).flat().filter(s => {
    return (s.weight && s.reps) || s.duration || (s.weight && s.duration);
  }).length;
  const totalSets = template.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  const avgRPE = (() => {
    const rpes = Object.values(exerciseRPEs).filter(v => v);
    return rpes.length > 0 ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—';
  })();

  return (
    <div className="space-y-6 mt-8">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-8 text-center shadow-xl">
        <Award className="w-16 h-16 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Workout Complete!</h2>
        <p className="text-lg opacity-90">Great job finishing your session</p>
      </div>

      {/* Session Stats */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          Session Stats
        </h3>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="text-3xl font-bold text-indigo-600">{completedSets}</div>
            <div className="text-sm text-gray-600 mt-1">Sets Completed</div>
            <div className="text-xs text-gray-500 mt-1">out of {totalSets}</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600">{totalVolume.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">Total Volume</div>
            <div className="text-xs text-gray-500 mt-1">pounds lifted</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
            <div className="text-3xl font-bold text-orange-600">{avgRPE}</div>
            <div className="text-sm text-gray-600 mt-1">Average RPE</div>
            <div className="text-xs text-gray-500 mt-1">perceived effort</div>
          </div>
        </div>

        {/* Exercise RPE Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">Exercise Difficulty</h4>
          <div className="space-y-2">
            {template.exercises.map(ex => {
              const rpe = exerciseRPEs[ex.name];
              if (!rpe) return null;

              return (
                <div key={ex.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-red-500"
                        style={{ width: `${rpe * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {rpe}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Session Notes */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <label className="block text-lg font-semibold text-gray-800 mb-3">Session Notes</label>
        <textarea
          value={sessionNotes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          rows={4}
          placeholder="How did the workout go? Any pain, form notes, energy levels..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
};

/**
 * Main workout tracking component for the FitForge application.
 * Manages the complete workout session including exercise tracking,
 * timer management, progress monitoring, and data persistence.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.userId - Authenticated user's email/ID.
 * @param {Function} props.onLogout - Logout callback function.
 * @returns {React.ReactElement} The main workout tracker interface.
 * 
 * @example
 * <WorkoutTracker
 *   userId="user@example.com"
 *   onLogout={handleLogout}
 * />
 */
export default function WorkoutTracker({ userId, onLogout }) {
  const [templates] = useState(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [workoutData, setWorkoutData] = useState({});
  const [previousWorkout, setPreviousWorkout] = useState({});
  const [skippedExercises, setSkippedExercises] = useState([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [exerciseRPEs, setExerciseRPEs] = useState({});
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [isOptionalWorkout, setIsOptionalWorkout] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeView, setActiveView] = useState('workout'); // 'workout' or 'history'
  const [includeInAnalysis, setIncludeInAnalysis] = useState(() => {
    const saved = localStorage.getItem('includeInAnalysis');
    if (saved) return JSON.parse(saved);
    // Default: all mandatory workouts included, optional excluded
    const defaults = {};
    templates.forEach(t => {
      defaults[t.key] = t.mandatory; // true for mandatory, false for optional
    });
    return defaults;
  });
  const [cycleProgress, setCycleProgress] = useState(() => {
    const saved = localStorage.getItem('current_cycle');
    return saved ? JSON.parse(saved) : { completed: [] };
  });
  const [useVisualSelector, setUseVisualSelector] = useState(() => {
    const saved = localStorage.getItem('useVisualSelector');
    return saved !== null ? JSON.parse(saved) : true; // Default to new visual selector
  });
  const [backendConnected, setBackendConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

  const { seconds, isRunning, startTimer, pauseTimer, resumeTimer, stopTimer, soundEnabled, setSoundEnabled } = useTimer();
  
  // Test backend connection on mount
  useEffect(() => {
    testBackendConnection().then(connected => {
      setBackendConnected(connected);
      if (connected) {
        console.log('Backend connection established');
      } else {
        console.log('Backend not available - using local storage');
      }
    });
  }, []);

  const template = templates[activeTemplate];
  
  // Compute default rest time for Reset based on most recently touched exercise
  const currentExerciseRestTime = useMemo(() => {
    const exercisesWithData = template.exercises.filter(ex => {
      const sets = workoutData[ex.name] || [];
      return sets.some(s => s.weight || s.reps);
    });
    if (exercisesWithData.length > 0) {
      return exercisesWithData[exercisesWithData.length - 1].restTime || 90;
    }
    return template.exercises[0]?.restTime || 90;
  }, [template.exercises, workoutData]);

  // Initialize workout data when template changes
  useEffect(() => {
    const initData = {};
    template.exercises.forEach(ex => {
      if (!workoutData[ex.name]) {
        const exerciseType = getExerciseType(ex.name);
        if (exerciseType === 'weighted_duration') {
          initData[ex.name] = Array.from({ length: ex.sets }, () => ({ weight: '', duration: '', comment: '' }));
        } else if (exerciseType === 'duration') {
          initData[ex.name] = Array.from({ length: ex.sets }, () => ({ duration: '', comment: '' }));
        } else if (exerciseType === 'bodyweight') {
          // Initialize with bodyweight value if available
          initData[ex.name] = Array.from({ length: ex.sets }, () => ({ 
            weight: bodyweight || '', 
            reps: '', 
            comment: '' 
          }));
        } else {
          initData[ex.name] = Array.from({ length: ex.sets }, () => ({ weight: '', reps: '', comment: '' }));
        }
      }
    });
    if (Object.keys(initData).length > 0) {
      setWorkoutData(prev => ({ ...prev, ...initData }));
    }

    // Load previous workout
    try {
      const saved = localStorage.getItem(`workout_${template.key}`);
      if (saved) setPreviousWorkout(JSON.parse(saved));
      else setPreviousWorkout({});
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.key]);

  // Update bodyweight exercises when bodyweight changes
  useEffect(() => {
    if (bodyweight) {
      const updatedData = {};
      template.exercises.forEach(ex => {
        const exerciseType = getExerciseType(ex.name);
        if (exerciseType === 'bodyweight' && workoutData[ex.name]) {
          // Update all sets with the new bodyweight, preserving existing reps and comments
          updatedData[ex.name] = workoutData[ex.name].map(set => ({
            ...set,
            weight: set.weight || bodyweight // Only update if not already customized
          }));
        }
      });
      if (Object.keys(updatedData).length > 0) {
        setWorkoutData(prev => ({ ...prev, ...updatedData }));
      }
    }
  }, [bodyweight]);

  // Autosave on data change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (Object.keys(workoutData).length > 0) {
        const dataToSave = {
          date: workoutDate,
          bodyweight,
          notes: sessionNotes,
          exercises: workoutData,
          exerciseRPEs,
          skipped: skippedExercises,
          timestamp: Date.now()
        };

        try {
          localStorage.setItem(`workout_current_${template.key}`, JSON.stringify(dataToSave));

          if (workoutComplete) {
            localStorage.setItem(`workout_${template.key}`, JSON.stringify(workoutData));
            localStorage.setItem(`workout_complete_${Date.now()}`, JSON.stringify(dataToSave));
            
            // Try to save to backend if user is authenticated
            if (userId && backendConnected && typeof getCurrentUser === 'function') {
              setSaveStatus('saving');
              // Use async IIFE to handle await
              (async () => {
                try {
                  const user = await getCurrentUser();
                  if (user && user.signInUserSession) {
                    const idToken = user.signInUserSession.idToken.jwtToken;
                    await saveWorkout(dataToSave, userId, idToken);
                    console.log('Workout saved to backend successfully');
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 3000);
                  }
                } catch (backendError) {
                  console.error('Failed to save to backend:', backendError);
                  setSaveStatus('error');
                  setTimeout(() => setSaveStatus('idle'), 5000);
                  // Workout is already saved to localStorage as backup
                }
              })();
            }
          }
        } catch {
          // storage full or denied
        }
      }
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [workoutData, exerciseRPEs, sessionNotes, bodyweight, skippedExercises, workoutComplete, template.key, workoutDate]);

  // Check if workout is complete
  useEffect(() => {
    const allExercisesComplete = template.exercises.every(ex => {
      const sets = workoutData[ex.name] || [];
      const completedSets = sets.filter(s => s.weight && s.reps).length;
      return completedSets === ex.sets || skippedExercises.includes(ex.name);
    });

    const allRPEsRecorded = template.exercises.every(ex => {
      return exerciseRPEs[ex.name] || skippedExercises.includes(ex.name);
    });

    setWorkoutComplete(allExercisesComplete && allRPEsRecorded);
  }, [workoutData, exerciseRPEs, skippedExercises, template.exercises]);

  // Check cycle completion based on selected workouts for analysis
  useEffect(() => {
    if (!workoutComplete) return;
    
    // Check if this workout is included in analysis
    const isIncluded = (template.mandatory && includeInAnalysis[template.key] !== false) || 
                      (!template.mandatory && includeInAnalysis[template.key] === true);
    
    if (!isIncluded) return;
    
    // Get all workouts selected for analysis
    const selectedWorkouts = templates
      .filter(t => 
        (t.mandatory && includeInAnalysis[t.key] !== false) || 
        (!t.mandatory && includeInAnalysis[t.key] === true)
      )
      .map(t => t.key);
    
    const currentCycle = localStorage.getItem('current_cycle') ? 
      JSON.parse(localStorage.getItem('current_cycle')) : 
      { completed: [], selectedWorkouts: selectedWorkouts };
    
    // Update selected workouts if they changed
    if (JSON.stringify(currentCycle.selectedWorkouts) !== JSON.stringify(selectedWorkouts)) {
      // Reset cycle if selection changed
      currentCycle.completed = [];
      currentCycle.selectedWorkouts = selectedWorkouts;
    }
    
    if (!currentCycle.completed.includes(template.key)) {
      currentCycle.completed.push(template.key);
      setCycleProgress({ completed: currentCycle.completed });
      
      // Check if all selected workouts are complete
      const allSelectedComplete = selectedWorkouts.every(key => 
        currentCycle.completed.includes(key)
      );
      
      if (allSelectedComplete && selectedWorkouts.length > 0) {
        console.log('Cycle Complete! Ready for AI analysis');
        
        // Trigger AI analysis here
        const cycleData = {
          date: new Date().toISOString(),
          workouts: currentCycle.completed,
          selectedWorkouts: selectedWorkouts,
          userId: userId
        };
        
        localStorage.setItem('cycle_complete', JSON.stringify(cycleData));
        localStorage.setItem('current_cycle', JSON.stringify({ 
          completed: [], 
          selectedWorkouts: selectedWorkouts 
        }));
        setCycleProgress({ completed: [] });
        
        // Create workout list for message
        const workoutNames = currentCycle.completed
          .map(key => {
            const t = templates.find(tmpl => tmpl.key === key);
            return t ? t.title.replace('Workout ', '').split(':')[0] : key;
          })
          .join(', ');
        
        // TODO: Call API to trigger Claude analysis
        alert(`🎉 Congratulations! You completed your ${selectedWorkouts.length}-workout training cycle (${workoutNames})! AI analysis will provide recommendations for your next cycle.`);
      } else {
        localStorage.setItem('current_cycle', JSON.stringify(currentCycle));
      }
    }
  }, [workoutComplete, template, includeInAnalysis, templates, userId, setCycleProgress]);

  const updateSet = useCallback((exerciseName, setIndex, data) => {
    setWorkoutData(prev => {
      const newData = { ...prev };
      newData[exerciseName] = [...(newData[exerciseName] || [])];
      newData[exerciseName][setIndex] = data;

      // Auto-start timer when both weight and reps are entered
      if (data.weight && data.reps && !isRunning) {
        const exercise = template.exercises.find(e => e.name === exerciseName);
        if (exercise) {
          startTimer(exercise.restTime || 90);
        }
      }
      return newData;
    });
  }, [template.exercises, isRunning, startTimer]);

  const skipExercise = (exerciseName) => {
    setSkippedExercises(prev => (prev.includes(exerciseName) ? prev : [...prev, exerciseName]));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="FitForge Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl sm:text-2xl text-gray-800">
                Igor&apos;s <span className="font-black">Workouts</span>
              </h1>
            </div>
            
            {/* Right side - Settings and User Info */}
            <div className="flex items-center gap-2">
              {/* Settings Button */}
              <button
                onClick={() => setShowProfileSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profile Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                {/* Backend Connection Status */}
                <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg ${
                  backendConnected 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <Cloud className={`w-4 h-4 ${
                    backendConnected ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  {saveStatus === 'saving' && (
                    <span className="text-xs font-medium text-blue-600">Saving...</span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-xs font-medium text-green-600">Saved</span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-xs font-medium text-red-600">Error</span>
                  )}
                  {saveStatus === 'idle' && (
                    <span className={`text-xs font-medium ${
                      backendConnected ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {backendConnected ? 'Online' : 'Offline'}
                    </span>
                  )}
                </div>
                
                {/* AI Indicator */}
                {Object.keys(aiSuggestions).length > 0 && (
                  <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">AI</span>
                  </div>
                )}
              </div>
              
              {/* User Menu */}
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-3 border-t pt-3">
            <button
              onClick={() => setActiveView('workout')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'workout'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Workout
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      </header>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        includeInAnalysis={includeInAnalysis}
        setIncludeInAnalysis={setIncludeInAnalysis}
        templates={templates}
        useVisualSelector={useVisualSelector}
        setUseVisualSelector={setUseVisualSelector}
      />

      {/* Main Content */}
      {activeView === 'history' ? (
        <WorkoutHistory userId={userId} />
      ) : (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Workout Selector - Toggle between new visual and classic dropdown */}
        {useVisualSelector ? (
          <>
            {/* New Visual Workout Selector */}
            <WorkoutSelector
              templates={templates}
              activeTemplate={activeTemplate}
              setActiveTemplate={setActiveTemplate}
              cycleProgress={cycleProgress}
              includeInAnalysis={includeInAnalysis}
            />
          </>
        ) : (
          <>
            {/* Classic Dropdown Selector */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700">Select Workout:</label>
                  <select
                    value={activeTemplate}
                    onChange={(e) => setActiveTemplate(parseInt(e.target.value, 10))}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none bg-gray-50 font-medium"
                  >
                    {templates.map((t, i) => (
                      <option key={t.key} value={i}>{t.title}</option>
                    ))}
                  </select>
                </div>
                
                {/* Cycle Progress for Classic View */}
                <div className="text-sm text-gray-600">
                  Cycle Progress: <span className="font-bold text-indigo-600">
                    {cycleProgress.completed.length}/
                    {templates.filter(t => 
                      (t.mandatory && includeInAnalysis[t.key] !== false) || 
                      (!t.mandatory && includeInAnalysis[t.key] === true)
                    ).length} Complete
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Current Workout Title - Shows which workout is selected */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{template.title}</h2>
              <p className="text-sm text-gray-500">
                {template.exercises.length} exercises • {template.mandatory ? 'Mandatory' : 'Optional Recovery'}
              </p>
            </div>
            {/* Show analysis status for optional workouts */}
            {!template.mandatory && (
              <div className="text-sm text-gray-500">
                {includeInAnalysis[template.key] ? 
                  '✓ Included in analysis' : 
                  'Not tracked for analysis'
                }
              </div>
            )}
          </div>
        </div>
        
        {/* Session Info & Timer */}
        <div className="space-y-4 mb-8">
          {/* Date & Bodyweight */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bodyweight</label>
                <input
                  type="text"
                  value={bodyweight}
                  onChange={(e) => setBodyweight(e.target.value)}
                  placeholder="lbs / kg"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Timer Bar */}
          <TimerBar
            seconds={seconds}
            isRunning={isRunning}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onStop={stopTimer}
            onStartTimer={startTimer}
            currentExerciseRestTime={currentExerciseRestTime}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />
        </div>

        {/* Skipped Exercises Alert */}
        {skippedExercises.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">Skipped Exercises</p>
                <p className="text-sm text-yellow-700 mt-1">
                  {skippedExercises.join(', ')}
                </p>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-yellow-700">Add to next session</span>
                </label>
              </div>
              <button
                onClick={() => setSkippedExercises([])}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-4">
          {template.exercises.map((exercise) => (
            <div key={exercise.name}>
              <ExerciseRow
                exercise={exercise}
                sets={
                  workoutData[exercise.name]
                  || (() => {
                    const exerciseType = getExerciseType(exercise.name);
                    if (exerciseType === 'weighted_duration') {
                      return Array.from({ length: exercise.sets }, () => ({ weight: '', duration: '', comment: '' }));
                    } else if (exerciseType === 'duration') {
                      return Array.from({ length: exercise.sets }, () => ({ duration: '', comment: '' }));
                    } else if (exerciseType === 'bodyweight') {
                      return Array.from({ length: exercise.sets }, () => ({ 
                        weight: bodyweight || '', 
                        reps: '', 
                        comment: '' 
                      }));
                    } else {
                      return Array.from({ length: exercise.sets }, () => ({ weight: '', reps: '', comment: '' }));
                    }
                  })()
                }
                previousSets={previousWorkout[exercise.name]}
                exerciseRPE={exerciseRPEs[exercise.name]}
                onUpdateSet={(setIndex, data) => updateSet(exercise.name, setIndex, data)}
                onSkipExercise={skipExercise}
                onSetExerciseRPE={(name, value) =>
                  setExerciseRPEs(prev => ({ ...prev, [name]: value }))
                }
              />
            </div>
          ))}
        </div>

        {/* Completion Summary - Only shows when workout is complete */}
        {workoutComplete && (
          <CompletionSummary
            workoutData={workoutData}
            template={template}
            sessionNotes={sessionNotes}
            onUpdateNotes={setSessionNotes}
            exerciseRPEs={exerciseRPEs}
          />
        )}
      </div>
      )}
    </div>
  );
}