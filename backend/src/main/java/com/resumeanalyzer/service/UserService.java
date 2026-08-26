package com.resumeanalyzer.service;

import com.resumeanalyzer.dto.user.UpdateProfileRequest;
import com.resumeanalyzer.dto.user.UserProfileDto;

public interface UserService {
    UserProfileDto getCurrentUserProfile(Long userId);
    UserProfileDto updateProfile(Long userId, UpdateProfileRequest request);
}
