package com.resumeanalyzer.analyzer;

import com.resumeanalyzer.entity.Recommendation;
import com.resumeanalyzer.entity.ResumeAnalysis;
import com.resumeanalyzer.entity.ResumeSection;
import com.resumeanalyzer.parser.ParsedResume;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class DeterministicAnalyzer {

    /**
     * Degree keywords, matched as whole tokens. Substring checks for "bs"/"ms"
     * previously matched ordinary words ("we<b>bs</b>ite"), awarding full
     * education credit to a CV that never mentions education.
     */
    private static final Pattern DEGREE_PATTERN = Pattern.compile(
            "\\b(?:bachelor(?:'s)?|master(?:'s)?|doctorate|ph\\.?d|degree|mba|b\\.?s\\.?c?|m\\.?s\\.?c?|b\\.?eng|m\\.?eng)(?![a-z0-9])",
            Pattern.CASE_INSENSITIVE);

    public AnalysisResult analyze(ParsedResume parsed) {
        int atsScore = calculateAtsScore(parsed);
        int contentScore = calculateContentScore(parsed);
        int skillsScore = calculateSkillsScore(parsed);
        int experienceScore = calculateExperienceScore(parsed);
        int educationScore = calculateEducationScore(parsed);
        int projectsScore = calculateProjectsScore(parsed);
        int structureScore = calculateStructureScore(parsed);

        int overallScore = (int) Math.round(
                0.20 * atsScore +
                0.20 * contentScore +
                0.15 * skillsScore +
                0.20 * experienceScore +
                0.10 * educationScore +
                0.10 * projectsScore +
                0.05 * structureScore
        );

        List<ResumeSection> sections = new ArrayList<>();
        sections.add(buildSection("ATS_COMPATIBILITY", atsScore, getAtsFeedback(atsScore, parsed)));
        sections.add(buildSection("CONTENT_QUALITY", contentScore, getContentFeedback(contentScore, parsed)));
        sections.add(buildSection("SKILLS", skillsScore, getSkillsFeedback(skillsScore, parsed)));
        sections.add(buildSection("EXPERIENCE", experienceScore, getExperienceFeedback(experienceScore, parsed)));
        sections.add(buildSection("EDUCATION", educationScore, getEducationFeedback(educationScore, parsed)));
        sections.add(buildSection("PROJECTS", projectsScore, getProjectsFeedback(projectsScore, parsed)));
        sections.add(buildSection("STRUCTURE", structureScore, getStructureFeedback(structureScore, parsed)));

        List<Recommendation> recommendations = generateRecommendations(parsed, atsScore, contentScore, skillsScore, experienceScore, educationScore, projectsScore);

        ResumeAnalysis analysis = ResumeAnalysis.builder()
                .overallScore(overallScore)
                .atsScore(atsScore)
                .contentScore(contentScore)
                .skillsScore(skillsScore)
                .experienceScore(experienceScore)
                .educationScore(educationScore)
                .projectsScore(projectsScore)
                .structureScore(structureScore)
                .build();

        return new AnalysisResult(analysis, sections, recommendations);
    }

    private int calculateAtsScore(ParsedResume parsed) {
        int score = 0;
        if (parsed.getEmail() != null) score += 25;
        if (parsed.getPhone() != null) score += 25;
        if (parsed.getLocation() != null) score += 15;

        Set<String> sections = parsed.getDetectedSections();
        if (sections.contains("SUMMARY")) score += 10;
        if (sections.contains("EXPERIENCE")) score += 10;
        if (sections.contains("EDUCATION")) score += 10;
        if (sections.contains("SKILLS")) score += 5;

        return Math.min(100, score);
    }

    private int calculateContentScore(ParsedResume parsed) {
        int score = 0;
        int wordCount = parsed.getWordCount();
        if (wordCount >= 350 && wordCount <= 1200) {
            score += 40;
        } else if (wordCount >= 200) {
            score += 25;
        } else {
            score += 10;
        }

        int verbs = parsed.getActionVerbsFound().size();
        if (verbs >= 8) score += 35;
        else if (verbs >= 4) score += 20;
        else score += 10;

        int metrics = parsed.getQuantifiableMetricCount();
        if (metrics >= 4) score += 25;
        else if (metrics >= 1) score += 15;
        else score += 5;

        return Math.min(100, score);
    }

    private int calculateSkillsScore(ParsedResume parsed) {
        int skillCount = parsed.getSkills().size();
        if (skillCount >= 10) return 95;
        if (skillCount >= 6) return 80;
        if (skillCount >= 3) return 65;
        if (skillCount >= 1) return 45;
        return 20;
    }

    private int calculateExperienceScore(ParsedResume parsed) {
        int score = 20;
        if (parsed.getDetectedSections().contains("EXPERIENCE")) {
            score += 30;
        }
        if (!parsed.getActionVerbsFound().isEmpty()) {
            score += 25;
        }
        if (parsed.getQuantifiableMetricCount() > 0) {
            score += 25;
        }
        return Math.min(100, score);
    }

    private int calculateEducationScore(ParsedResume parsed) {
        int score = 30;
        String rawLower = parsed.getRawText().toLowerCase(Locale.ROOT);
        if (parsed.getDetectedSections().contains("EDUCATION")) {
            score += 30;
        }
        if (DEGREE_PATTERN.matcher(rawLower).find()) {
            score += 40;
        }
        return Math.min(100, score);
    }

    private int calculateProjectsScore(ParsedResume parsed) {
        int score = 30;
        if (parsed.getDetectedSections().contains("PROJECTS")) {
            score += 40;
        }
        String rawLower = parsed.getRawText().toLowerCase(Locale.ROOT);
        if (rawLower.contains("github") || rawLower.contains("http")) {
            score += 30;
        }
        return Math.min(100, score);
    }

    private int calculateStructureScore(ParsedResume parsed) {
        int score = 50;
        if (parsed.getDetectedSections().size() >= 4) {
            score += 30;
        }
        if (parsed.getEmail() != null && parsed.getPhone() != null) {
            score += 20;
        }
        return Math.min(100, score);
    }

    private String getAtsFeedback(int score, ParsedResume parsed) {
        if (score >= 85) return "Excellent ATS compatibility! Clear contact information and standard section headers detected.";
        if (score >= 65) return "Good ATS compatibility. Ensure all essential contact details and standard headers are present.";
        return "Low ATS compatibility. Your resume is missing key contact fields or standard section headings.";
    }

    private String getContentFeedback(int score, ParsedResume parsed) {
        if (score >= 80) return "Strong content density with action verbs and quantifiable achievements.";
        return "Content quality can be improved by adding more action verbs and measurable performance metrics.";
    }

    private String getSkillsFeedback(int score, ParsedResume parsed) {
        if (score >= 80) return "Rich set of industry skills detected (" + parsed.getSkills().size() + " skills).";
        return "Consider adding more core technical and soft skills relevant to your target job role.";
    }

    private String getExperienceFeedback(int score, ParsedResume parsed) {
        if (score >= 80) return "Work experience section is well structured with impact keywords.";
        return "Enhance experience entries by adding measurable results (percentages, numbers, users).";
    }

    private String getEducationFeedback(int score, ParsedResume parsed) {
        if (score >= 70) return "Education background clearly stated.";
        return "Make sure degree names, institutions, and graduation years are clearly visible.";
    }

    private String getProjectsFeedback(int score, ParsedResume parsed) {
        if (score >= 70) return "Project work highlighted with links/technologies.";
        return "Add a dedicated projects section with key achievements and technology stacks used.";
    }

    private String getStructureFeedback(int score, ParsedResume parsed) {
        if (score >= 80) return "Clean section formatting and logical document hierarchy.";
        return "Ensure consistent font hierarchy and standard section names.";
    }

    private List<Recommendation> generateRecommendations(ParsedResume parsed, int ats, int content, int skills, int exp, int edu, int proj) {
        List<Recommendation> recs = new ArrayList<>();

        if (parsed.getEmail() == null || parsed.getPhone() == null) {
            recs.add(Recommendation.builder()
                    .category("Contact Info")
                    .priority("Critical")
                    .message("Add complete contact information (Email and Phone) to ensure recruiters and ATS can reach you.")
                    .build());
        }

        if (!parsed.getDetectedSections().contains("SUMMARY")) {
            recs.add(Recommendation.builder()
                    .category("Summary")
                    .priority("Critical")
                    .message("Improve your professional summary: Your resume does not contain a strong summary section. Add a 2-3 sentence summary describing your experience, technical skills, and career direction.")
                    .build());
        }

        if (parsed.getQuantifiableMetricCount() < 3) {
            recs.add(Recommendation.builder()
                    .category("Achievements")
                    .priority("Important")
                    .message("Add measurable achievements: Several experience entries describe responsibilities without measurable results. Try including numbers such as percentage improvements, performance gains, or user count.")
                    .build());
        }

        if (skills < 70) {
            recs.add(Recommendation.builder()
                    .category("Skills")
                    .priority("Important")
                    .message("Expand skill density: Add relevant technical frameworks, tools, and methodologies (e.g. Docker, CI/CD, React, Spring Boot) to increase ATS keyword matching.")
                    .build());
        }

        if (!parsed.getDetectedSections().contains("PROJECTS")) {
            recs.add(Recommendation.builder()
                    .category("Projects")
                    .priority("Suggested")
                    .message("Add a dedicated Projects section showcasing your practical applications, system designs, or open-source contributions.")
                    .build());
        }

        if (parsed.getActionVerbsFound().size() < 5) {
            recs.add(Recommendation.builder()
                    .category("Content")
                    .priority("Suggested")
                    .message("Use strong action verbs: Start experience bullet points with action words like Spearheaded, Engineered, Optimized, or Architected.")
                    .build());
        }

        return recs;
    }

    private ResumeSection buildSection(String sectionType, int score, String feedback) {
        return ResumeSection.builder()
                .sectionType(sectionType)
                .score(score)
                .feedback(feedback)
                .build();
    }

    public static class AnalysisResult {
        private final ResumeAnalysis analysis;
        private final List<ResumeSection> sections;
        private final List<Recommendation> recommendations;

        public AnalysisResult(ResumeAnalysis analysis, List<ResumeSection> sections, List<Recommendation> recommendations) {
            this.analysis = analysis;
            this.sections = sections;
            this.recommendations = recommendations;
        }

        public ResumeAnalysis getAnalysis() { return analysis; }
        public List<ResumeSection> getSections() { return sections; }
        public List<Recommendation> getRecommendations() { return recommendations; }
    }
}
