package com.example.cafeposbackend.tax;

import com.example.cafeposbackend.common.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "tax")
@Getter
@Setter
@NoArgsConstructor
public class Tax extends BaseEntity {
  @Column(nullable = false)
  private String name;

  @Column(name = "rate_percent", nullable = false, precision = 5, scale = 2)
  private BigDecimal ratePercent;
}
