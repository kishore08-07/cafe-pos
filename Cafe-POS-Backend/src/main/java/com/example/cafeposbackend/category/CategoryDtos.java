package com.example.cafeposbackend.category;

import jakarta.validation.constraints.NotBlank;

public final class CategoryDtos {
  private CategoryDtos() {}

  public record CategoryRequest(@NotBlank String name, @NotBlank String colorHex) {}

  public record CategoryResponse(Long id, String name, String colorHex) {}
}
