package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.*;
import com.example.cafeposbackend.product.Product;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "promotion")
@Getter
@Setter
@NoArgsConstructor
public class Promotion extends BaseEntity {
  @Column(nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(name = "applies_to", nullable = false)
  private PromotionAppliesTo appliesTo;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id")
  private Product product;

  @Column(name = "min_quantity")
  private Integer minQuantity;

  @Column(name = "min_order_amount", precision = 10, scale = 2)
  private BigDecimal minOrderAmount;

  @Enumerated(EnumType.STRING)
  @Column(name = "discount_type", nullable = false)
  private DiscountType discountType;

  @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
  private BigDecimal discountValue;

  @Column(nullable = false, columnDefinition = "boolean default true")
  private boolean active = true;
}
