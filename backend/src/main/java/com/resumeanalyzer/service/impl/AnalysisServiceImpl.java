package com.resumeanalyzer.service.impl;

import com.resumeanalyzer.analyzer.DeterministicAnalyzer;
import com.resumeanalyzer.dto.analysis.RecommendationDto;
import com.resumeanalyzer.dto.analysis.ResumeAnalysisDto;
import com.resumeanalyzer.dto.analysis.ResumeSectionDto;
import com.resumeanalyzer.entity.Recommendation;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.ResumeAnalysis;
import com.resumeanalyzer.entity.ResumeSection;
import com.resumeanalyzer.exception.ResourceNotFoundException;
import com.resumeanalyzer.parser.ParsedResume;
import com.resumeanalyzer.parser.ResumeParserService;
import com.resumeanalyzer.repository.RecommendationRepository;
import com.resumeanalyzer.repository.ResumeAnalysisRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.repository.ResumeSectionRepository;
import com.resumeanalyzer.service.AnalysisService;
import com.resumeanalyzer.service.ai.AIAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalysisServiceImpl implements AnalysisService {

    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository analysisRepository;
    private final ResumeSectionRepository sectionRepository;
    private final RecommendationRepository recommendationRepository;
    private final ResumeParserService resumeParserService;
    private final DeterministicAnalyzer deterministicAnalyzer;
    private final AIAnalysisService aiAnalysisService;

    @Override
    @Transactional
    public ResumeAnalysisDto analyzeResume(Long resumeId, Long userId) {
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found or access denied"));

        ParsedResume parsedResume = resumeParserService.parseText(resume.getExtractedText());

        DeterministicAnalyzer.AnalysisResult deterministicResult = deterministicAnalyzer.analyze(parsedResume);
        DeterministicAnalyzer.AnalysisResult finalResult = aiAnalysisService.enhanceAnalysis(parsedResume, deterministicResult);

        ResumeAnalysis analysis = finalResult.getAnalysis();
        analysis.setResume(resume);

        ResumeAnalysis savedAnalysis = analysisRepository.save(analysis);

        for (ResumeSection section : finalResult.getSections()) {
            section.setAnalysis(savedAnalysis);
            sectionRepository.save(section);
        }

        for (Recommendation recommendation : finalResult.getRecommendations()) {
            recommendation.setAnalysis(savedAnalysis);
            recommendationRepository.save(recommendation);
        }

        savedAnalysis.setSections(finalResult.getSections());
        savedAnalysis.setRecommendations(finalResult.getRecommendations());

        return mapToDto(savedAnalysis);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeAnalysisDto> getResumeAnalyses(Long resumeId, Long userId) {
        resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found or access denied"));

        return analysisRepository.findByResumeIdOrderByAnalyzedAtDesc(resumeId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeAnalysisDto> getUserAnalysisHistory(Long userId) {
        return analysisRepository.findByResumeUserIdOrderByAnalyzedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeAnalysisDto getAnalysisById(Long analysisId, Long userId) {
        ResumeAnalysis analysis = analysisRepository.findByIdAndResumeUserId(analysisId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found or access denied"));

        return mapToDto(analysis);
    }

    @Override
    @Transactional
    public void deleteAnalysis(Long analysisId, Long userId) {
        ResumeAnalysis analysis = analysisRepository.findByIdAndResumeUserId(analysisId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found or access denied"));

        analysisRepository.delete(analysis);
    }

    private ResumeAnalysisDto mapToDto(ResumeAnalysis analysis) {
        List<ResumeSectionDto> sectionDtos = sectionRepository.findByAnalysisId(analysis.getId())
                .stream()
                .map(s -> ResumeSectionDto.builder()
                        .id(s.getId())
                        .sectionType(s.getSectionType())
                        .score(s.getScore())
                        .feedback(s.getFeedback())
                        .build())
                .collect(Collectors.toList());

        List<RecommendationDto> recDtos = recommendationRepository.findByAnalysisId(analysis.getId())
                .stream()
                .map(r -> RecommendationDto.builder()
                        .id(r.getId())
                        .category(r.getCategory())
                        .priority(r.getPriority())
                        .message(r.getMessage())
                        .build())
                .collect(Collectors.toList());

        return ResumeAnalysisDto.builder()
                .id(analysis.getId())
                .resumeId(analysis.getResume().getId())
                .originalFilename(analysis.getResume().getOriginalFilename())
                .overallScore(analysis.getOverallScore())
                .atsScore(analysis.getAtsScore())
                .contentScore(analysis.getContentScore())
                .structureScore(analysis.getStructureScore())
                .skillsScore(analysis.getSkillsScore())
                .experienceScore(analysis.getExperienceScore())
                .educationScore(analysis.getEducationScore())
                .projectsScore(analysis.getProjectsScore())
                .analyzedAt(analysis.getAnalyzedAt())
                .sections(sectionDtos)
                .recommendations(recDtos)
                .build();
    }
}
