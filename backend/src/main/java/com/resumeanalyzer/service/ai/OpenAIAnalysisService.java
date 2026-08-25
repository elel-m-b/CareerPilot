package com.resumeanalyzer.service.ai;

import com.resumeanalyzer.analyzer.DeterministicAnalyzer;
import com.resumeanalyzer.parser.ParsedResume;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class OpenAIAnalysisService implements AIAnalysisService {

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.provider:openai}")
    private String provider;

    @Override
    public DeterministicAnalyzer.AnalysisResult enhanceAnalysis(ParsedResume parsedResume, DeterministicAnalyzer.AnalysisResult initialResult) {
        if (!StringUtils.hasText(apiKey)) {
            log.info("AI API key is not configured. Utilizing deterministic analysis engine output.");
            return initialResult;
        }

        try {
            log.info("AI Provider [{}] configured. Attempting AI enhancement...", provider);
            // Optional external API integration logic here...
            // If external call succeeds, we return enhanced result. Otherwise fallback.
            return initialResult;
        } catch (Exception e) {
            log.warn("AI enhancement failed: {}. Falling back to deterministic analysis engine.", e.getMessage());
            return initialResult;
        }
    }
}
