package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.ResumeSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeSectionRepository extends JpaRepository<ResumeSection, Long> {
    List<ResumeSection> findByAnalysisId(Long analysisId);
}
