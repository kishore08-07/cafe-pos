package com.example.cafeposbackend.identity;

import com.example.cafeposbackend.common.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class UserDtos {
  private UserDtos() {}

  public record CreateUserRequest(
      @NotBlank String name,
      @Email @NotBlank String email,
      @Size(min = 8) String password,
      @NotNull Role role) {}

  public record UpdateUserRequest(
      @NotBlank String name,
      @Email @NotBlank String email,
      @NotNull Role role,
      @NotNull Boolean active) {}

  public record ChangePasswordRequest(@Size(min = 8) String password) {}

  public record UserResponse(Long id, String name, String email, Role role, boolean active) {}
}
