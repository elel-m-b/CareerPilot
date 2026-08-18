package com.resumeanalyzer.dto.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeSectionDto {
    private Long id;
    private String sectionType;
    private Integer score;
    private String feedback;
}
