package com.example.cafeposbackend.auth;

import com.example.cafeposbackend.auth.AuthDtos.AuthResponse;
import com.example.cafeposbackend.auth.AuthDtos.LoginRequest;
import com.example.cafeposbackend.auth.AuthDtos.RefreshRequest;
import com.example.cafeposbackend.auth.AuthDtos.SignupRequest;
import com.example.cafeposbackend.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/signup")
  ApiResponse<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
    return ApiResponse.success(authService.signup(request));
  }

  @PostMapping("/login")
  ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.success(authService.login(request));
  }

  @PostMapping("/refresh")
  ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
    return ApiResponse.success(authService.refreshToken(request.refreshToken()));
  }

  @PostMapping("/logout")
  ApiResponse<Void> logout(@Valid @RequestBody RefreshRequest request) {
    authService.logout(request.refreshToken());
    return ApiResponse.ok();
  }
}
