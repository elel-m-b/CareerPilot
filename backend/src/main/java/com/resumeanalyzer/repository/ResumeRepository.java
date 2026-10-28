package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    // uploaded_at has second precision, so id breaks ties between uploads made
    // within the same second (newest first).
    List<Resume> findByUserIdOrderByUploadedAtDescIdDesc(Long userId);
    Optional<Resume> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
