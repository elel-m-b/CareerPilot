package com.resumeanalyzer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeanalyzer.dto.auth.AuthResponse;
import com.resumeanalyzer.dto.auth.LoginRequest;
import com.resumeanalyzer.dto.auth.RegisterRequest;
import com.resumeanalyzer.dto.auth.UserSummaryDto;
import com.resumeanalyzer.security.CustomUserDetailsService;
import com.resumeanalyzer.security.JwtTokenProvider;
import com.resumeanalyzer.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void register_ValidPayload_Returns21Created() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .username("john_doe")
                .email("john@example.com")
                .password("password123")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("jwt_token")
                .user(UserSummaryDto.builder().id(1L).username("john_doe").email("john@example.com").build())
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt_token"))
                .andExpect(jsonPath("$.user.email").value("john@example.com"));
    }

    @Test
    void login_ValidPayload_Returns200OK() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("jwt_token")
                .user(UserSummaryDto.builder().id(1L).username("john_doe").email("john@example.com").build())
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt_token"));
    }
}
