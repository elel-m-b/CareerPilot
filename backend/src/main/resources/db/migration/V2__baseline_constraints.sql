-- Phase 0 (baseline guardrails): add the indexes the upcoming features rely on.
--
-- Idempotency is provided by Flyway's version tracking (this script runs exactly once
-- per database), so plain CREATE INDEX is used: MySQL does not support
-- "CREATE INDEX IF NOT EXISTS". The statements below are valid on both MySQL (prod)
-- and H2 in MySQL compatibility mode (dev).

-- Analysed CV history is queried per resume, newest first.
CREATE INDEX idx_resume_analyses_resume_analyzed
    ON resume_analyses (resume_id, analyzed_at);

-- Resumes are always listed and scoped by their owning user.
CREATE INDEX idx_resumes_user_id
    ON resumes (user_id);

-- Recommendations and sections are always fetched by their parent analysis.
CREATE INDEX idx_resume_sections_analysis
    ON resume_sections (analysis_id);

CREATE INDEX idx_recommendations_analysis
    ON recommendations (analysis_id);
