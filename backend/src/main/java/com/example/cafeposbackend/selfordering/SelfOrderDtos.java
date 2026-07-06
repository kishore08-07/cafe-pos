package com.example.cafeposbackend.selfordering;

import com.example.cafeposbackend.common.enums.KdsItemStatus;
import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.common.enums.SelfOrderingMode;
import com.example.cafeposbackend.order.OrderDtos.OrderLineRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;

public final class SelfOrderDtos {
  private SelfOrderDtos() {}

  public record SelfOrderConfigRequest(
      SelfOrderingMode mode, Boolean enabled, String backgroundColor, String backgroundImageUrl) {}

  public record SelfOrderConfigResponse(
      Long id,
      SelfOrderingMode mode,
      boolean enabled,
      String backgroundColor,
      String backgroundImageUrl) {}

  public record TableTokenResponse(Long tableId, String tableNumber, String token) {}

  public record SelfOrderRequest(String couponCode, @NotEmpty List<@Valid OrderLineRequest> lines) {}

  public record SelfOrderResponse(
      Long orderId, String orderNumber, Long tableId, BigDecimal total, OrderStatus status) {}

  public record OrderStatusResponse(
      Long orderId, String orderNumber, OrderStatus status, KdsItemStatus kitchenStage) {}
}
