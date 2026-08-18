package com.resumeanalyzer.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalResumes;
    private long totalAnalyses;
    private double averageScore;
    private int bestScore;
}
