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
        assertEquals(3, parsed.getQuantifiableMetricCount());
        assertEquals(269, parsed.getWordCount());
    }

    @Test
    void weakCv_extractsOnlyWhatIsPresent() {
        ParsedResume parsed = parser.parseText(fixture("weak-cv.txt"));

        assertNull(parsed.getEmail());
        assertNull(parsed.getPhone());
        assertNull(parsed.getLocation());
        assertEquals(Set.of("PROJECTS"), parsed.getDetectedSections());
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
    void blankInputProducesEmptyParse() {
        ParsedResume parsed = parser.parseText("   \n  ");

        assertEquals("", parsed.getRawText());
        assertNull(parsed.getEmail());
        assertTrue(parsed.getSkills().isEmpty());
        assertTrue(parsed.getDetectedSections().isEmpty());
    }
}
