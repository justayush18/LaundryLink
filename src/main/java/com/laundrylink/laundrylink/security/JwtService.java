package com.laundrylink.laundrylink.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.persistence.UserEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class JwtService {

    private static final Duration TOKEN_TTL = Duration.ofHours(4);
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String SECRET = "LaundryLink-Phase3-JWT-Secret-Key-Replace-In-Prod";
    private static final String HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    public String generateToken(UserEntity account) {
        try {
            String payload = encodePayload(account);
            String headerPart = base64Url(HEADER_JSON.getBytes(StandardCharsets.UTF_8));
            String payloadPart = base64Url(payload.getBytes(StandardCharsets.UTF_8));
            String signaturePart = base64Url(sign(headerPart + "." + payloadPart));
            return headerPart + "." + payloadPart + "." + signaturePart;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to create JWT", exception);
        }
    }

    public AuthenticatedPrincipal toPrincipal(String token) {
        JwtPayload payload = validateAndDecode(token);
        return new AuthenticatedPrincipal(payload.name(), payload.sub(), payload.phoneNumber(), UserRoleType.valueOf(payload.role()));
    }

    public long tokenTtlSeconds() {
        return TOKEN_TTL.toSeconds();
    }

    private JwtPayload validateAndDecode(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid JWT");
            }
            byte[] expectedSignature = sign(parts[0] + "." + parts[1]);
            byte[] providedSignature = Base64.getUrlDecoder().decode(parts[2]);
            if (!MessageDigest.isEqual(expectedSignature, providedSignature)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid JWT signature");
            }

            String payloadValue = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JwtPayload payload = decodePayload(payloadValue);
            if (payload.exp() <= Instant.now().getEpochSecond()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "JWT expired");
            }
            return payload;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid JWT", exception);
        }
    }

    private String encodePayload(UserEntity account) {
        long issuedAt = Instant.now().getEpochSecond();
        long expiresAt = Instant.now().plus(TOKEN_TTL).getEpochSecond();
        return String.join("|",
                escape(account.getEmail()),
                escape(account.getDisplayName()),
                escape(account.getPhoneNumber()),
                escape(account.getRole().name()),
                Long.toString(issuedAt),
                Long.toString(expiresAt));
    }

    private JwtPayload decodePayload(String payload) {
        String[] parts = payload.split("\\|", -1);
        if (parts.length != 6) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid JWT payload");
        }
        return new JwtPayload(
                unescape(parts[0]),
                unescape(parts[1]),
                unescape(parts[2]),
                unescape(parts[3]),
                parseLong(parts[4]),
                parseLong(parts[5]));
    }

    private long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid JWT payload", exception);
        }
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("|", "\\|");
    }

    private String unescape(String value) {
        StringBuilder builder = new StringBuilder();
        boolean escaped = false;
        for (char character : value.toCharArray()) {
            if (escaped) {
                builder.append(character);
                escaped = false;
            } else if (character == '\\') {
                escaped = true;
            } else {
                builder.append(character);
            }
        }
        return builder.toString();
    }

    private byte[] sign(String data) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private record JwtPayload(String sub, String name, String phoneNumber, String role, long iat, long exp) {
    }
}