import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FileText, Cpu, CheckCircle2, TrendingUp, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18) 0%, transparent 60%)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontSize: '0.85rem',
            color: 'var(--primary-500)',
            fontWeight: 600,
            marginBottom: '1.5rem'
          }}>
            <Zap size={14} />
            <span>AI & Deterministic Scoring Engine 2.0</span>
          </div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Optimize Your Resume with Precision AI & ATS Scoring
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Parse, analyze, and score your PDF or DOCX resume across 7 crucial dimensions. Detect missing keywords, verify contact info, and get instant actionable feedback to land 3x more interviews.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
              Analyze My Resume Free
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem' }}>
          7-Dimension Comprehensive Analysis
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <ShieldCheck size={24} color="var(--primary-500)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>ATS Compatibility</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              Ensures clear section headers, valid contact details, and readable parsing layouts for Applicant Tracking Systems.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Cpu size={24} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Skills Keyword Matching</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              Detects tech stacks, tools, frameworks, and soft skills to maximize job qualification alignment.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <TrendingUp size={24} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Quantifiable Metrics</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              Scans experience bullet points for measurable outcomes, percentages, revenue figures, and user counts.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '4rem 2rem', background: 'rgba(17, 24, 39, 0.4)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>How ResumeAnalyzer Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontWeight: 800, fontSize: '1.2rem' }}>1</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload Document</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Upload PDF or DOCX file. Text is safely extracted using native parsers.</p>
            </div>

            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontWeight: 800, fontSize: '1.2rem' }}>2</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Run NLP & Rule Engine</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Our deterministic engine scores ATS readability, content quality, and structure.</p>
            </div>

            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontWeight: 800, fontSize: '1.2rem' }}>3</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Get Actionable Feedback</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Receive prioritized recommendations (Critical, Important, Suggested) to boost your score.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
        © 2026 ResumeAnalyzer SaaS. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
