package com.example.cafeposbackend.common.config;

import com.example.cafeposbackend.common.util.JwtUtil;
import com.example.cafeposbackend.identity.AdminUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtUtil jwtUtil;
  private final AdminUserRepository userRepository;

  public JwtAuthenticationFilter(JwtUtil jwtUtil, AdminUserRepository userRepository) {
    this.jwtUtil = jwtUtil;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String authorization = request.getHeader("Authorization");
    if (authorization != null
        && authorization.startsWith("Bearer ")
        && SecurityContextHolder.getContext().getAuthentication() == null) {
      try {
        JwtUtil.Claims claims = jwtUtil.verify(authorization.substring(7), "access");
        userRepository
            .findById(claims.userId())
            .filter(user -> user.isActive() && user.getEmail().equals(claims.email()))
            .ifPresent(
                user ->
                    SecurityContextHolder.getContext()
                        .setAuthentication(
                            new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                List.of(
                                    new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))));
      } catch (IllegalArgumentException ignored) {
        SecurityContextHolder.clearContext();
      }
    }
    chain.doFilter(request, response);
  }
}
