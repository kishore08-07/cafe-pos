package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.common.enums.DiscountType;
import com.example.cafeposbackend.common.enums.PromotionAppliesTo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class DiscountDtos {
  private DiscountDtos() {}

  public record CouponRequest(
      @NotBlank String code,
      @NotNull DiscountType discountType,
      @NotNull @DecimalMin("0.00") BigDecimal discountValue,
      @DecimalMin("0.00") BigDecimal minOrderAmount,
      Boolean active) {}

  public record CouponResponse(
      Long id,
      String code,
      DiscountType discountType,
      BigDecimal discountValue,
      BigDecimal minOrderAmount,
      boolean active) {}

  public record CouponValidationRequest(@NotBlank String code, @NotNull BigDecimal orderTotal) {}

  public record PromotionRequest(
      @NotBlank String name,
      @NotNull PromotionAppliesTo appliesTo,
      Long productId,
      Integer minQuantity,
      BigDecimal minOrderAmount,
      @NotNull DiscountType discountType,
      @NotNull BigDecimal discountValue,
      Boolean active) {}

  public record PromotionResponse(
      Long id,
      String name,
      PromotionAppliesTo appliesTo,
      Long productId,
      Integer minQuantity,
      BigDecimal minOrderAmount,
      DiscountType discountType,
      BigDecimal discountValue,
      boolean active) {}

  public record CartItem(Long productId, BigDecimal quantity, BigDecimal lineTotal) {}

  public record EvaluationContext(List<CartItem> items, BigDecimal subtotal) {}

  public record DiscountResult(
      Long sourceId, String source, DiscountType type, BigDecimal value, BigDecimal amount) {}
}
