package com.example.cafeposbackend.paymentmethod;

import com.example.cafeposbackend.common.enums.PaymentMethodType;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
  List<PaymentMethod> findByEnabledTrue();

  Optional<PaymentMethod> findByType(PaymentMethodType type);
}
