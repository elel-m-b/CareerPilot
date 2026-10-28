package com.resumeanalyzer.service.impl;

import com.resumeanalyzer.common.AccountIdentity;
import com.resumeanalyzer.dto.auth.AuthResponse;
import com.resumeanalyzer.dto.auth.LoginRequest;
import com.resumeanalyzer.dto.auth.RegisterRequest;
import com.resumeanalyzer.dto.auth.UserSummaryDto;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.exception.DuplicateResourceException;
import com.resumeanalyzer.repository.UserRepository;
import com.resumeanalyzer.security.JwtTokenProvider;
import com.resumeanalyzer.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = AccountIdentity.normalizeEmail(request.getEmail());
        String username = AccountIdentity.normalizeUsername(request.getUsername());

        // Checked case-insensitively: H2 (dev) compares exactly while MySQL
        // (prod) uses a case-insensitive collation, so an exact-match check let
        // dev create a duplicate that prod rejected with a 500.
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Email address is already in use");
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new DuplicateResourceException("Username is already taken");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .user(UserSummaryDto.builder()
                        .id(savedUser.getId())
                        .username(savedUser.getUsername())
                        .email(savedUser.getEmail())
                        .build())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = AccountIdentity.normalizeEmail(request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .user(UserSummaryDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .build())
                .build();
    }
}
