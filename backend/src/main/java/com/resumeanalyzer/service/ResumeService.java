package com.resumeanalyzer.service;

import com.resumeanalyzer.dto.resume.ResumeDetailDto;
import com.resumeanalyzer.dto.resume.ResumeDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ResumeService {
    ResumeDto uploadResume(Long userId, MultipartFile file);
    List<ResumeDto> getUserResumes(Long userId);
    ResumeDetailDto getResumeDetail(Long id, Long userId);
    void deleteResume(Long id, Long userId);
}
