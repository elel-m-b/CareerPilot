package com.resumeanalyzer.analyzer;

import com.resumeanalyzer.entity.ResumeAnalysis;
import com.resumeanalyzer.parser.DocxResumeParser;
import com.resumeanalyzer.parser.ParsedResume;
import com.resumeanalyzer.parser.PdfResumeParser;
import com.resumeanalyzer.parser.ResumeParserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Characterisation tests that pin the current 7-dimension ATS scoring behaviour.
 *
 * <p>They exist so the Phase 2 replacement of the engine cannot silently regress the
 * scores the existing {@code /api/analyses/*} contract returns. The expected values
 * below were captured from the current implementation and the weights are asserted
 * to sum to 100% and to reproduce {@code overallScore}.</p>
 */
class DeterministicAnalyzerTest {

    /** The hard-coded dimension weights of the current engine, in the order they are combined. */
    private static final double[] WEIGHTS = {0.20, 0.20, 0.15, 0.20, 0.10, 0.10, 0.05};

    private final DeterministicAnalyzer analyzer = new DeterministicAnalyzer();
    private final ResumeParserService parser =
            new ResumeParserService(new PdfResumeParser(), new DocxResumeParser());

    private static String fixture(String name) {
        try (InputStream in = DeterministicAnalyzerTest.class.getResourceAsStream("/fixtures/" + name)) {
            assertNotNull(in, "missing test fixture: " + name);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Could not read fixture " + name, e);
        }
    }

    private static int weightedAverage(ResumeAnalysis a) {
        return (int) Math.round(
                WEIGHTS[0] * a.getAtsScore() +
                WEIGHTS[1] * a.getContentScore() +
                WEIGHTS[2] * a.getSkillsScore() +
                WEIGHTS[3] * a.getExperienceScore() +
                WEIGHTS[4] * a.getEducationScore() +
                WEIGHTS[5] * a.getProjectsScore() +
                WEIGHTS[6] * a.getStructureScore());
    }

    private ResumeAnalysis analyzeFixture(String name) {
        return analyzer.analyze(parser.parseText(fixture(name))).getAnalysis();
    }

    @Test
    void dimensionWeightsSumToOneHundred() {
        double sum = 0.0;
        for (double weight : WEIGHTS) {
            sum += weight;
        }
        assertEquals(1.0, sum, 1e-9, "dimension weights must sum to 100%");
    }

    @Test
    void strongCv_producesStableScores() {
        ResumeAnalysis analysis = analyzeFixture("strong-cv.txt");

        assertEquals(100, analysis.getAtsScore());
        assertEquals(70, analysis.getContentScore());
        assertEquals(95, analysis.getSkillsScore());
        assertEquals(100, analysis.getExperienceScore());
        assertEquals(100, analysis.getEducationScore());
        assertEquals(100, analysis.getProjectsScore());
        assertEquals(100, analysis.getStructureScore());
        assertEquals(93, analysis.getOverallScore());
    }

    @Test
    void weakCv_producesStableScores() {
        ResumeAnalysis analysis = analyzeFixture("weak-cv.txt");

        assertEquals(0, analysis.getAtsScore());
        assertEquals(25, analysis.getContentScore());
        assertEquals(45, analysis.getSkillsScore());
        assertEquals(20, analysis.getExperienceScore());
        // No education section and no degree keyword: only the 30-point baseline.
        assertEquals(30, analysis.getEducationScore());
        assertEquals(30, analysis.getProjectsScore());
        assertEquals(50, analysis.getStructureScore());
        assertEquals(24, analysis.getOverallScore());
    }

    @Test
    void overallScoreEqualsWeightedAverageOfDimensions() {
        assertEquals(93, weightedAverage(analyzeFixture("strong-cv.txt")));
        assertEquals(24, weightedAverage(analyzeFixture("weak-cv.txt")));
    }

    @Test
    void ordinaryWordsAreNotDegreeKeywords() {
        ParsedResume parsed = ParsedResume.builder()
                .rawText("I helped with the design of a website and I know Java.")
                .build();

        ResumeAnalysis analysis = analyzer.analyze(parsed).getAnalysis();

        // "website" contains "bs", but it is not a degree.
        assertEquals(30, analysis.getEducationScore());
    }

    @Test
    void abbreviationsCountAsDegrees() {
        for (String degree : List.of("BSc Computer Science", "B.S. in Computer Science",
                "MS in Software Engineering", "Master's degree in AI", "PhD in Physics")) {
            ParsedResume parsed = ParsedResume.builder()
                    .rawText(degree)
                    .detectedSections(Set.of("EDUCATION"))
                    .build();

            ResumeAnalysis analysis = analyzer.analyze(parsed).getAnalysis();
            assertEquals(100, analysis.getEducationScore(), "should detect a degree in: " + degree);
        }
    }

    @Test
    void fullyPopulatedResume_scoresExpectedDimensions() {
        ParsedResume parsed = ParsedResume.builder()
                .email("candidate@example.com")
                .phone("+212 612 345 6789")
                .location("Casablanca, Morocco")
                .detectedSections(Set.of("SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"))
                .skills(List.of("java", "spring boot", "sql", "docker", "aws", "git",
                        "react", "python", "rest api", "kubernetes", "linux", "junit"))
                .actionVerbsFound(List.of("built", "developed", "implemented", "reduced",
                        "designed", "deployed", "led", "improved"))
                .quantifiableMetricCount(5)
                .wordCount(600)
                .rawText("Bachelor of Science degree. github.com/candidate")
                .build();

        ResumeAnalysis analysis = analyzer.analyze(parsed).getAnalysis();

        assertEquals(100, analysis.getAtsScore());
        assertEquals(100, analysis.getContentScore());
        assertEquals(95, analysis.getSkillsScore());
        assertEquals(100, analysis.getExperienceScore());
        assertEquals(100, analysis.getEducationScore());
        assertEquals(100, analysis.getProjectsScore());
        assertEquals(100, analysis.getStructureScore());
        assertEquals(99, analysis.getOverallScore());
        assertEquals(99, weightedAverage(analysis));
    }

    @Test
    void analysisIsDeterministic() {
        ParsedResume parsed = parser.parseText(fixture("strong-cv.txt"));

        ResumeAnalysis first = analyzer.analyze(parsed).getAnalysis();
        ResumeAnalysis second = analyzer.analyze(parsed).getAnalysis();

        assertEquals(first.getOverallScore(), second.getOverallScore());
        assertEquals(first.getAtsScore(), second.getAtsScore());
        assertEquals(first.getContentScore(), second.getContentScore());
        assertEquals(first.getSkillsScore(), second.getSkillsScore());
    }
}
