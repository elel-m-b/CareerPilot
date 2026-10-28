package com.resumeanalyzer.parser;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Characterisation tests that pin the current behaviour of {@link ResumeParserService}.
 *
 * <p>These exist so the Phase 1/2 rewrite of the parser and ATS engine cannot silently
 * change what the existing endpoints return for the same input. The expected values
 * below were captured from the current implementation.</p>
 */
class ResumeParserServiceTest {

    private ResumeParserService parser;

    @BeforeEach
    void setUp() {
        // parseText(...) never uses the document parsers, so plain instances are enough.
        parser = new ResumeParserService(new PdfResumeParser(), new DocxResumeParser());
    }

    private static String fixture(String name) {
        try (InputStream in = ResumeParserServiceTest.class.getResourceAsStream("/fixtures/" + name)) {
            assertNotNull(in, "missing test fixture: " + name);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Could not read fixture " + name, e);
        }
    }

    @Test
    void strongCv_extractsContactDetails() {
        ParsedResume parsed = parser.parseText(fixture("strong-cv.txt"));

        assertEquals("yasmine.elamrani@gmail.com", parsed.getEmail());
        assertEquals("+212 612 345 6789", parsed.getPhone());
        assertNotNull(parsed.getLocation());
        assertTrue(parsed.getLocation().contains("Casablanca"), "location should mention the city");
    }

    @Test
    void strongCv_detectsStandardSections() {
        ParsedResume parsed = parser.parseText(fixture("strong-cv.txt"));

        assertEquals(
                Set.of("SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS", "CERTIFICATIONS", "LANGUAGES"),
                parsed.getDetectedSections());
    }

    @Test
    void strongCv_extractsSkillsAndAchievements() {
        ParsedResume parsed = parser.parseText(fixture("strong-cv.txt"));

        List<String> skills = parsed.getSkills();
        assertEquals(18, skills.size());
        assertTrue(skills.containsAll(
                List.of("java", "spring boot", "postgresql", "docker", "react", "junit")));

        assertTrue(parsed.getActionVerbsFound().containsAll(List.of("built", "developed", "implemented", "reduced")));
        assertEquals(4, parsed.getActionVerbsFound().size());
        // 4,000 requests per day, 61% and 88% are all quantifiable metrics.
        assertEquals(4, parsed.getQuantifiableMetricCount());
        assertEquals(269, parsed.getWordCount());
    }

    @Test
    void weakCv_extractsOnlyWhatIsPresent() {
        ParsedResume parsed = parser.parseText(fixture("weak-cv.txt"));

        assertNull(parsed.getEmail());
        assertNull(parsed.getPhone());
        assertNull(parsed.getLocation());
        // "I worked on some projects" is body text, not a PROJECTS heading.
        assertTrue(parsed.getDetectedSections().isEmpty());
        assertEquals(List.of("java"), parsed.getSkills());
        assertTrue(parsed.getActionVerbsFound().isEmpty());
        assertEquals(0, parsed.getQuantifiableMetricCount());
    }

    @Test
    void noFabrication_neverReportsSkillsThatAreAbsent() {
        ParsedResume parsed = parser.parseText(fixture("weak-cv.txt"));

        assertFalse(parsed.getSkills().contains("kubernetes"));
        assertFalse(parsed.getSkills().contains("spring boot"));
        assertFalse(parsed.getRawText().toLowerCase().contains("kubernetes"));
    }

    @Test
    void parsingIsDeterministic() {
        String text = fixture("strong-cv.txt");

        ParsedResume first = parser.parseText(text);
        ParsedResume second = parser.parseText(text);

        assertEquals(first, second);
    }

    @Test
    void technologyListIsNotMistakenForLocation() {
        ParsedResume parsed = parser.parseText("Skills: Java, Spring Boot, React, Docker");

        assertNull(parsed.getLocation(), "a comma-separated tech list is not a city/country");
        assertTrue(parsed.getDetectedSections().contains("SKILLS"));
    }

    @Test
    void phoneNeedsToLookLikeAPhoneNumber() {
        assertNull(parser.parseText("Employee ID 1234567890\nYear 2021 - 2024").getPhone());
        assertEquals("+212 612 345 6789",
                parser.parseText("Yasmine\nCasablanca, Morocco\n+212 612 345 6789").getPhone());
    }

    @Test
    void symbolSkillsAreDetected() {
        ParsedResume parsed = parser.parseText("Languages: C++, C#, Java and C");

        assertTrue(parsed.getSkills().containsAll(List.of("c++", "c#", "java")));
    }

    @Test
    void plusMetricsAreCounted() {
        ParsedResume parsed = parser.parseText("Automated 15+ pipelines and 20+ services.");

        assertEquals(2, parsed.getQuantifiableMetricCount(), "15+ and 20+ are measurable achievements");
    }

    @Test
    void bodyTextIsNotDetectedAsASection() {
        ParsedResume parsed = parser.parseText(
                "I have experience with projects and skills.\nI helped with the design of a website.");

        assertTrue(parsed.getDetectedSections().isEmpty());
    }

    @Test
    void blankInputProducesEmptyParse() {
        ParsedResume parsed = parser.parseText("   \n  ");

        assertEquals("", parsed.getRawText());
        assertNull(parsed.getEmail());
        assertTrue(parsed.getSkills().isEmpty());
        assertTrue(parsed.getDetectedSections().isEmpty());
    }
}
