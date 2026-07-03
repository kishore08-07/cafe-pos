package com.example.cafeposbackend.kds;

import com.example.cafeposbackend.common.enums.KdsItemStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class KdsDtos {
  private KdsDtos() {}

  public record KdsFilter(KdsItemStatus stage, String product, Long categoryId) {}

  public record KdsItemResponse(
      Long id, Long productId, String productName, BigDecimal quantity, KdsItemStatus status) {}

  public record KdsTicketResponse(
      Long orderId,
      String orderNumber,
      String tableNumber,
      Long employeeId,
      KdsItemStatus stage,
      LocalDateTime createdAt,
      List<KdsItemResponse> items) {}
}
