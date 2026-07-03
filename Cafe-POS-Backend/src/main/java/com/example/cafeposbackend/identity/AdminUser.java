package com.example.cafeposbackend.identity;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "admin_user")
@Getter
@Setter
@NoArgsConstructor
public class AdminUser extends BaseEntity {
  @Column(nullable = false)
  private String name;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @Column(nullable = false)
  private boolean active = true;
}
