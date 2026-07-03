package com.example.cafeposbackend.common.util;

import com.example.cafeposbackend.common.enums.Role;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
  private final byte[] secret;
  private final long accessSeconds;
  private final long refreshSeconds;

  public JwtUtil(
      @Value("${app.jwt.secret:change-this-development-secret-at-least-32-characters}")
          String secret,
      @Value("${app.jwt.access-seconds:3600}") long accessSeconds,
      @Value("${app.jwt.refresh-seconds:604800}") long refreshSeconds) {
    this.secret = secret.getBytes(StandardCharsets.UTF_8);
    this.accessSeconds = accessSeconds;
    this.refreshSeconds = refreshSeconds;
  }

  public String accessToken(Long userId, String email, Role role) {
    return token(userId, email, role, "access", accessSeconds);
  }

  public String refreshToken(Long userId, String email, Role role) {
    return token(userId, email, role, "refresh", refreshSeconds);
  }

  public Claims verify(String token, String requiredType) {
    String[] parts = token.split("\\.");
    if (parts.length != 3 || !constantTimeEquals(parts[2], sign(parts[0] + "." + parts[1]))) {
      throw new IllegalArgumentException("Invalid token");
    }
    String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
    String[] values = payload.split("\\|", -1);
    if (values.length != 7
        || !requiredType.equals(values[4])
        || Instant.now().getEpochSecond() >= Long.parseLong(values[5])) {
      throw new IllegalArgumentException("Expired or invalid token");
    }
    return new Claims(
        Long.parseLong(values[0]), values[1], Role.valueOf(values[2]), values[4], values[5]);
  }

  private String token(Long userId, String email, Role role, String type, long ttl) {
    String header = encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
    long issuedAt = Instant.now().getEpochSecond();
    String payload =
        encode(
            userId
                + "|"
                + email
                + "|"
                + role.name()
                + "|"
                + issuedAt
                + "|"
                + type
                + "|"
                + (issuedAt + ttl)
                + "|"
                + UUID.randomUUID());
    return header + "." + payload + "." + sign(header + "." + payload);
  }

  private String sign(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret, "HmacSHA256"));
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to sign token", ex);
    }
  }

  private String encode(String value) {
    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(value.getBytes(StandardCharsets.UTF_8));
  }

  private boolean constantTimeEquals(String left, String right) {
    return java.security.MessageDigest.isEqual(
        left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
  }

  public record Claims(Long userId, String email, Role role, String type, String expiresAt) {}
}
