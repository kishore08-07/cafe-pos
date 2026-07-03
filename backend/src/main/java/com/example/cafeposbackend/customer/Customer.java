package com.example.cafeposbackend.customer;

import com.example.cafeposbackend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer")
@Getter
@Setter
@NoArgsConstructor
public class Customer extends BaseEntity {
  @Column(nullable = false)
  private String name;

  private String email;
  private String phone;
}
