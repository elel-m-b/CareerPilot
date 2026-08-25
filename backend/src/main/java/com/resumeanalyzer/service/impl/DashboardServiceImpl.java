package com.resumeanalyzer.service.impl;

import com.resumeanalyzer.dto.dashboard.DashboardStatsDto;
import com.resumeanalyzer.repository.ResumeAnalysisRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository analysisRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(Long userId) {
        long totalResumes = resumeRepository.countByUserId(userId);
        long totalAnalyses = analysisRepository.countByResumeUserId(userId);

        Double avgScore = analysisRepository.findAverageOverallScoreByUserId(userId);
        Integer bestScore = analysisRepository.findBestOverallScoreByUserId(userId);

        return DashboardStatsDto.builder()
                .totalResumes(totalResumes)
                .totalAnalyses(totalAnalyses)
                .averageScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0)
                .bestScore(bestScore != null ? bestScore : 0)
                .build();
    }
}
