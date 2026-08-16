package com.resumeanalyzer.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resume_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private ResumeAnalysis analysis;

    @Column(name = "section_type", nullable = false, length = 50)
    private String sectionType;

    @Column(nullable = false)
    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String feedback;
}
