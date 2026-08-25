package com.resumeanalyzer.service;

import com.resumeanalyzer.dto.analysis.ResumeAnalysisDto;

import java.util.List;

public interface AnalysisService {
    ResumeAnalysisDto analyzeResume(Long resumeId, Long userId);
    List<ResumeAnalysisDto> getResumeAnalyses(Long resumeId, Long userId);
    List<ResumeAnalysisDto> getUserAnalysisHistory(Long userId);
    ResumeAnalysisDto getAnalysisById(Long analysisId, Long userId);
    void deleteAnalysis(Long analysisId, Long userId);
}
