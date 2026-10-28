package com.resumeanalyzer.service;

import com.resumeanalyzer.dto.auth.AuthResponse;
import com.resumeanalyzer.dto.auth.LoginRequest;
import com.resumeanalyzer.dto.auth.RegisterRequest;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.exception.DuplicateResourceException;
import com.resumeanalyzer.repository.UserRepository;
import com.resumeanalyzer.security.JwtTokenProvider;
import com.resumeanalyzer.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .username("john_doe")
                .email("john@example.com")
                .password("password123")
                .build();

        loginRequest = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .build();

        user = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .password("encoded_password")
                .build();
    }

    @Test
    void register_Success() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mock_jwt_token");

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("mock_jwt_token", response.getToken());
        assertEquals("john_doe", response.getUser().getUsername());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_DuplicateEmailInDifferentCase_ThrowsException() {
        RegisterRequest mixedCase = RegisterRequest.builder()
                .username("another_user")
                .email("John@Example.com")
                .password("password123")
                .build();
        when(userRepository.existsByEmailIgnoreCase("john@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(mixedCase));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_TrimsAndLowercasesIdentity() {
        RegisterRequest padded = RegisterRequest.builder()
                .username("  jane_doe  ")
                .email("  Jane@Example.com  ")
                .password("password123")
                .build();

        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(2L);
            return saved;
        });
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mock_jwt_token");

        AuthResponse response = authService.register(padded);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertEquals("jane_doe", savedUser.getValue().getUsername());
        assertEquals("jane@example.com", savedUser.getValue().getEmail());
        assertEquals("jane@example.com", response.getUser().getEmail());
    }

    @Test
    void login_Success() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mock_jwt_token");
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mock_jwt_token", response.getToken());
        assertEquals("john@example.com", response.getUser().getEmail());
    }

    @Test
    void login_NormalizesEmailBeforeAuthenticating() {
        LoginRequest padded = LoginRequest.builder()
                .email("  John@Example.com ")
                .password("password123")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mock_jwt_token");
        when(userRepository.findByEmailIgnoreCase("john@example.com")).thenReturn(Optional.of(user));

        authService.login(padded);

        ArgumentCaptor<UsernamePasswordAuthenticationToken> token =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(token.capture());
        assertEquals("john@example.com", token.getValue().getPrincipal());
    }
}
