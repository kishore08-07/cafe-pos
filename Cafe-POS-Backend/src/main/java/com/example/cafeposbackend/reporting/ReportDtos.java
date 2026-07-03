package com.example.cafeposbackend.reporting;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class ReportDtos {
  private ReportDtos() {}

  public enum Period {
    TODAY,
    THIS_WEEK,
    THIS_MONTH,
    CUSTOM
  }

  public record ReportFilter(
      Period period,
      LocalDate from,
      LocalDate to,
      Long employeeId,
      Long sessionId,
      Long productId) {}

  public record DashboardSummary(
      long totalOrders, BigDecimal revenue, BigDecimal averageOrderValue) {}

  public record SalesTrendPoint(LocalDate date, long orderCount, BigDecimal revenue) {}

  public record CategorySales(Long categoryId, String categoryName, BigDecimal revenue) {}

  public record ProductSales(
      Long productId, String productName, BigDecimal quantity, BigDecimal revenue) {}

  public record OrderSummary(
      Long orderId, String orderNumber, BigDecimal total, LocalDate date, String employeeName) {}
}
