package com.resumeanalyzer.service.impl;

import com.resumeanalyzer.common.AccountIdentity;
import com.resumeanalyzer.dto.user.UpdateProfileRequest;
import com.resumeanalyzer.dto.user.UserProfileDto;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.exception.DuplicateResourceException;
import com.resumeanalyzer.exception.ResourceNotFoundException;
import com.resumeanalyzer.repository.UserRepository;
import com.resumeanalyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return toDto(user);
    }

    @Override
    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String username = AccountIdentity.normalizeUsername(request.getUsername());

        // Case-insensitive, like the registration check: "Tester" must not be
        // accepted while another account already owns "tester".
        if (!user.getUsername().equalsIgnoreCase(username)
                && userRepository.existsByUsernameIgnoreCase(username)) {
            throw new DuplicateResourceException("Username is already taken");
        }

        user.setUsername(username);
        User updatedUser = userRepository.save(user);

        return toDto(updatedUser);
    }

    private UserProfileDto toDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
