package com.resumeanalyzer.service.impl;

import com.resumeanalyzer.dto.resume.ResumeDetailDto;
import com.resumeanalyzer.dto.resume.ResumeDto;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.ResumeAnalysis;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.exception.BadRequestException;
import com.resumeanalyzer.exception.ResourceNotFoundException;
import com.resumeanalyzer.parser.ResumeParserService;
import com.resumeanalyzer.repository.ResumeAnalysisRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.repository.UserRepository;
import com.resumeanalyzer.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeServiceImpl implements ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final ResumeAnalysisRepository analysisRepository;
    private final ResumeParserService resumeParserService;

    @Override
    @Transactional
    public ResumeDto uploadResume(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String extractedText = resumeParserService.extractRawText(file);
        String originalFilename = file.getOriginalFilename();
        String fileType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        Resume resume = Resume.builder()
                .user(user)
                .originalFilename(originalFilename)
                .fileType(fileType)
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .build();

        Resume savedResume = resumeRepository.save(resume);

        return mapToDto(savedResume);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeDto> getUserResumes(Long userId) {
        return resumeRepository.findByUserIdOrderByUploadedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeDetailDto getResumeDetail(Long id, Long userId) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found or access denied"));

        return ResumeDetailDto.builder()
                .id(resume.getId())
                .userId(resume.getUser().getId())
                .originalFilename(resume.getOriginalFilename())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .extractedText(resume.getExtractedText())
                .uploadedAt(resume.getUploadedAt())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteResume(Long id, Long userId) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found or access denied"));

        resumeRepository.delete(resume);
    }

    private ResumeDto mapToDto(Resume resume) {
        Optional<ResumeAnalysis> latestAnalysis = analysisRepository.findTopByResumeIdOrderByAnalyzedAtDesc(resume.getId());

        return ResumeDto.builder()
                .id(resume.getId())
                .userId(resume.getUser().getId())
                .originalFilename(resume.getOriginalFilename())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .uploadedAt(resume.getUploadedAt())
                .latestScore(latestAnalysis.map(ResumeAnalysis::getOverallScore).orElse(null))
                .latestAnalysisId(latestAnalysis.map(ResumeAnalysis::getId).orElse(null))
                .build();
    }
}
