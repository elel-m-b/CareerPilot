package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {
    List<ResumeAnalysis> findByResumeUserIdOrderByAnalyzedAtDesc(Long userId);
    List<ResumeAnalysis> findByResumeIdOrderByAnalyzedAtDesc(Long resumeId);
    Optional<ResumeAnalysis> findByIdAndResumeUserId(Long id, Long userId);
    Optional<ResumeAnalysis> findTopByResumeIdOrderByAnalyzedAtDesc(Long resumeId);
    
    long countByResumeUserId(Long userId);

    @Query("SELECT AVG(ra.overallScore) FROM ResumeAnalysis ra WHERE ra.resume.user.id = :userId")
    Double findAverageOverallScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT MAX(ra.overallScore) FROM ResumeAnalysis ra WHERE ra.resume.user.id = :userId")
    Integer findBestOverallScoreByUserId(@Param("userId") Long userId);
}
