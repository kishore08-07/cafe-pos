package com.example.cafeposbackend.customerdisplay;

import com.example.cafeposbackend.common.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;

public final class CustomerDisplayDtos {
  private CustomerDisplayDtos() {}

  public record CustomerDisplayState(
      Long orderId,
      String orderNumber,
      OrderStatus status,
      BigDecimal total,
      String message,
      Instant updatedAt) {
    public static CustomerDisplayState empty() {
      return new CustomerDisplayState(
          null, null, null, BigDecimal.ZERO, "Waiting for order", Instant.now());
    }
  }
}
