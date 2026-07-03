package com.example.cafeposbackend.reporting.dto;

import java.math.BigDecimal;

public record SummaryProjection(long totalOrders, BigDecimal revenue, BigDecimal avgOrderValue) {
  public SummaryProjection(Long totalOrders, BigDecimal revenue, Double avgOrderValue) {
    this(
        totalOrders == null ? 0L : totalOrders,
        revenue == null ? BigDecimal.ZERO : revenue,
        avgOrderValue == null ? BigDecimal.ZERO : BigDecimal.valueOf(avgOrderValue));
  }
}
