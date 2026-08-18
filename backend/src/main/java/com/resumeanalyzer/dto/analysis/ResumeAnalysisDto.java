package com.resumeanalyzer.dto.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisDto {
    private Long id;
    private Long resumeId;
    private String originalFilename;
    private Integer overallScore;
    private Integer atsScore;
    private Integer contentScore;
    private Integer structureScore;
    private Integer skillsScore;
    private Integer experienceScore;
    private Integer educationScore;
    private Integer projectsScore;
    private LocalDateTime analyzedAt;
    private List<ResumeSectionDto> sections;
    private List<RecommendationDto> recommendations;
}
