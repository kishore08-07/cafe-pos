package com.example.cafeposbackend.common.util;

import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.identity.AdminUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
  public AdminUser require() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof AdminUser user)) {
      throw new BusinessRuleException("Authenticated user is required");
    }
    return user;
  }
}
