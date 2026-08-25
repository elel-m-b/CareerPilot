package com.resumeanalyzer.controller;

import com.resumeanalyzer.dto.dashboard.DashboardStatsDto;
import com.resumeanalyzer.security.UserPrincipal;
import com.resumeanalyzer.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        DashboardStatsDto stats = dashboardService.getDashboardStats(userPrincipal.getId());
        return ResponseEntity.ok(stats);
    }
}
