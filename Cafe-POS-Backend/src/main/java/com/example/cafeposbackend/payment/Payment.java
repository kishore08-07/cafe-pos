package com.example.cafeposbackend.payment;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.PaymentStatus;
import com.example.cafeposbackend.order.Order;
import com.example.cafeposbackend.paymentmethod.PaymentMethod;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor
public class Payment extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "payment_method_id", nullable = false)
  private PaymentMethod paymentMethod;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal amount;

  @Column(name = "reference_number")
  private String referenceNumber;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentStatus status;

  @Column(name = "paid_at")
  private LocalDateTime paidAt;
}
