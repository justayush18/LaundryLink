package com.laundrylink.laundrylink.persistence;

import com.laundrylink.laundrylink.api.UserRoleType;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class UserEntity extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRoleType role;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean termsAccepted = false;

    private Long termsAcceptanceTimestamp;

    private String termsAcceptedVersion;

    @Column(nullable = false)
    private boolean emailVerified = true;

    private String otpCode;

    private Long otpExpiryTime;

    private int otpResendCount = 0;

    private int otpInvalidAttempts = 0;

    public UserEntity() {}

    public UserEntity(String email, String passwordHash, String displayName, String phoneNumber, UserRoleType role) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public UserRoleType getRole() {
        return role;
    }

    public void setRole(UserRoleType role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    private boolean online = false;

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public boolean isTermsAccepted() {
        return termsAccepted;
    }

    public void setTermsAccepted(boolean termsAccepted) {
        this.termsAccepted = termsAccepted;
    }

    public Long getTermsAcceptanceTimestamp() {
        return termsAcceptanceTimestamp;
    }

    public void setTermsAcceptanceTimestamp(Long termsAcceptanceTimestamp) {
        this.termsAcceptanceTimestamp = termsAcceptanceTimestamp;
    }

    public String getTermsAcceptedVersion() {
        return termsAcceptedVersion;
    }

    public void setTermsAcceptedVersion(String termsAcceptedVersion) {
        this.termsAcceptedVersion = termsAcceptedVersion;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public Long getOtpExpiryTime() {
        return otpExpiryTime;
    }

    public void setOtpExpiryTime(Long otpExpiryTime) {
        this.otpExpiryTime = otpExpiryTime;
    }

    public int getOtpResendCount() {
        return otpResendCount;
    }

    public void setOtpResendCount(int otpResendCount) {
        this.otpResendCount = otpResendCount;
    }

    public int getOtpInvalidAttempts() {
        return otpInvalidAttempts;
    }

    public void setOtpInvalidAttempts(int otpInvalidAttempts) {
        this.otpInvalidAttempts = otpInvalidAttempts;
    }
}
