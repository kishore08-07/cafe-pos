package com.example.cafeposbackend.floor;

import com.example.cafeposbackend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "floor")
@Getter
@Setter
@NoArgsConstructor
public class Floor extends BaseEntity {
  @Column(nullable = false)
  private String name;
}
