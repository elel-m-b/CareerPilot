package com.resumeanalyzer.controller;

import com.resumeanalyzer.dto.resume.ResumeDetailDto;
import com.resumeanalyzer.dto.resume.ResumeDto;
import com.resumeanalyzer.security.UserPrincipal;
import com.resumeanalyzer.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeDto> uploadResume(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                  @RequestParam("file") MultipartFile file) {
        ResumeDto response = resumeService.uploadResume(userPrincipal.getId(), file);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ResumeDto>> getUserResumes(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<ResumeDto> resumes = resumeService.getUserResumes(userPrincipal.getId());
        return ResponseEntity.ok(resumes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResumeDetailDto> getResumeDetail(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                            @PathVariable("id") Long id) {
        ResumeDetailDto resumeDetail = resumeService.getResumeDetail(id, userPrincipal.getId());
        return ResponseEntity.ok(resumeDetail);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                             @PathVariable("id") Long id) {
        resumeService.deleteResume(id, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }
}
