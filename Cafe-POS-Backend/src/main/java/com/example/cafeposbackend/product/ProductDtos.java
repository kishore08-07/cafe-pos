package com.example.cafeposbackend.product;

import com.example.cafeposbackend.common.enums.UnitOfMeasure;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public final class ProductDtos {
  private ProductDtos() {}

  public record ProductRequest(
      @NotBlank String name,
      @NotNull Long categoryId,
      Long taxId,
      @DecimalMin("0.00") BigDecimal taxRate,
      @NotNull @DecimalMin("0.00") BigDecimal price,
      @NotNull UnitOfMeasure unitOfMeasure,
      String description,
      Boolean showOnKds) {}

  public record ProductResponse(
      Long id,
      String name,
      Long categoryId,
      String categoryName,
      Long taxId,
      BigDecimal taxRate,
      BigDecimal price,
      UnitOfMeasure unitOfMeasure,
      String description,
      boolean showOnKds) {}
}
