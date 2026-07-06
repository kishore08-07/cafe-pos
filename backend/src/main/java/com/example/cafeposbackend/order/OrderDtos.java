package com.example.cafeposbackend.order;

import com.example.cafeposbackend.common.enums.KdsItemStatus;
import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.common.enums.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {
  private OrderDtos() {}

  public record OrderLineRequest(
      @NotNull Long productId, @NotNull @DecimalMin("0.001") BigDecimal quantity) {}

  public record OrderRequest(
      Long orderId, Long customerId, @NotEmpty List<@Valid OrderLineRequest> lines) {}

  public record DiscountRequest(@NotNull String couponCode) {}

  public record PaymentRequest(
      @NotNull Long paymentMethodId,
      @NotNull @DecimalMin("0.01") BigDecimal amount,
      String referenceNumber) {}

  public record ReceiptEmailRequest(@Email @NotBlank String email) {}

  public record OrderFilter(Long sessionId, OrderStatus status, LocalDate from, LocalDate to) {}

  public record OrderLineResponse(
      Long id,
      Long productId,
      String productName,
      BigDecimal quantity,
      BigDecimal unitPrice,
      BigDecimal taxRate,
      BigDecimal discountAmount,
      BigDecimal lineTotal,
      KdsItemStatus kdsStatus) {}

  public record PaymentResponse(
      Long id,
      Long paymentMethodId,
      BigDecimal amount,
      String referenceNumber,
      PaymentStatus status,
      LocalDateTime paidAt) {}

  public record OrderResponse(
      Long id,
      String orderNumber,
      Long sessionId,
      Long tableId,
      Long customerId,
      Long employeeId,
      OrderStatus status,
      boolean sentToKitchen,
      BigDecimal subtotal,
      BigDecimal taxTotal,
      BigDecimal discountTotal,
      BigDecimal totalAmount,
      LocalDateTime createdAt,
      List<OrderLineResponse> lines,
      List<PaymentResponse> payments) {}
}
