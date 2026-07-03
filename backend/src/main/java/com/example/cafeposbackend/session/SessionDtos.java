package com.example.cafeposbackend.session;

import com.example.cafeposbackend.common.enums.SessionStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class SessionDtos {
  private SessionDtos() {}

  public record OpenSessionRequest(BigDecimal openingAmount) {}

  public record SessionResponse(
      Long id,
      Long employeeId,
      String employeeName,
      LocalDateTime openedAt,
      LocalDateTime closedAt,
      BigDecimal openingAmount,
      BigDecimal closingAmount,
      SessionStatus status) {}

  public record SessionSummaryResponse(
      SessionResponse session, long totalOrders, BigDecimal revenue, BigDecimal expectedCash) {}
}
