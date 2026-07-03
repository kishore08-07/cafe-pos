package com.example.cafeposbackend.floor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class FloorDtos {
  private FloorDtos() {}

  public record FloorRequest(@NotBlank String name) {}

  public record TableRequest(
      @NotBlank String tableNumber, @NotNull @Min(1) Integer seats, Boolean active) {}

  public record TableResponse(
      Long id,
      Long floorId,
      String tableNumber,
      Integer seats,
      boolean active,
      Long occupiedById,
      String occupiedByName) {}

  public record FloorResponse(Long id, String name, List<TableResponse> tables) {}

  public record TableStatusResponse(
      Long tableId,
      boolean occupied,
      Long occupiedById,
      String occupiedByName,
      Long activeOrderId) {}
}
