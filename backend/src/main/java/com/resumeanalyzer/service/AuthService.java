package com.resumeanalyzer.service;

import com.resumeanalyzer.dto.auth.AuthResponse;
import com.resumeanalyzer.dto.auth.LoginRequest;
import com.resumeanalyzer.dto.auth.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
