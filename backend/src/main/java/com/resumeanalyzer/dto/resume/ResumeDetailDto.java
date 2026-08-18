package com.resumeanalyzer.dto.resume;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDetailDto {
    private Long id;
    private Long userId;
    private String originalFilename;
    private String fileType;
    private Long fileSize;
    private String extractedText;
    private LocalDateTime uploadedAt;
    private LocalDateTime updatedAt;
}
