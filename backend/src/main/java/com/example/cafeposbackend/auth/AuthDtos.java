package com.example.cafeposbackend.auth;

import com.example.cafeposbackend.common.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
  private AuthDtos() {}

  public record SignupRequest(
      @NotBlank String name,
      @Email @NotBlank String email,
      @Size(min = 8) String password,
      Role role) {}

  public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

  public record RefreshRequest(@NotBlank String refreshToken) {}

  public record AuthResponse(
      Long userId, String name, String email, Role role, String accessToken, String refreshToken) {}
}
