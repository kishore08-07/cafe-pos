package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.DiscountType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "coupon")
@Getter
@Setter
@NoArgsConstructor
public class Coupon extends BaseEntity {
  @Column(nullable = false, unique = true)
  private String code;

  @Enumerated(EnumType.STRING)
  @Column(name = "discount_type", nullable = false)
  private DiscountType discountType;

  @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
  private BigDecimal discountValue;

  @Column(name = "min_order_amount", precision = 10, scale = 2)
  private BigDecimal minOrderAmount;

  @Column(nullable = false, columnDefinition = "boolean default true")
  private boolean active = true;
}
