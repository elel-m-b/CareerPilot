package com.resumeanalyzer.controller;

import com.resumeanalyzer.dto.user.UpdateProfileRequest;
import com.resumeanalyzer.dto.user.UserProfileDto;
import com.resumeanalyzer.security.UserPrincipal;
import com.resumeanalyzer.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileDto profile = userService.getCurrentUserProfile(userPrincipal.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileDto> updateProfile(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                         @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileDto profile = userService.updateProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(profile);
    }
}
