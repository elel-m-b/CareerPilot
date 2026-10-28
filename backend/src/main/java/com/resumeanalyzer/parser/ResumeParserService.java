package com.resumeanalyzer.parser;

import com.resumeanalyzer.exception.BadRequestException;
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

    /**
     * A phone number has 9-15 digits (E.164 allows up to 15) and, in practice, is
     * written with separators or a leading {@code +}. Requiring a separator or a
     * country code stops arbitrary 10-digit identifiers (employee ids, order
     * numbers) from being reported as contact information.
     */
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(?<!\\d)(?:\\+\\d{1,3}[\\s.-]?)?(?:\\(\\d{1,4}\\)[\\s.-]?)?\\d{1,4}(?:[\\s.-]\\d{1,4}){1,4}(?!\\d)");

    /**
     * A contact-block location is a single "City, Country" or "City, ST" line.
     * Matching is deliberately case-sensitive and anchored to a line so that a
     * technology list such as "Java, Spring Boot" is not mistaken for a location.
     */
    private static final Pattern LOCATION_PATTERN = Pattern.compile(
            "([A-Z][a-zA-Z.'-]+(?: [A-Z][a-zA-Z.'-]+)*),\\s*([A-Z]{2}|[A-Z][a-zA-Z.'-]+(?: [A-Z][a-zA-Z.'-]+)*)");

    private static final Pattern METRIC_PATTERN = Pattern.compile(
            "\\b\\d+(?:\\.\\d+)?%|\\$\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\b\\d+(?:,\\d{3})+(?:\\.\\d+)?|\\b\\d+\\+|\\b(?:increased|reduced|improved|grew|saved|managed|led)\\b.*?\\b\\d+\\b",
            Pattern.CASE_INSENSITIVE);

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

        String lowerName = filename.toLowerCase(Locale.ROOT);
        try (InputStream inputStream = file.getInputStream()) {
            if (lowerName.endsWith(".pdf")) {
                return pdfResumeParser.extractText(inputStream);
            } else if (lowerName.endsWith(".docx")) {
                return docxResumeParser.extractText(inputStream);
            } else {
                throw new UnsupportedFileTypeException("Unsupported file type. Only PDF and DOCX files are allowed.");
            }
        } catch (UnsupportedFileTypeException | BadRequestException e) {
            // An unsupported extension and an unreadable/corrupt document are
            // different failures: the second is a bad request, not a bad type.
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
        while (matcher.find()) {
            String candidate = matcher.group().trim();
            String digits = candidate.replaceAll("\\D", "");
            // Reject year ranges and other short numeric fragments.
            if (digits.length() >= 9 && digits.length() <= 15) {
                return candidate;
            }
        }
        return null;
    }

    private String extractLocation(String text) {
        int scanned = 0;
        for (String rawLine : text.split("\\r?\\n")) {
            String candidate = rawLine.trim();
            if (candidate.isEmpty()) {
                continue;
            }
            // Locations live in the contact block at the top of the document.
            if (++scanned > 12) {
                break;
            }
            if (candidate.length() > 60
                    || candidate.contains("@")
                    || candidate.contains("|")
                    || candidate.contains("http")
                    || candidate.matches(".*\\d.*")
                    || containsKnownSkill(candidate)) {
                continue;
            }

            Matcher matcher = LOCATION_PATTERN.matcher(candidate);
            if (matcher.find()) {
                return matcher.group().trim();
            }
        }
        return null;
    }

    private boolean containsKnownSkill(String line) {
        String lowerLine = line.toLowerCase(Locale.ROOT);
        for (String skill : COMMON_SKILLS) {
            if (lowerLine.contains(skill)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Detect standard sections from document headings.
     *
     * <p>Scanning the whole text for keywords reported a section for any sentence
     * that merely mentioned one ("I worked on some projects"), which inflated the
     * ATS score. A heading is a short standalone line, or the label before a colon
     * such as {@code Skills: Java, Python}.</p>
     */
    private Set<String> detectSections(String text) {
        Set<String> sections = new HashSet<>();

        for (String rawLine : text.split("\\r?\\n")) {
            String heading = headingOf(rawLine);
            if (heading == null) {
                continue;
            }

            if (containsAny(heading, "summary", "objective", "profile", "about me")) sections.add("SUMMARY");
            if (containsAny(heading, "experience", "employment", "work history", "internship")) sections.add("EXPERIENCE");
            if (containsAny(heading, "education", "academic", "qualification")) sections.add("EDUCATION");
            if (containsAny(heading, "skill", "technologies", "competencies")) sections.add("SKILLS");
            if (containsAny(heading, "project", "portfolio")) sections.add("PROJECTS");
            if (containsAny(heading, "certification", "certificate", "license", "licence")) sections.add("CERTIFICATIONS");
            if (containsAny(heading, "language")) sections.add("LANGUAGES");
        }

        return sections;
    }

    /** Normalise a heading-like line, or return {@code null} when the line is body text. */
    private String headingOf(String rawLine) {
        String line = rawLine.trim();
        if (line.isEmpty()) {
            return null;
        }
        // Bullets are body text even when they are short.
        if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•") || line.startsWith("–")) {
            return null;
        }

        int colon = line.indexOf(':');
        if (colon > 0 && colon <= 40) {
            line = line.substring(0, colon);
        }

        line = line.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9& ]+", " ")
                .replaceAll("\\s+", " ")
                .trim();

        String[] words = line.split(" ");
        if (line.isEmpty() || words.length > 6 || line.length() > 40) {
            return null;
        }
        return line;
    }

    private boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private List<String> extractSkills(String text) {
        String lowerText = text.toLowerCase(Locale.ROOT);
        List<String> found = new ArrayList<>();
        for (String skill : COMMON_SKILLS) {
            // Word boundaries cannot be used here: "C++" and "C#" end in
            // non-word characters, so "\b" after them never matches.
            Pattern pattern = Pattern.compile("(?<![a-z0-9])" + Pattern.quote(skill) + "(?![a-z0-9])");
            if (pattern.matcher(lowerText).find()) {
                found.add(skill);
            }
        }
        return found;
    }

    private List<String> extractActionVerbs(String text) {
        String lowerText = text.toLowerCase(Locale.ROOT);
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
            String trimmed = line.trim().toLowerCase(Locale.ROOT);
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
