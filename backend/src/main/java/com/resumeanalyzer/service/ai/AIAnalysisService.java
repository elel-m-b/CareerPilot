package com.resumeanalyzer.service.ai;

import com.resumeanalyzer.analyzer.DeterministicAnalyzer;
import com.resumeanalyzer.parser.ParsedResume;

public interface AIAnalysisService {
    DeterministicAnalyzer.AnalysisResult enhanceAnalysis(ParsedResume parsedResume, DeterministicAnalyzer.AnalysisResult initialResult);
}
