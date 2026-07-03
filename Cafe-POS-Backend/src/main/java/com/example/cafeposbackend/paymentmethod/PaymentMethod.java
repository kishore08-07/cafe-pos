package com.example.cafeposbackend.paymentmethod;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.PaymentMethodType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payment_method")
@Getter
@Setter
@NoArgsConstructor
public class PaymentMethod extends BaseEntity {
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, unique = true)
  private PaymentMethodType type;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "upi_id")
  private String upiId;
}
