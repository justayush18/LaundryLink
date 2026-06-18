package com.laundrylink.laundrylink.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.AuthLoginRequest;
import com.laundrylink.laundrylink.api.AuthRegisterRequest;
import com.laundrylink.laundrylink.api.AuthResponse;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.persistence.UserEntity;
import com.laundrylink.laundrylink.persistence.UserRepository;
import com.laundrylink.laundrylink.security.JwtService;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    public void setUp() {
        lenient().when(userRepository.count()).thenReturn(10L);
        lenient().when(userRepository.findByEmail("admin@velora.example")).thenReturn(Optional.of(new UserEntity()));
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    public void testRegister_Success() {
        AuthRegisterRequest req = new AuthRegisterRequest(
                "Test User", "test@example.com", "Password@123", "1234567890", UserRoleType.CUSTOMER
        );

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPassword");
        when(jwtService.generateToken(any(UserEntity.class))).thenReturn("mockToken");

        AuthResponse response = authService.register(req);

        assertNotNull(response);
        assertEquals("mockToken", response.accessToken());
        assertEquals("Test User", response.user().displayName());
        verify(userRepository, times(1)).save(any(UserEntity.class));
    }

    @Test
    public void testRegister_AlreadyExists() {
        AuthRegisterRequest req = new AuthRegisterRequest(
                "Test User", "test@example.com", "Password@123", "1234567890", UserRoleType.CUSTOMER
        );

        UserEntity existing = new UserEntity();
        existing.setEmail("test@example.com");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existing));

        assertThrows(ResponseStatusException.class, () -> {
            authService.register(req);
        });
    }

    @Test
    public void testLogin_Success() {
        AuthLoginRequest req = new AuthLoginRequest("test@example.com", "Password@123");

        UserEntity user = new UserEntity();
        user.setEmail("test@example.com");
        user.setPasswordHash("encodedPassword");
        user.setDisplayName("Test User");
        user.setRole(UserRoleType.CUSTOMER);
        user.setActive(true);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password@123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(any(UserEntity.class))).thenReturn("mockToken");

        AuthResponse response = authService.login(req);

        assertNotNull(response);
        assertEquals("mockToken", response.accessToken());
    }

    @Test
    public void testLogin_InactiveUser() {
        AuthLoginRequest req = new AuthLoginRequest("test@example.com", "Password@123");

        UserEntity user = new UserEntity();
        user.setEmail("test@example.com");
        user.setPasswordHash("encodedPassword");
        user.setActive(false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThrows(ResponseStatusException.class, () -> {
            authService.login(req);
        });
    }
}
