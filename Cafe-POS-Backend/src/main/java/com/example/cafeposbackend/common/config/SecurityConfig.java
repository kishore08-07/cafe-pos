package com.example.cafeposbackend.common.config;

import com.example.cafeposbackend.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter, JsonMapper jsonMapper)
      throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(
            handling ->
                handling
                    .authenticationEntryPoint(
                        (request, response, exception) -> {
                          response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                          response.setContentType("application/json");
                          response
                              .getWriter()
                              .write(
                                  jsonMapper.writeValueAsString(
                                      ApiResponse.error(
                                          "UNAUTHORIZED", "Authentication is required", null)));
                        })
                    .accessDeniedHandler(
                        (request, response, exception) -> {
                          response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                          response.setContentType("application/json");
                          response
                              .getWriter()
                              .write(
                                  jsonMapper.writeValueAsString(
                                      ApiResponse.error(
                                          "ACCESS_DENIED", "Insufficient permission", null)));
                        }))
        .authorizeHttpRequests(
            requests ->
                requests
                    .requestMatchers(
                        "/",
                        "/error",
                        "/openapi.yaml",
                        "/api/auth/signup",
                        "/api/auth/login",
                        "/api/auth/refresh")
                    .permitAll()
                    .requestMatchers(
                        "/s/**",
                        "/customer-display",
                        "/api/self-order/menu/**",
                        "/api/self-order/order/**",
                        "/api/customer-display/**",
                        "/api/kds/**",
                        "/ws/kds/**",
                        "/ws/self-order/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/self-order/config")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/categories/**")
                    .hasAnyRole("ADMIN", "EMPLOYEE")
                    .requestMatchers(
                        HttpMethod.POST, "/api/products/**", "/api/categories/**", "/api/floors/**")
                    .hasRole("ADMIN")
                    .requestMatchers(
                        HttpMethod.PUT,
                        "/api/products/**",
                        "/api/categories/**",
                        "/api/floors/**",
                        "/api/tables/**")
                    .hasRole("ADMIN")
                    .requestMatchers(
                        HttpMethod.DELETE,
                        "/api/products/**",
                        "/api/categories/**",
                        "/api/floors/**",
                        "/api/tables/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/floors/**", "/api/tables/**")
                    .hasAnyRole("ADMIN", "EMPLOYEE")
                    .requestMatchers(HttpMethod.PUT, "/api/payment-methods/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/payment-methods/**")
                    .hasAnyRole("ADMIN", "EMPLOYEE")
                    .requestMatchers(HttpMethod.POST, "/api/coupons/validate")
                    .hasAnyRole("ADMIN", "EMPLOYEE")
                    .requestMatchers(HttpMethod.GET, "/api/coupons", "/api/promotions")
                    .hasAnyRole("ADMIN", "EMPLOYEE")
                    .requestMatchers(
                        "/api/users/**", "/api/reports/**", "/api/promotions/**", "/api/coupons/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/sessions")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/sessions/**", "/api/customers/**", "/api/orders/**")
                    .hasAnyRole("ADMIN", "EMPLOYEE")
                    .requestMatchers("/api/self-order/**")
                    .hasRole("ADMIN")
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(
      @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
          List<String> allowedOrigins) {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(allowedOrigins);
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
