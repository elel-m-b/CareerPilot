package com.resumeanalyzer.parser;

import com.resumeanalyzer.exception.UnsupportedFileTypeException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ResumeParserService {

    private final PdfResumeParser pdfResumeParser;
    private final DocxResumeParser docxResumeParser;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(\\+?\\d{1,3}[- .]?)?\\(?[0-9]{3}\\)?[- .]?[0-9]{3}[- .]?[0-9]{4}");
    private static final Pattern METRIC_PATTERN = Pattern.compile("\\b\\d+(?:\\.\\d+)?%|\\$\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\b\\d+\\+\\b|\\b(?:increased|reduced|improved|grew|saved|managed|led)\\b.*?\\b\\d+\\b", Pattern.CASE_INSENSITIVE);

    private static final List<String> COMMON_SKILLS = List.of(
            "java", "spring", "spring boot", "react", "javascript", "typescript", "html", "css", "sql", "mysql",
            "postgresql", "mongodb", "docker", "kubernetes", "aws", "azure", "gcp", "git", "github", "gitlab",
            "rest", "rest api", "microservices", "python", "c++", "c#", "node.js", "express", "tailwind", "bootstrap",
            "unit testing", "junit", "mockito", "ci/cd", "agile", "scrum", "jira", "communication", "leadership",
            "problem solving", "teamwork", "time management", "critical thinking"
    );

    private static final List<String> ACTION_VERBS = List.of(
            "achieved", "architected", "built", "created", "delivered", "designed", "developed", "deployed",
            "engineered", "established", "expanded", "implemented", "improved", "increased", "integrated",
            "launched", "led", "managed", "maximized", "optimized", "orchestrated", "reduced", "resolved",
            "spearheaded", "standardized", "streamlined", "transformed"
    );

    public String extractRawText(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new UnsupportedFileTypeException("Filename is missing");
        }

        String lowerName = filename.toLowerCase();
        try (InputStream inputStream = file.getInputStream()) {
            if (lowerName.endsWith(".pdf")) {
                return pdfResumeParser.extractText(inputStream);
            } else if (lowerName.endsWith(".docx")) {
                return docxResumeParser.extractText(inputStream);
            } else {
                throw new UnsupportedFileTypeException("Unsupported file type. Only PDF and DOCX files are allowed.");
            }
        } catch (UnsupportedFileTypeException e) {
            throw e;
        } catch (Exception e) {
            throw new UnsupportedFileTypeException("Could not read file: " + e.getMessage());
        }
    }

    public ParsedResume parseText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return ParsedResume.builder().rawText("").build();
        }

        String email = extractEmail(rawText);
        String phone = extractPhone(rawText);
        String location = extractLocation(rawText);
        
        Set<String> detectedSections = detectSections(rawText);
        List<String> skills = extractSkills(rawText);
        List<String> actionVerbs = extractActionVerbs(rawText);
        int metricCount = countMetrics(rawText);
        int wordCount = countWords(rawText);

        String summary = extractSectionContent(rawText, "summary", "objective", "about me", "profile");
        String experienceText = extractSectionContent(rawText, "experience", "work history", "employment", "professional experience");
        String educationText = extractSectionContent(rawText, "education", "academic background", "qualification");
        String projectsText = extractSectionContent(rawText, "projects", "personal projects", "key projects");

        return ParsedResume.builder()
                .email(email)
                .phone(phone)
                .location(location)
                .summary(summary)
                .skills(skills)
                .experienceText(experienceText)
                .educationText(educationText)
                .projectsText(projectsText)
                .actionVerbsFound(actionVerbs)
                .wordCount(wordCount)
                .quantifiableMetricCount(metricCount)
                .rawText(rawText)
                .detectedSections(detectedSections)
                .build();
    }

    private String extractEmail(String text) {
        Matcher matcher = EMAIL_PATTERN.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    private String extractPhone(String text) {
        Matcher matcher = PHONE_PATTERN.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    private String extractLocation(String text) {
        // Basic pattern for City, State / Country or City/Country lines
        Pattern locationPattern = Pattern.compile("(?i)\\b([A-Z][a-zA-Z\\s]+,\\s*[A-Z]{2}|[A-Z][a-zA-Z\\s]+,\\s*[A-Z][a-zA-Z\\s]+)\\b");
        Matcher matcher = locationPattern.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    private Set<String> detectSections(String text) {
        Set<String> sections = new HashSet<>();
        String lowerText = text.toLowerCase();

        if (lowerText.contains("summary") || lowerText.contains("objective") || lowerText.contains("profile")) sections.add("SUMMARY");
        if (lowerText.contains("experience") || lowerText.contains("employment") || lowerText.contains("work history")) sections.add("EXPERIENCE");
        if (lowerText.contains("education") || lowerText.contains("academic") || lowerText.contains("university") || lowerText.contains("college")) sections.add("EDUCATION");
        if (lowerText.contains("skill") || lowerText.contains("technologies") || lowerText.contains("competencies")) sections.add("SKILLS");
        if (lowerText.contains("project") || lowerText.contains("portfolio")) sections.add("PROJECTS");
        if (lowerText.contains("certification") || lowerText.contains("certificate") || lowerText.contains("license")) sections.add("CERTIFICATIONS");
        if (lowerText.contains("language")) sections.add("LANGUAGES");

        return sections;
    }

    private List<String> extractSkills(String text) {
        String lowerText = text.toLowerCase();
        List<String> found = new ArrayList<>();
        for (String skill : COMMON_SKILLS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skill) + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(lowerText).find()) {
                found.add(skill);
            }
        }
        return found;
    }

    private List<String> extractActionVerbs(String text) {
        String lowerText = text.toLowerCase();
        List<String> found = new ArrayList<>();
        for (String verb : ACTION_VERBS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(verb) + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(lowerText).find()) {
                found.add(verb);
            }
        }
        return found;
    }

    private int countMetrics(String text) {
        Matcher matcher = METRIC_PATTERN.matcher(text);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        return text.trim().split("\\s+").length;
    }

    private String extractSectionContent(String text, String... keywords) {
        String[] lines = text.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        boolean insideSection = false;

        for (String line : lines) {
            String trimmed = line.trim().toLowerCase();
            boolean isHeader = false;
            for (String kw : keywords) {
                if (trimmed.equals(kw) || trimmed.startsWith(kw + ":") || trimmed.endsWith(kw)) {
                    isHeader = true;
                    break;
                }
            }

            if (isHeader) {
                insideSection = true;
                continue;
            }

            if (insideSection) {
                // If line looks like another section header, stop
                if (trimmed.length() < 30 && (trimmed.endsWith(":") || trimmed.equals("education") || trimmed.equals("skills") || trimmed.equals("projects") || trimmed.equals("experience"))) {
                    break;
                }
                sb.append(line).append("\n");
            }
        }
        return sb.toString().trim();
    }
}
