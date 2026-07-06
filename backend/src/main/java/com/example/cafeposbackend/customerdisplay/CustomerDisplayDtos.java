package com.example.cafeposbackend.customerdisplay;

import com.example.cafeposbackend.common.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class CustomerDisplayDtos {
  private CustomerDisplayDtos() {}

  public record CustomerDisplayLine(
      Long id, String productName, BigDecimal quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}

  public record CustomerDisplayState(
      Long orderId,
      String orderNumber,
      OrderStatus status,
      List<CustomerDisplayLine> lines,
      BigDecimal subtotal,
      BigDecimal taxTotal,
      BigDecimal discountTotal,
      BigDecimal total,
      String paymentMethod,
      String upiQrCode,
      String message,
      Instant updatedAt) {
    public static CustomerDisplayState empty() {
      return new CustomerDisplayState(
          null,
          null,
          null,
          List.of(),
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          null,
          null,
          "Waiting for order",
          Instant.now());
    }
  }
}
