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
    private final org.springframework.mail.javamail.JavaMailSender mailSender;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this(userRepository, passwordEncoder, jwtService, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AuthService(
            UserRepository userRepository, 
            PasswordEncoder passwordEncoder, 
            JwtService jwtService,
            @org.springframework.beans.factory.annotation.Autowired(required = false) org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailSender = mailSender;
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
        
        if (request.role() == UserRoleType.CUSTOMER) {
            // Generate and configure OTP verification
            String otp = generateOtp();
            account.setOtpCode(otp);
            account.setOtpExpiryTime(java.time.Instant.now().getEpochSecond() + 300); // 5 minutes
            account.setOtpResendCount(0);
            account.setOtpInvalidAttempts(0);
            account.setEmailVerified(false);

            userRepository.save(account);
            sendOtpEmail(account.getEmail(), otp);
        } else {
            // Delivery and Laundry partners do not need OTP verification
            account.setOtpCode(null);
            account.setOtpExpiryTime(null);
            account.setOtpResendCount(0);
            account.setOtpInvalidAttempts(0);
            account.setEmailVerified(true);

            userRepository.save(account);
        }

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
        
        // Auto-verify email/account on successful login
        if (!account.isEmailVerified()) {
            account.setEmailVerified(true);
            userRepository.saveAndFlush(account);
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

    public AuthResponse verifyOtp(com.laundrylink.laundrylink.api.VerifyOtpRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        UserEntity user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.isEmailVerified()) {
            return buildResponse(user);
        }

        if (user.getOtpInvalidAttempts() >= 5) {
            user.setOtpCode(null);
            user.setOtpExpiryTime(null);
            userRepository.saveAndFlush(user);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many invalid verification attempts. Please request a new OTP code.");
        }

        if (user.getOtpCode() == null || user.getOtpExpiryTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No verification code requested. Please request a new one.");
        }

        if (java.time.Instant.now().getEpochSecond() > user.getOtpExpiryTime()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code has expired. Please request a new one.");
        }

        if (!user.getOtpCode().equals(request.otpCode())) {
            user.setOtpInvalidAttempts(user.getOtpInvalidAttempts() + 1);
            userRepository.saveAndFlush(user);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code.");
        }

        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiryTime(null);
        user.setOtpResendCount(0);
        user.setOtpInvalidAttempts(0);
        userRepository.saveAndFlush(user);

        return buildResponse(user);
    }

    public void resendOtp(com.laundrylink.laundrylink.api.ResendOtpRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        UserEntity user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already verified.");
        }

        if (user.getOtpResendCount() >= 3) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Resend limits reached. Maximum of 3 resends allowed.");
        }

        String code = generateOtp();
        user.setOtpCode(code);
        user.setOtpExpiryTime(java.time.Instant.now().getEpochSecond() + 300);
        user.setOtpResendCount(user.getOtpResendCount() + 1);
        user.setOtpInvalidAttempts(0); // Reset invalid attempts when resending a new code
        userRepository.saveAndFlush(user);

        sendOtpEmail(user.getEmail(), code);
    }

    private String generateOtp() {
        int code = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(code);
    }

    private void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "Velora Account Verification Code";
        String body = "Welcome to Velora!\n\nYour 6-digit verification code is: " + otpCode + "\n\nThis code will expire in 5 minutes.";
        
        System.out.println("[OTP SIMULATION] Email dispatch to: " + toEmail + " | Code: " + otpCode);
        
        if (mailSender != null) {
            try {
                org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                System.out.println("[SMTP] OTP email successfully sent to: " + toEmail);
            } catch (Exception e) {
                System.err.println("[SMTP ERROR] Failed to send OTP email to: " + toEmail + ". Error: " + e.getMessage());
            }
        } else {
            System.out.println("[SMTP WARNING] Mail sender not configured in application.properties. Using console fallback.");
        }
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
                        account.getRole(),
                        account.isTermsAccepted(),
                        account.getTermsAcceptanceTimestamp(),
                        account.getTermsAcceptedVersion(),
                        account.isEmailVerified()));
    }

    private void seedDefaultAccounts() {
        if (userRepository.findByEmail(normalizeEmail("admin@velora.example")).isEmpty()) {
            registerSeed("Velora Admin", "admin@velora.example", "Password@123", "+91-90000-40004",
                    UserRoleType.ADMIN);
        }
    }

    private void registerSeed(String displayName, String email, String password, String phoneNumber, UserRoleType role) {
        String normalizedEmail = normalizeEmail(email);
        if (userRepository.findByEmail(normalizedEmail).isEmpty()) {
            UserEntity user = new UserEntity(normalizedEmail, passwordEncoder.encode(password), displayName, phoneNumber, role);
            user.setEmailVerified(true);
            userRepository.save(user);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}