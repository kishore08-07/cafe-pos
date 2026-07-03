package com.example.cafeposbackend.order;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.KdsItemStatus;
import com.example.cafeposbackend.discount.Promotion;
import com.example.cafeposbackend.product.Product;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "order_line")
@Getter
@Setter
@NoArgsConstructor
public class OrderLine extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "promotion_id")
  private Promotion promotion;

  @Column(nullable = false, precision = 10, scale = 3)
  private BigDecimal quantity;

  @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
  private BigDecimal unitPrice;

  @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
  private BigDecimal discountAmount = BigDecimal.ZERO;

  @Column(name = "line_total", nullable = false, precision = 10, scale = 2)
  private BigDecimal lineTotal;

  @Enumerated(EnumType.STRING)
  @Column(name = "kds_item_status", nullable = false)
  private KdsItemStatus kdsItemStatus = KdsItemStatus.TO_COOK;
}
