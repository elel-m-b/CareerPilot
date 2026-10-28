package com.resumeanalyzer.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.ByteArrayOutputStream;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the ATS feature end to end against the real H2 database, security
 * chain and REST controllers: register → upload → analyse → dashboard.
 *
 * <p>Its purpose is to prove the dashboard reads the same state the ATS engine
 * wrote (counts, average, best score, latest score per CV) and that deleting a
 * CV removes its analysis history, instead of relying on mocked services.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
class AtsDashboardFlowTest {

    private static final String DOCX_MIME =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String register(String email, String username) throws Exception {
        String body = objectMapper.writeValueAsString(new Account(username, email, "password123"));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private long upload(String token, String filename) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", filename, DOCX_MIME, cv());

        MvcResult result = mockMvc.perform(multipart("/api/resumes/upload")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private JsonNode analyze(String token, long resumeId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/resumes/{id}/analyze", resumeId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode getJson(String token, String path) throws Exception {
        MvcResult result = mockMvc.perform(get(path).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    /** A small but realistic CV in a format the server's DOCX parser accepts. */
    private static byte[] cv() throws Exception {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (String line : new String[]{
                    "Yasmine El Amrani",
                    "Casablanca, Morocco",
                    "yasmine.elamrani@gmail.com",
                    "+212 612 345 6789",
                    "SUMMARY",
                    "Backend engineer with six years of experience building distributed systems.",
                    "EXPERIENCE",
                    "Senior Backend Engineer, Acme",
                    "Built 12 microservices with Spring Boot serving 4,000 requests per day.",
                    "Reduced latency by 61% using caching and query optimisation.",
                    "Improved deployment frequency by 88% with CI/CD automation.",
                    "EDUCATION",
                    "Bachelor of Science in Computer Science",
                    "SKILLS",
                    "Java, Spring Boot, PostgreSQL, Docker, React, JUnit",
                    "PROJECTS",
                    "github.com/yasmine/pipeline",
                    "CERTIFICATIONS",
                    "AWS Solutions Architect",
                    "LANGUAGES",
                    "Arabic, French, English"}) {
                document.createParagraph().createRun().setText(line);
            }
            document.write(out);
            return out.toByteArray();
        }
    }

    @Test
    void dashboardReflectsTheStoredAnalyses() throws Exception {
        String token = register("flow-" + UUID.randomUUID() + "@example.com", "flow_user");

        JsonNode emptyStats = getJson(token, "/api/dashboard/stats");
        assertEquals(0, emptyStats.get("totalResumes").asInt());
        assertEquals(0, emptyStats.get("totalAnalyses").asInt());
        assertEquals(0, emptyStats.get("bestScore").asInt());

        long resumeId = upload(token, "yasmine-cv.docx");

        JsonNode uploadedStats = getJson(token, "/api/dashboard/stats");
        assertEquals(1, uploadedStats.get("totalResumes").asInt());
        assertEquals(0, uploadedStats.get("totalAnalyses").asInt(),
                "an upload alone must not be counted as a scan");

        JsonNode analysis = analyze(token, resumeId);
        int score = analysis.get("overallScore").asInt();
        assertEquals(7, analysis.get("sections").size(), "all seven ATS dimensions are stored");
        assertTrue(score >= 0 && score <= 100);

        JsonNode stats = getJson(token, "/api/dashboard/stats");
        assertEquals(1, stats.get("totalResumes").asInt());
        assertEquals(1, stats.get("totalAnalyses").asInt());
        assertEquals(score, stats.get("bestScore").asInt());
        assertEquals(score, stats.get("averageScore").asDouble(), 0.05);

        JsonNode resumes = getJson(token, "/api/resumes");
        assertEquals(1, resumes.size());
        assertEquals(score, resumes.get(0).get("latestScore").asInt());
        assertEquals(analysis.get("id").asLong(), resumes.get(0).get("latestAnalysisId").asLong());

        JsonNode history = getJson(token, "/api/analyses");
        assertEquals(1, history.size());
        assertEquals(score, history.get(0).get("overallScore").asInt());
        assertEquals(7, history.get(0).get("sections").size());
        assertEquals(resumeId, history.get(0).get("resumeId").asLong());

        assertEquals(1, getJson(token, "/api/resumes/" + resumeId + "/analyses").size());

        // A re-scan adds history without changing the stored CV count.
        JsonNode second = analyze(token, resumeId);
        JsonNode statsAfterRescan = getJson(token, "/api/dashboard/stats");
        assertEquals(1, statsAfterRescan.get("totalResumes").asInt());
        assertEquals(2, statsAfterRescan.get("totalAnalyses").asInt());
        assertEquals(
                Math.round(((score + second.get("overallScore").asInt()) / 2.0) * 10.0) / 10.0,
                statsAfterRescan.get("averageScore").asDouble(),
                0.05);

        mockMvc.perform(delete("/api/resumes/{id}", resumeId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());

        JsonNode clearedStats = getJson(token, "/api/dashboard/stats");
        assertEquals(0, clearedStats.get("totalResumes").asInt());
        assertEquals(0, clearedStats.get("totalAnalyses").asInt());
        assertEquals(0, clearedStats.get("bestScore").asInt());
        assertEquals(0, getJson(token, "/api/analyses").size(),
                "deleting a CV removes its analysis history");
    }

    @Test
    void anotherAccountCannotReachAnotherUsersCv() throws Exception {
        String owner = register("owner-" + UUID.randomUUID() + "@example.com", "owner_user");
        String stranger = register("stranger-" + UUID.randomUUID() + "@example.com", "stranger_user");
        long resumeId = upload(owner, "owner-cv.docx");

        mockMvc.perform(get("/api/resumes/{id}", resumeId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + stranger))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/resumes/{id}/analyze", resumeId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + stranger))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/dashboard/stats")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + stranger))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalResumes").value(0))
                .andExpect(jsonPath("$.totalAnalyses").value(0));
    }

    /** Minimal JSON body for registration. */
    private record Account(String username, String email, String password) {
    }
}
