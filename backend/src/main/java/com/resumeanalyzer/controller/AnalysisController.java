package com.resumeanalyzer.controller;

import com.resumeanalyzer.dto.analysis.ResumeAnalysisDto;
import com.resumeanalyzer.security.UserPrincipal;
import com.resumeanalyzer.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping("/resumes/{id}/analyze")
    public ResponseEntity<ResumeAnalysisDto> analyzeResume(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                           @PathVariable("id") Long resumeId) {
        ResumeAnalysisDto analysis = analysisService.analyzeResume(resumeId, userPrincipal.getId());
        return new ResponseEntity<>(analysis, HttpStatus.CREATED);
    }

    @GetMapping("/resumes/{id}/analyses")
    public ResponseEntity<List<ResumeAnalysisDto>> getResumeAnalyses(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                     @PathVariable("id") Long resumeId) {
        List<ResumeAnalysisDto> analyses = analysisService.getResumeAnalyses(resumeId, userPrincipal.getId());
        return ResponseEntity.ok(analyses);
    }

    @GetMapping("/analyses")
    public ResponseEntity<List<ResumeAnalysisDto>> getUserAnalysisHistory(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<ResumeAnalysisDto> history = analysisService.getUserAnalysisHistory(userPrincipal.getId());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/analyses/{id}")
    public ResponseEntity<ResumeAnalysisDto> getAnalysisById(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                             @PathVariable("id") Long analysisId) {
        ResumeAnalysisDto analysis = analysisService.getAnalysisById(analysisId, userPrincipal.getId());
        return ResponseEntity.ok(analysis);
    }

    @DeleteMapping("/analyses/{id}")
    public ResponseEntity<Void> deleteAnalysis(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                               @PathVariable("id") Long analysisId) {
        analysisService.deleteAnalysis(analysisId, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }
}
