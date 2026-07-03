package com.example.cafeposbackend.identity;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
  Optional<AdminUser> findByEmail(String email);

  boolean existsByEmail(String email);

  List<AdminUser> findByActiveTrue();
}
