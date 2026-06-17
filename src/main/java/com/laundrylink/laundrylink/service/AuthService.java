package com.laundrylink.laundrylink.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.laundrylink.laundrylink.api.AuthLoginRequest;
import com.laundrylink.laundrylink.api.AuthRegisterRequest;
import com.laundrylink.laundrylink.api.AuthResponse;
import com.laundrylink.laundrylink.api.AuthenticatedUserView;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final Map<String, RegisteredAccount> accountsByEmail = new ConcurrentHashMap<>();
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        seedDefaultAccounts();
    }

    public AuthResponse register(AuthRegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (accountsByEmail.containsKey(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        RegisteredAccount account = new RegisteredAccount(
                request.displayName(),
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.phoneNumber(),
                request.role());
        accountsByEmail.put(normalizedEmail, account);
        return buildResponse(account);
    }

    public AuthResponse login(AuthLoginRequest request) {
        RegisteredAccount account = requireAccount(request.email());
        if (!passwordEncoder.matches(request.password(), account.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return buildResponse(account);
    }

    public AuthenticatedPrincipal authenticate(String email) {
        RegisteredAccount account = requireAccount(email);
        return new AuthenticatedPrincipal(account.displayName(), account.email(), account.phoneNumber(), account.role());
    }

    private RegisteredAccount requireAccount(String email) {
        RegisteredAccount account = accountsByEmail.get(normalizeEmail(email));
        if (account == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return account;
    }

    private AuthResponse buildResponse(RegisteredAccount account) {
        return new AuthResponse(
                jwtService.generateToken(account),
                "Bearer",
                jwtService.tokenTtlSeconds(),
                new AuthenticatedUserView(
                        account.displayName(),
                        account.email(),
                        account.phoneNumber(),
                        account.role()));
    }

    private void seedDefaultAccounts() {
        registerSeed("Aarav Mehta", "aarav@example.com", "Password@123", "+91-90000-10001", UserRoleType.CUSTOMER);
        registerSeed("FreshFold Laundry", "partner@freshfold.example", "Password@123", "+91-90000-20002",
                UserRoleType.LAUNDRY_PARTNER);
        registerSeed("Ravi Singh", "ravi.delivery@example.com", "Password@123", "+91-90000-30003",
                UserRoleType.DELIVERY_PARTNER);
        registerSeed("LaundryLink Admin", "admin@laundrylink.example", "Password@123", "+91-90000-40004",
                UserRoleType.ADMIN);
    }

    private void registerSeed(String displayName, String email, String password, String phoneNumber, UserRoleType role) {
        String normalizedEmail = normalizeEmail(email);
        accountsByEmail.putIfAbsent(normalizedEmail,
                new RegisteredAccount(displayName, normalizedEmail, passwordEncoder.encode(password), phoneNumber, role));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}