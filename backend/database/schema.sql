-- PostgreSQL Schema for FitForge
-- Deploy on AWS RDS

-- Users table (managed by Cognito, this is for reference/profile data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training cycles
CREATE TABLE cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workouts
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
    template_key VARCHAR(50) NOT NULL,
    workout_date DATE NOT NULL,
    bodyweight DECIMAL(5,2),
    session_notes TEXT,
    is_optional BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise sets
CREATE TABLE sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL,
    set_number INTEGER NOT NULL,
    weight DECIMAL(6,2),
    reps INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise RPE ratings
CREATE TABLE exercise_rpes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL,
    rpe_value INTEGER CHECK (rpe_value >= 1 AND rpe_value <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workout_id, exercise_name)
);

-- AI Suggestions for next cycle
CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL,
    suggested_weight DECIMAL(6,2),
    suggested_reps VARCHAR(20), -- Can be range like "8-12"
    suggestion_reason TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied BOOLEAN DEFAULT FALSE,
    UNIQUE(cycle_id, exercise_name)
);

-- Claude Analysis Results
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_assessment TEXT,
    fatigue_level VARCHAR(20), -- 'low', 'moderate', 'high'
    progress_rate VARCHAR(20), -- 'slow', 'optimal', 'fast'
    recommendations JSONB,
    raw_claude_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date DESC);
CREATE INDEX idx_workouts_cycle ON workouts(cycle_id);
CREATE INDEX idx_sets_workout ON sets(workout_id);
CREATE INDEX idx_exercise_rpes_workout ON exercise_rpes(workout_id);
CREATE INDEX idx_ai_suggestions_cycle ON ai_suggestions(cycle_id);
CREATE INDEX idx_cycles_user ON cycles(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();