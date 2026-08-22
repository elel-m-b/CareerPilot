package com.resumeanalyzer.parser;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedResume {
    private String email;
    private String phone;
    private String location;
    private String summary;
    
    @Builder.Default
    private List<String> skills = new ArrayList<>();
    
    private String experienceText;
    private String educationText;
    private String projectsText;
    
    @Builder.Default
    private List<String> certifications = new ArrayList<>();
    
    @Builder.Default
    private List<String> languages = new ArrayList<>();

    @Builder.Default
    private List<String> actionVerbsFound = new ArrayList<>();
    
    private int wordCount;
    private int quantifiableMetricCount;
    private String rawText;

    @Builder.Default
    private Set<String> detectedSections = new HashSet<>();
}
