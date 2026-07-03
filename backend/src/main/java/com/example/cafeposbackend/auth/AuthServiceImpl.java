package com.example.cafeposbackend.auth;

import com.example.cafeposbackend.auth.AuthDtos.AuthResponse;
import com.example.cafeposbackend.auth.AuthDtos.LoginRequest;
import com.example.cafeposbackend.auth.AuthDtos.SignupRequest;
import com.example.cafeposbackend.common.enums.Role;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.util.JwtUtil;
import com.example.cafeposbackend.identity.AdminUser;
import com.example.cafeposbackend.identity.AdminUserRepository;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {
  private final AdminUserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final Set<String> revokedRefreshTokens = ConcurrentHashMap.newKeySet();

  public AuthServiceImpl(
      AdminUserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
  }

  @Override
  @Transactional
  public AuthResponse signup(SignupRequest request) {
    String email = request.email().trim().toLowerCase();
    if (userRepository.existsByEmail(email)) {
      throw new BusinessRuleException("Email is already registered");
    }
    AdminUser user = new AdminUser();
    user.setName(request.name().trim());
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(request.role() == null ? Role.ADMIN : request.role());
    return response(userRepository.save(user));
  }

  @Override
  public AuthResponse login(LoginRequest request) {
    AdminUser user =
        userRepository
            .findByEmail(request.email().trim().toLowerCase())
            .filter(AdminUser::isActive)
            .orElseThrow(() -> new BusinessRuleException("Invalid credentials"));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new BusinessRuleException("Invalid credentials");
    }
    return response(user);
  }

  @Override
  public AuthResponse refreshToken(String refreshToken) {
    if (revokedRefreshTokens.contains(refreshToken)) {
      throw new BusinessRuleException("Refresh token has been revoked");
    }
    JwtUtil.Claims claims = jwtUtil.verify(refreshToken, "refresh");
    AdminUser user =
        userRepository
            .findById(claims.userId())
            .filter(AdminUser::isActive)
            .orElseThrow(() -> new BusinessRuleException("User is inactive"));
    revokedRefreshTokens.add(refreshToken);
    return response(user);
  }

  @Override
  public void logout(String refreshToken) {
    jwtUtil.verify(refreshToken, "refresh");
    revokedRefreshTokens.add(refreshToken);
  }

  private AuthResponse response(AdminUser user) {
    return new AuthResponse(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getRole(),
        jwtUtil.accessToken(user.getId(), user.getEmail(), user.getRole()),
        jwtUtil.refreshToken(user.getId(), user.getEmail(), user.getRole()));
  }
}
