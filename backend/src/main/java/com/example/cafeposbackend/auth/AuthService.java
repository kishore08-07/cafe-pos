package com.example.cafeposbackend.auth;

import com.example.cafeposbackend.auth.AuthDtos.AuthResponse;
import com.example.cafeposbackend.auth.AuthDtos.LoginRequest;
import com.example.cafeposbackend.auth.AuthDtos.SignupRequest;

public interface AuthService {
  AuthResponse signup(SignupRequest request);

  AuthResponse login(LoginRequest request);

  AuthResponse refreshToken(String refreshToken);

  void logout(String refreshToken);
}
