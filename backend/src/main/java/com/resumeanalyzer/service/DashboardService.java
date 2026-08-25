package com.resumeanalyzer.service;

import com.resumeanalyzer.dto.dashboard.DashboardStatsDto;

public interface DashboardService {
    DashboardStatsDto getDashboardStats(Long userId);
}
