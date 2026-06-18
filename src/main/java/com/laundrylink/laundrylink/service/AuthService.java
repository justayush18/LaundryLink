package com.laundrylink.laundrylink.service;

import com.laundrylink.laundrylink.api.AuthLoginRequest;
import com.laundrylink.laundrylink.api.AuthRegisterRequest;
import com.laundrylink.laundrylink.api.AuthResponse;
import com.laundrylink.laundrylink.api.AuthenticatedUserView;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.security.JwtService;
import com.laundrylink.laundrylink.persistence.UserRepository;
import com.laundrylink.laundrylink.persistence.UserEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        seedDefaultAccounts();
    }

    public AuthResponse register(AuthRegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        UserEntity account = new UserEntity(
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.displayName(),
                request.phoneNumber(),
                request.role());
        userRepository.save(account);
        return buildResponse(account);
    }

    public AuthResponse login(AuthLoginRequest request) {
        UserEntity account = requireAccount(request.email());
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is deactivated");
        }
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return buildResponse(account);
    }

    public AuthenticatedPrincipal authenticate(String email) {
        UserEntity account = requireAccount(email);
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is deactivated");
        }
        return new AuthenticatedPrincipal(account.getDisplayName(), account.getEmail(), account.getPhoneNumber(), account.getRole());
    }

    private UserEntity requireAccount(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    private AuthResponse buildResponse(UserEntity account) {
        return new AuthResponse(
                jwtService.generateToken(account),
                "Bearer",
                jwtService.tokenTtlSeconds(),
                new AuthenticatedUserView(
                        account.getDisplayName(),
                        account.getEmail(),
                        account.getPhoneNumber(),
                        account.getRole()));
    }

    private void seedDefaultAccounts() {
        if (userRepository.findByEmail(normalizeEmail("admin@velora.example")).isEmpty()) {
            registerSeed("Aarav Mehta", "aarav@example.com", "Password@123", "+91-90000-10001", UserRoleType.CUSTOMER);
            registerSeed("FreshFold Laundry", "partner@freshfold.example", "Password@123", "+91-90000-20002",
                    UserRoleType.LAUNDRY_PARTNER);
            registerSeed("Ravi Singh", "ravi.delivery@example.com", "Password@123", "+91-90000-30003",
                    UserRoleType.DELIVERY_PARTNER);
            registerSeed("Velora Admin", "admin@velora.example", "Password@123", "+91-90000-40004",
                    UserRoleType.ADMIN);
        }
    }

    private void registerSeed(String displayName, String email, String password, String phoneNumber, UserRoleType role) {
        String normalizedEmail = normalizeEmail(email);
        if (userRepository.findByEmail(normalizedEmail).isEmpty()) {
            userRepository.save(new UserEntity(normalizedEmail, passwordEncoder.encode(password), displayName, phoneNumber, role));
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}