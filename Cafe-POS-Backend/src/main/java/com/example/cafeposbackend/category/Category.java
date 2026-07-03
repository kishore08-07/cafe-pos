package com.example.cafeposbackend.category;

import com.example.cafeposbackend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "category")
@Getter
@Setter
@NoArgsConstructor
public class Category extends BaseEntity {
  @Column(nullable = false)
  private String name;

  @Column(name = "color_hex", nullable = false)
  private String colorHex;
}
